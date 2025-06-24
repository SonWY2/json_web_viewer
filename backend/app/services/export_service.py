import json
import csv
import pandas as pd
from io import StringIO, BytesIO
from typing import List, Dict, Any, Optional
from pathlib import Path
import zipfile
import tempfile
from ..models.filter import DataRequest
from ..services.data_service import data_service
from ..services.file_loader import file_loader_service

class ExportService:
    """Data export service supporting multiple formats"""
    
    async def export_data(self, request: DataRequest, format: str, include_stats: bool = False) -> Dict[str, Any]:
        """Export data in specified format"""
        # Get data
        data_chunk = await data_service.get_data_chunk(request)
        metadata = file_loader_service.get_file_metadata(request.file_id)
        
        if format.lower() == 'json':
            return await self._export_json(data_chunk.data, metadata.filename, include_stats)
        elif format.lower() == 'jsonl':
            return await self._export_jsonl(data_chunk.data, metadata.filename, include_stats)
        elif format.lower() == 'csv':
            return await self._export_csv(data_chunk.data, metadata.filename, include_stats)
        elif format.lower() == 'excel':
            return await self._export_excel(data_chunk.data, metadata.filename, include_stats)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    async def _export_json(self, data: List[Dict[str, Any]], filename: str, include_stats: bool) -> Dict[str, Any]:
        """Export as JSON"""
        output = StringIO()
        json.dump(data, output, indent=2, default=str)
        content = output.getvalue()
        
        return {
            "content": content,
            "content_type": "application/json",
            "filename": f"{Path(filename).stem}_export.json",
            "size": len(content.encode('utf-8'))
        }
    
    async def _export_jsonl(self, data: List[Dict[str, Any]], filename: str, include_stats: bool) -> Dict[str, Any]:
        """Export as JSONL"""
        output = StringIO()
        for record in data:
            output.write(json.dumps(record, default=str) + '\n')
        content = output.getvalue()
        
        return {
            "content": content,
            "content_type": "application/jsonl",
            "filename": f"{Path(filename).stem}_export.jsonl",
            "size": len(content.encode('utf-8'))
        }
    
    async def _export_csv(self, data: List[Dict[str, Any]], filename: str, include_stats: bool) -> Dict[str, Any]:
        """Export as CSV"""
        if not data:
            return {"content": "", "content_type": "text/csv", "filename": f"{Path(filename).stem}_export.csv", "size": 0}
        
        # Get all columns
        all_columns = set()
        for record in data:
            all_columns.update(record.keys())
        columns = sorted(all_columns)
        
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        
        for record in data:
            # Convert complex objects to strings
            clean_record = {}
            for col in columns:
                value = record.get(col)
                if isinstance(value, (dict, list)):
                    clean_record[col] = json.dumps(value, default=str)
                else:
                    clean_record[col] = value
            writer.writerow(clean_record)
        
        content = output.getvalue()
        
        return {
            "content": content,
            "content_type": "text/csv",
            "filename": f"{Path(filename).stem}_export.csv",
            "size": len(content.encode('utf-8'))
        }
    
    async def _export_excel(self, data: List[Dict[str, Any]], filename: str, include_stats: bool) -> Dict[str, Any]:
        """Export as Excel"""
        if not data:
            return {"content": b"", "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                   "filename": f"{Path(filename).stem}_export.xlsx", "size": 0}
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Handle complex objects
        for col in df.columns:
            df[col] = df[col].apply(lambda x: json.dumps(x, default=str) if isinstance(x, (dict, list)) else x)
        
        # Create Excel file in memory
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Data', index=False)
            
            if include_stats:
                # Add basic stats sheet
                stats_data = []
                for col in df.columns:
                    if df[col].dtype in ['int64', 'float64']:
                        stats_data.append({
                            'Column': col,
                            'Type': 'Numeric',
                            'Count': df[col].count(),
                            'Mean': df[col].mean(),
                            'Std': df[col].std(),
                            'Min': df[col].min(),
                            'Max': df[col].max()
                        })
                    else:
                        stats_data.append({
                            'Column': col,
                            'Type': 'Text',
                            'Count': df[col].count(),
                            'Unique': df[col].nunique(),
                            'Most_Common': df[col].mode().iloc[0] if not df[col].mode().empty else None
                        })
                
                if stats_data:
                    stats_df = pd.DataFrame(stats_data)
                    stats_df.to_excel(writer, sheet_name='Statistics', index=False)
        
        content = output.getvalue()
        
        return {
            "content": content,
            "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "filename": f"{Path(filename).stem}_export.xlsx",
            "size": len(content)
        }

# Global service instance
export_service = ExportService()
