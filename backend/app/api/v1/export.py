from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from ...services.export_service import export_service
from ...models.filter import DataRequest

router = APIRouter(prefix="/export", tags=["export"])

class ExportRequest(BaseModel):
    data_request: DataRequest
    format: str  # json, jsonl, csv, excel
    include_stats: bool = False

@router.post("/")
async def export_data(request: ExportRequest):
    """Export data in specified format"""
    try:
        result = await export_service.export_data(
            request.data_request, 
            request.format, 
            request.include_stats
        )
        
        if request.format.lower() == 'excel':
            return Response(
                content=result["content"],
                media_type=result["content_type"],
                headers={"Content-Disposition": f"attachment; filename={result['filename']}"}
            )
        else:
            return Response(
                content=result["content"],
                media_type=result["content_type"],
                headers={"Content-Disposition": f"attachment; filename={result['filename']}"}
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )
