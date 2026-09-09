import time
import pytest
from jobs.job_manager import job_manager, JobStatus

def test_job_manager_lifecycle():
    def sample_work(a: int, b: int):
        time.sleep(0.05)
        return a + b

    job_id = job_manager.create_job("MATH_TASK", {"input": "2+3"})
    assert job_id.startswith("job_")
    assert job_manager.get_job(job_id)["status"] == JobStatus.PENDING

    job_manager.run_async_task(job_id, sample_work, 2, 3)
    time.sleep(0.15)

    job = job_manager.get_job(job_id)
    assert job["status"] == JobStatus.COMPLETED
    assert job["result"] == 5
    assert job["completedAt"] is not None
