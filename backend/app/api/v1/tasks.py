from fastapi import APIRouter, HTTPException, status
from typing import Dict, List
from ...core.task_manager import task_manager, TaskInfo

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/{task_id}")
async def get_task_status(task_id: str):
    """Get task status"""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task

@router.get("/")
async def list_tasks():
    """List all tasks"""
    return task_manager.list_tasks()

@router.delete("/{task_id}")
async def cancel_task(task_id: str):
    """Cancel a running task"""
    success = task_manager.cancel_task(task_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or cannot be cancelled"
        )
    return {"message": "Task cancelled successfully"}
