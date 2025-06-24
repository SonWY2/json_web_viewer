from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from ...services.search_service import search_service

router = APIRouter(prefix="/search", tags=["search"])

class SearchRequest(BaseModel):
    file_id: str
    query: str
    column: Optional[str] = None
    regex: bool = False
    limit: int = 1000

class SearchResponse(BaseModel):
    matching_rows: List[int]
    total_matches: int
    query: str
    execution_time_ms: float

class SuggestionsRequest(BaseModel):
    file_id: str
    column: str
    prefix: str
    limit: int = 10

@router.post("/", response_model=SearchResponse)
async def search_data(request: SearchRequest):
    """Search data globally or within specific column"""
    import time
    start_time = time.time()
    
    try:
        if request.column:
            if request.regex:
                matching_rows = search_service.search_regex(
                    request.file_id, request.column, request.query, request.limit
                )
            else:
                matching_rows = search_service.search_column(
                    request.file_id, request.column, request.query, request.limit
                )
        else:
            matching_rows = search_service.search_global(
                request.file_id, request.query, request.limit
            )
        
        execution_time = (time.time() - start_time) * 1000
        
        return SearchResponse(
            matching_rows=matching_rows,
            total_matches=len(matching_rows),
            query=request.query,
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.post("/suggestions")
async def get_search_suggestions(request: SuggestionsRequest):
    """Get search suggestions for autocomplete"""
    try:
        suggestions = search_service.get_search_suggestions(
            request.file_id, request.column, request.prefix, request.limit
        )
        return {"suggestions": suggestions}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get suggestions: {str(e)}"
        )

@router.post("/index/{file_id}")
async def build_search_index(file_id: str):
    """Build search index for file"""
    try:
        result = search_service.build_search_index(file_id)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build index: {str(e)}"
        )
