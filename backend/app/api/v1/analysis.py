from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional
from ...services.analysis_service import analysis_service
from ...core.task_manager import task_manager

router = APIRouter(prefix="/analysis", tags=["analysis"])

class AnalysisRequest(BaseModel):
    file_id: str
    column: str

class QualityAnalysisRequest(BaseModel):
    file_id: str

@router.post("/column")
async def analyze_column(request: AnalysisRequest):
    """Start column analysis task"""
    try:
        # Check for cached result first
        cached = analysis_service.get_cached_analysis(request.file_id, request.column)
        if cached:
            return {"status": "completed", "result": cached}
        
        task_id = analysis_service.analyze_column(request.file_id, request.column)
        return {"status": "started", "task_id": task_id}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

@router.get("/column/{file_id}/{column}")
async def get_column_analysis(file_id: str, column: str):
    """Get cached column analysis result"""
    result = analysis_service.get_cached_analysis(file_id, column)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found. Please start analysis first."
        )
    return result

@router.get("/dataset-overview/{file_id}")
async def get_dataset_overview(file_id: str):
    """Get comprehensive dataset overview"""
    try:
        overview = analysis_service.get_dataset_overview(file_id)
        return overview
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dataset overview failed: {str(e)}"
        )

@router.post("/quality")
async def analyze_data_quality(request: QualityAnalysisRequest):
    """Start data quality analysis"""
    try:
        task_id = analysis_service.analyze_data_quality(request.file_id)
        return {"status": "started", "task_id": task_id}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quality analysis failed: {str(e)}"
        )
