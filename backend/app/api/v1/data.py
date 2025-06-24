from fastapi import APIRouter, HTTPException, status
from ...services.data_service import data_service
from ...models.filter import DataRequest
from ...models.file_info import DataChunk

router = APIRouter(prefix="/data", tags=["data"])

@router.post("/", response_model=DataChunk)
async def get_data(request: DataRequest):
    """Get paginated data with filtering and sorting"""
    try:
        data_chunk = await data_service.get_data_chunk(request)
        return data_chunk
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve data: {str(e)}"
        )
