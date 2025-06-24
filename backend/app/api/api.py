from fastapi import APIRouter
from .v1 import files, data, tasks, search, analysis, export, filesystem

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(files.router)
api_router.include_router(data.router)
api_router.include_router(tasks.router)
api_router.include_router(search.router)
api_router.include_router(analysis.router)
api_router.include_router(export.router)
api_router.include_router(filesystem.router)
