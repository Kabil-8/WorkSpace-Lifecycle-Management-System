import uuid
import threading
import time
from datetime import datetime
from typing import Dict, Any, Optional, Callable

class JobStatus:
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class JobManager:
    """
    Lightweight in-process asynchronous task manager for non-blocking ML operations
    (model retraining, bulk embedding generation, heavy document ingestion).
    """
    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create_job(self, job_type: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow().isoformat() + "Z"
        with self._lock:
            self._jobs[job_id] = {
                "jobId": job_id,
                "jobType": job_type,
                "status": JobStatus.PENDING,
                "progress": 0.0,
                "result": None,
                "error": None,
                "metadata": metadata or {},
                "createdAt": now,
                "startedAt": None,
                "completedAt": None
            }
        return job_id

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._jobs.get(job_id)

    def run_async_task(self, job_id: str, task_fn: Callable[..., Any], *args, **kwargs):
        def _worker():
            with self._lock:
                if job_id not in self._jobs:
                    return
                self._jobs[job_id]["status"] = JobStatus.PROCESSING
                self._jobs[job_id]["startedAt"] = datetime.utcnow().isoformat() + "Z"

            try:
                result = task_fn(*args, **kwargs)
                with self._lock:
                    self._jobs[job_id]["status"] = JobStatus.COMPLETED
                    self._jobs[job_id]["progress"] = 1.0
                    self._jobs[job_id]["result"] = result
                    self._jobs[job_id]["completedAt"] = datetime.utcnow().isoformat() + "Z"
            except Exception as e:
                with self._lock:
                    self._jobs[job_id]["status"] = JobStatus.FAILED
                    self._jobs[job_id]["error"] = str(e)
                    self._jobs[job_id]["completedAt"] = datetime.utcnow().isoformat() + "Z"

        thread = threading.Thread(target=_worker, daemon=True)
        thread.start()

job_manager = JobManager()
