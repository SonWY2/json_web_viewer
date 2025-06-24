import asyncio
import os
from pathlib import Path
from app.core.config import settings

async def delete_file_after_delay(file_path: str, delay_minutes: int = 30):
    """지정된 시간 후 파일 삭제"""
    await asyncio.sleep(delay_minutes * 60)
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            print(f"Cleaned up uploaded file: {file_path}")
    except Exception as e:
        print(f"Failed to cleanup file {file_path}: {e}")

def cleanup_temp_files():
    """서버 시작시 이전 임시 파일들 정리"""
    upload_dir = Path(settings.upload_dir)
    if upload_dir.exists():
        for file_path in upload_dir.glob("*"):
            if file_path.is_file():
                try:
                    file_path.unlink()
                    print(f"Cleaned up old file: {file_path}")
                except Exception as e:
                    print(f"Failed to cleanup {file_path}: {e}")
