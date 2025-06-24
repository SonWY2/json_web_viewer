from typing import List, Dict, Any, Optional, Set
import re
from collections import defaultdict
from ..processors.jsonl_streamer import JSONLStreamer
from ..services.file_loader import file_loader_service

class SearchService:
    """Global and column-specific search service"""
    
    def __init__(self):
        self.search_indexes: Dict[str, Dict[str, Set[int]]] = {}  # file_id -> {column -> {word -> row_indexes}}
    
    def build_search_index(self, file_id: str) -> Dict[str, Any]:
        """Build search index for a file"""
        metadata = file_loader_service.get_file_metadata(file_id)
        if not metadata:
            raise ValueError(f"File not found: {file_id}")
        
        streamer = JSONLStreamer(metadata.file_path)
        index = defaultdict(lambda: defaultdict(set))
        
        # Build index from all records
        for row_idx, record in enumerate(streamer.stream_records()):
            for column, value in record.items():
                if value is not None:
                    # Tokenize value
                    tokens = self._tokenize(str(value))
                    for token in tokens:
                        index[column][token.lower()].add(row_idx)
        
        self.search_indexes[file_id] = dict(index)
        return {
            "file_id": file_id,
            "indexed_columns": len(index),
            "total_tokens": sum(len(col_index) for col_index in index.values())
        }
    
    def search_global(self, file_id: str, query: str, limit: int = 1000) -> List[int]:
        """Search across all columns"""
        if file_id not in self.search_indexes:
            # Build index on-demand
            self.build_search_index(file_id)
        
        query_tokens = self._tokenize(query.lower())
        matching_rows = set()
        
        index = self.search_indexes[file_id]
        
        for column_index in index.values():
            for token in query_tokens:
                # Exact match
                if token in column_index:
                    matching_rows.update(column_index[token])
                
                # Partial match (contains)
                for indexed_token in column_index:
                    if token in indexed_token:
                        matching_rows.update(column_index[indexed_token])
        
        return list(matching_rows)[:limit]
    
    def search_column(self, file_id: str, column: str, query: str, limit: int = 1000) -> List[int]:
        """Search within specific column"""
        if file_id not in self.search_indexes:
            self.build_search_index(file_id)
        
        index = self.search_indexes[file_id]
        if column not in index:
            return []
        
        query_tokens = self._tokenize(query.lower())
        matching_rows = set()
        
        column_index = index[column]
        
        for token in query_tokens:
            # Exact match
            if token in column_index:
                matching_rows.update(column_index[token])
            
            # Partial match
            for indexed_token in column_index:
                if token in indexed_token:
                    matching_rows.update(column_index[indexed_token])
        
        return list(matching_rows)[:limit]
    
    def search_regex(self, file_id: str, column: str, pattern: str, limit: int = 1000) -> List[int]:
        """Regex search within column"""
        metadata = file_loader_service.get_file_metadata(file_id)
        if not metadata:
            raise ValueError(f"File not found: {file_id}")
        
        try:
            regex = re.compile(pattern, re.IGNORECASE)
        except re.error as e:
            raise ValueError(f"Invalid regex pattern: {e}")
        
        streamer = JSONLStreamer(metadata.file_path)
        matching_rows = []
        
        for row_idx, record in enumerate(streamer.stream_records()):
            if len(matching_rows) >= limit:
                break
            
            value = record.get(column)
            if value is not None and regex.search(str(value)):
                matching_rows.append(row_idx)
        
        return matching_rows
    
    def get_search_suggestions(self, file_id: str, column: str, prefix: str, limit: int = 10) -> List[str]:
        """Get search suggestions for autocomplete"""
        if file_id not in self.search_indexes:
            return []
        
        index = self.search_indexes[file_id]
        if column not in index:
            return []
        
        prefix = prefix.lower()
        suggestions = []
        
        for token in index[column]:
            if token.startswith(prefix):
                suggestions.append(token)
                if len(suggestions) >= limit:
                    break
        
        return sorted(suggestions)
    
    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text for search indexing"""
        # Simple tokenization - split on non-alphanumeric
        tokens = re.findall(r'\w+', text.lower())
        return [token for token in tokens if len(token) >= 2]  # Ignore single chars
    
    def clear_index(self, file_id: str):
        """Clear search index for file"""
        if file_id in self.search_indexes:
            del self.search_indexes[file_id]

# Global service instance
search_service = SearchService()
