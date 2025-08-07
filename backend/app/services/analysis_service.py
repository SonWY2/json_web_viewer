from typing import Dict, Any, List, Optional, Union
import statistics
import math
from collections import Counter
from datetime import datetime
import re
from ..core.task_manager import task_manager
from ..processors.jsonl_streamer import JSONLStreamer
from ..services.file_loader import file_loader_service
from ..models.file_info import DataType

class AnalysisService:
    """On-demand data analysis service"""
    
    def __init__(self):
        self.analysis_cache: Dict[str, Any] = {}
    
    def analyze_column(self, file_id: str, column: str) -> str:
        """Start column analysis task"""
        task_id = task_manager.submit_task(
            self._analyze_column_task,
            f"Analyze column '{column}'",
            file_id, column
        )
        return task_id
    
    def _analyze_column_task(self, task_id: str, file_id: str, column: str) -> Dict[str, Any]:
        """Background task for column analysis"""
        metadata = file_loader_service.get_file_metadata(file_id)
        if not metadata:
            raise ValueError(f"File not found: {file_id}")
        
        # Find column info
        column_info = None
        for col in metadata.columns:
            if col.name == column:
                column_info = col
                break
        
        if not column_info:
            raise ValueError(f"Column not found: {column}")
        
        task_manager.update_progress(task_id, 10)
        
        # Collect column values
        streamer = JSONLStreamer(metadata.file_path)
        values = []
        null_count = 0
        total_count = 0
        
        for record in streamer.stream_records():
            total_count += 1
            value = record.get(column)
            
            if value is None:
                null_count += 1
            else:
                values.append(value)
            
            # Update progress
            if total_count % 1000 == 0:
                progress = 10 + (total_count / metadata.total_records) * 70
                task_manager.update_progress(task_id, progress)
        
        task_manager.update_progress(task_id, 80)
        
        # Analyze based on data type
        analysis = {
            "column": column,
            "data_type": column_info.data_type.value,
            "total_records": total_count,
            "non_null_count": len(values),
            "null_count": null_count,
            "null_percentage": (null_count / total_count) * 100 if total_count > 0 else 0,
        }
        
        if column_info.data_type == DataType.STRING:
            analysis.update(self._analyze_text_column(values))
        elif column_info.data_type == DataType.NUMBER:
            analysis.update(self._analyze_numeric_column(values))
        elif column_info.data_type == DataType.DATE:
            analysis.update(self._analyze_date_column(values))
        
        # Common analysis
        analysis.update(self._analyze_common(values))
        
        task_manager.update_progress(task_id, 100)
        
        # Cache result
        cache_key = f"{file_id}_{column}"
        self.analysis_cache[cache_key] = analysis
        
        return analysis
    
    def _analyze_text_column(self, values: List[Any]) -> Dict[str, Any]:
        """Analyze text column"""
        str_values = [str(v) for v in values if v is not None]
        
        if not str_values:
            return {}
        
        # Length statistics
        lengths = [len(s) for s in str_values]
        
        # Word analysis (sample only for performance)
        sample_size = min(1000, len(str_values))
        sample_values = str_values[:sample_size]
        
        all_words = []
        for text in sample_values:
            words = re.findall(r'\b\w+\b', text.lower())
            all_words.extend(words)
        
        word_counts = Counter(all_words)
        
        return {
            "length_stats": {
                "min": min(lengths),
                "max": max(lengths),
                "mean": statistics.mean(lengths),
                "median": statistics.median(lengths),
                "std_dev": statistics.stdev(lengths) if len(lengths) > 1 else 0
            },
            "most_common_words": word_counts.most_common(10),
            "unique_word_count": len(word_counts),
            "avg_words_per_text": len(all_words) / len(sample_values) if sample_values else 0
        }
    
    def _analyze_numeric_column(self, values: List[Any]) -> Dict[str, Any]:
        """Analyze numeric column"""
        numeric_values = []
        
        for v in values:
            try:
                if isinstance(v, (int, float)):
                    numeric_values.append(float(v))
                else:
                    numeric_values.append(float(str(v)))
            except (ValueError, TypeError):
                continue
        
        if not numeric_values:
            return {}
        
        # Calculate statistics
        sorted_values = sorted(numeric_values)
        
        stats = {
            "min": min(numeric_values),
            "max": max(numeric_values),
            "mean": statistics.mean(numeric_values),
            "median": statistics.median(numeric_values),
            "mode": statistics.mode(numeric_values) if len(set(numeric_values)) < len(numeric_values) else None,
            "std_dev": statistics.stdev(numeric_values) if len(numeric_values) > 1 else 0,
            "variance": statistics.variance(numeric_values) if len(numeric_values) > 1 else 0
        }
        
        # Percentiles
        stats.update({
            "q1": sorted_values[len(sorted_values) // 4],
            "q3": sorted_values[3 * len(sorted_values) // 4],
            "percentile_95": sorted_values[int(0.95 * len(sorted_values))],
            "percentile_99": sorted_values[int(0.99 * len(sorted_values))]
        })
        
        # Distribution
        hist_bins = self._create_histogram(numeric_values, 20)
        stats["histogram"] = hist_bins
        
        return {"numeric_stats": stats}
    
    def _analyze_date_column(self, values: List[Any]) -> Dict[str, Any]:
        """Analyze date column"""
        # Simple date analysis
        date_strings = [str(v) for v in values if v is not None]
        
        if not date_strings:
            return {}
        
        return {
            "date_range": {
                "earliest": min(date_strings),
                "latest": max(date_strings),
                "span_days": "N/A"  # Would need proper date parsing
            },
            "sample_formats": list(set(date_strings[:10]))
        }
    
    def _analyze_common(self, values: List[Any]) -> Dict[str, Any]:
        """Common analysis for all data types"""
        if not values:
            return {}
        
        # Value frequency
        value_counts = Counter(str(v) for v in values)
        unique_count = len(value_counts)
        
        return {
            "unique_count": unique_count,
            "unique_percentage": (unique_count / len(values)) * 100,
            "most_common_values": value_counts.most_common(10),
            "least_common_values": value_counts.most_common()[-10:] if len(value_counts) > 10 else []
        }
    
    def _create_histogram(self, values: List[float], bins: int = 20) -> List[Dict[str, Any]]:
        """Create histogram data"""
        if not values:
            return []
        
        min_val = min(values)
        max_val = max(values)
        
        if min_val == max_val:
            return [{"range": f"{min_val}", "count": len(values)}]
        
        bin_width = (max_val - min_val) / bins
        histogram = []
        
        for i in range(bins):
            bin_start = min_val + i * bin_width
            bin_end = bin_start + bin_width
            
            count = sum(1 for v in values if bin_start <= v < bin_end)
            if i == bins - 1:  # Include max value in last bin
                count = sum(1 for v in values if bin_start <= v <= bin_end)
            
            histogram.append({
                "range": f"{bin_start:.2f} - {bin_end:.2f}",
                "count": count,
                "percentage": (count / len(values)) * 100
            })
        
        return histogram
    
    def get_cached_analysis(self, file_id: str, column: str) -> Optional[Dict[str, Any]]:
        """Get cached analysis result"""
        cache_key = f"{file_id}_{column}"
        return self.analysis_cache.get(cache_key)
    
    def get_dataset_overview(self, file_id: str) -> Dict[str, Any]:
        """Generate comprehensive dataset overview"""
        metadata = file_loader_service.get_file_metadata(file_id)
        if not metadata:
            raise ValueError(f"File not found: {file_id}")
        
        streamer = JSONLStreamer(metadata.file_path)
        
        # Initialize counters
        total_records = 0
        total_cells = 0
        null_cells = 0
        empty_rows = 0
        column_stats = {col.name: {
            'name': col.name,
            'data_type': col.data_type.value,
            'null_count': 0,
            'unique_values': set(),
            'value_counts': Counter(),
            'sample_values': []
        } for col in metadata.columns}
        
        # Process records
        for record in streamer.stream_records():
            total_records += 1
            row_null_count = 0
            
            for col_name in column_stats.keys():
                total_cells += 1
                value = record.get(col_name)
                
                if value is None or value == '':
                    column_stats[col_name]['null_count'] += 1
                    null_cells += 1
                    row_null_count += 1
                else:
                    # Track unique values (limited to avoid memory issues)
                    if len(column_stats[col_name]['unique_values']) < 10000:
                        column_stats[col_name]['unique_values'].add(str(value))
                    
                    # Track value frequency (top 100)
                    column_stats[col_name]['value_counts'][str(value)] += 1
                    if len(column_stats[col_name]['value_counts']) > 100:
                        # Keep only top values
                        top_values = dict(column_stats[col_name]['value_counts'].most_common(50))
                        column_stats[col_name]['value_counts'] = Counter(top_values)
                    
                    # Sample values
                    if len(column_stats[col_name]['sample_values']) < 5:
                        column_stats[col_name]['sample_values'].append(str(value))
            
            # Check for empty rows
            if row_null_count == len(column_stats):
                empty_rows += 1
        
        # Calculate statistics
        processed_column_stats = []
        for col_name, stats in column_stats.items():
            null_ratio = stats['null_count'] / total_records if total_records > 0 else 0
            unique_count = len(stats['unique_values'])
            top_values = [{'value': k, 'count': v} for k, v in stats['value_counts'].most_common(5)]
            
            processed_column_stats.append({
                'name': col_name,
                'data_type': stats['data_type'],
                'null_count': stats['null_count'],
                'null_ratio': null_ratio,
                'unique_count': unique_count,
                'top_values': top_values
            })
        
        # Data quality metrics
        total_null_ratio = null_cells / total_cells if total_cells > 0 else 0
        empty_columns = sum(1 for stats in column_stats.values() if stats['null_count'] == total_records)
        completeness_score = 1.0 - total_null_ratio
        
        # Type distribution
        type_distribution = {}
        for col in metadata.columns:
            data_type = col.data_type.value
            type_distribution[data_type] = type_distribution.get(data_type, 0) + 1
        
        return {
            'basic_info': {
                'total_records': total_records,
                'total_columns': len(metadata.columns),
                'file_size': metadata.file_size
            },
            'data_quality': {
                'total_null_ratio': total_null_ratio,
                'empty_rows': empty_rows,
                'empty_columns': empty_columns,
                'completeness_score': completeness_score
            },
            'column_stats': processed_column_stats,
            'type_distribution': type_distribution
        }

    def analyze_data_quality(self, file_id: str) -> str:
        """Analyze overall data quality"""
        task_id = task_manager.submit_task(
            self._analyze_data_quality_task,
            "Data Quality Analysis",
            file_id
        )
        return task_id
    
    def _analyze_data_quality_task(self, task_id: str, file_id: str) -> Dict[str, Any]:
        """Background task for data quality analysis"""
        metadata = file_loader_service.get_file_metadata(file_id)
        if not metadata:
            raise ValueError(f"File not found: {file_id}")
        
        streamer = JSONLStreamer(metadata.file_path)
        
        # Track quality metrics
        total_records = 0
        duplicate_records = set()
        column_completeness = {col.name: 0 for col in metadata.columns}
        record_hashes = set()
        
        task_manager.update_progress(task_id, 10)
        
        for record in streamer.stream_records():
            total_records += 1
            
            # Check for duplicates (simple hash)
            record_str = str(sorted(record.items()))
            record_hash = hash(record_str)
            
            if record_hash in record_hashes:
                duplicate_records.add(record_hash)
            else:
                record_hashes.add(record_hash)
            
            # Count non-null values per column
            for column in record:
                if record[column] is not None:
                    column_completeness[column] += 1
            
            # Update progress
            if total_records % 1000 == 0:
                progress = 10 + (total_records / metadata.total_records) * 80
                task_manager.update_progress(task_id, progress)
        
        # Calculate quality metrics
        quality_report = {
            "total_records": total_records,
            "duplicate_count": len(duplicate_records),
            "duplicate_percentage": (len(duplicate_records) / total_records) * 100 if total_records > 0 else 0,
            "column_completeness": {
                col: {
                    "non_null_count": count,
                    "completeness_percentage": (count / total_records) * 100 if total_records > 0 else 0
                }
                for col, count in column_completeness.items()
            },
            "overall_quality_score": self._calculate_quality_score(
                len(duplicate_records), total_records, column_completeness
            )
        }
        
        task_manager.update_progress(task_id, 100)
        return quality_report
    
    def _calculate_quality_score(self, duplicates: int, total: int, completeness: Dict[str, int]) -> float:
        """Calculate overall data quality score (0-100)"""
        if total == 0:
            return 0
        
        # Deduct points for duplicates
        duplicate_penalty = (duplicates / total) * 30
        
        # Deduct points for missing data
        avg_completeness = sum(completeness.values()) / len(completeness) if completeness else 0
        completeness_score = (avg_completeness / total) * 70 if total > 0 else 0
        
        quality_score = max(0, 100 - duplicate_penalty) * (completeness_score / 70)
        return round(quality_score, 2)

# Global service instance
analysis_service = AnalysisService()
