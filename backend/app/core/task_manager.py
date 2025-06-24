from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, Callable, Optional
import uuid
import time
from enum import Enum
from dataclasses import dataclass
import threading
from .config import settings

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class TaskInfo:
    id: str
    name: str
    status: TaskStatus
    progress: float = 0.0
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: float = None
    started_at: Optional[float] = None
    completed_at: Optional[float] = None

class TaskManager:
    def __init__(self, max_workers: int = None):
        self.max_workers = max_workers or settings.max_workers
        self.executor = ThreadPoolExecutor(max_workers=self.max_workers)
        self.tasks: Dict[str, TaskInfo] = {}
        self.futures: Dict[str, Any] = {}
        self._lock = threading.Lock()
    
    def submit_task(self, func: Callable, name: str, *args, **kwargs) -> str:
        """Submit a task for background execution"""
        task_id = str(uuid.uuid4())
        
        task_info = TaskInfo(
            id=task_id,
            name=name,
            status=TaskStatus.PENDING,
            created_at=time.time()
        )
        
        with self._lock:
            self.tasks[task_id] = task_info
        
        # Wrap function to update task status
        def wrapped_func():
            try:
                with self._lock:
                    self.tasks[task_id].status = TaskStatus.RUNNING
                    self.tasks[task_id].started_at = time.time()
                
                result = func(task_id, *args, **kwargs)
                
                with self._lock:
                    self.tasks[task_id].status = TaskStatus.COMPLETED
                    self.tasks[task_id].result = result
                    self.tasks[task_id].completed_at = time.time()
                    self.tasks[task_id].progress = 100.0
                
                return result
                
            except Exception as e:
                with self._lock:
                    self.tasks[task_id].status = TaskStatus.FAILED
                    self.tasks[task_id].error = str(e)
                    self.tasks[task_id].completed_at = time.time()
                raise e
        
        future = self.executor.submit(wrapped_func)
        self.futures[task_id] = future
        
        return task_id
    
    def get_task(self, task_id: str) -> Optional[TaskInfo]:
        """Get task information"""
        with self._lock:
            return self.tasks.get(task_id)
    
    def update_progress(self, task_id: str, progress: float):
        """Update task progress (0-100)"""
        with self._lock:
            if task_id in self.tasks:
                self.tasks[task_id].progress = min(100.0, max(0.0, progress))
    
    def cancel_task(self, task_id: str) -> bool:
        """Cancel a running task"""
        if task_id in self.futures:
            cancelled = self.futures[task_id].cancel()
            if cancelled:
                with self._lock:
                    self.tasks[task_id].status = TaskStatus.CANCELLED
            return cancelled
        return False
    
    def list_tasks(self) -> Dict[str, TaskInfo]:
        """List all tasks"""
        with self._lock:
            return self.tasks.copy()
    
    def cleanup_completed_tasks(self, max_age: int = 3600):
        """Remove old completed tasks"""
        current_time = time.time()
        to_remove = []
        
        with self._lock:
            for task_id, task in self.tasks.items():
                if (task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED] 
                    and task.completed_at 
                    and current_time - task.completed_at > max_age):
                    to_remove.append(task_id)
            
            for task_id in to_remove:
                del self.tasks[task_id]
                if task_id in self.futures:
                    del self.futures[task_id]

# Global task manager instance
task_manager = TaskManager()
