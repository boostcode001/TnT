# 분석 API — 영상 업로드 후 Celery 파이프라인 실행, 상태 및 결과 조회
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.database import db
from app.core.security import get_current_user
from app.models.user import UserResponse
from app.models.analysis import AnalysisJobResponse
from app.workers.tasks import run_analysis_pipeline
from bson import ObjectId
from datetime import datetime

router = APIRouter()


# POST /analysis/start — 영상 업로드 후 ML 파이프라인 비동기 실행
@router.post("/analysis/start")
async def start_analysis(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    current_user: UserResponse = Depends(get_current_user),
):
    now = datetime.utcnow()
    # 분석 작업 문서 생성 (초기 상태: pending)
    doc = {
        "project_id": project_id,
        "user_id": current_user.id,
        "status": "pending",
        "pipeline_step": "scene_detect",
        "created_at": now,
    }
    result = await db.analysis_jobs.insert_one(doc)
    job_id = str(result.inserted_id)

    # 프로젝트에 last_job_id 연결 — 프론트에서 최신 분석 결과를 바로 찾기 위함
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {"last_job_id": job_id, "updated_at": now}}
    )

    # 업로드된 영상을 /tmp에 임시 저장 (Celery worker가 읽을 수 있는 경로)
    video_path = f"/tmp/{job_id}.mp4"
    content = await file.read()
    with open(video_path, "wb") as f:
        f.write(content)

    # Celery에 태스크를 비동기로 전달 — 응답을 기다리지 않고 즉시 반환
    run_analysis_pipeline.delay(job_id, video_path)

    return {"job_id": job_id, "status": "pending"}


# POST /analysis/guest-start — 비로그인 임시 분석 (인증 불필요)
@router.post("/analysis/guest-start")
async def guest_start_analysis(
    file: UploadFile = File(...),
):
    now = datetime.utcnow()
    doc = {
        "project_id": None,
        "user_id": None,
        "status": "pending",
        "pipeline_step": "scene_detect",
        "is_guest": True,
        "created_at": now,
    }
    result = await db.analysis_jobs.insert_one(doc)
    job_id = str(result.inserted_id)

    video_path = f"/tmp/{job_id}.mp4"
    content = await file.read()
    with open(video_path, "wb") as f:
        f.write(content)

    run_analysis_pipeline.delay(job_id, video_path)

    return {"job_id": job_id, "status": "pending"}


# POST /analysis/claim — 비로그인 job을 로그인 유저에게 귀속
@router.post("/analysis/claim")
async def claim_analysis(
    job_id: str,
    project_name: str,
    current_user: UserResponse = Depends(get_current_user),
):
    job = await db.analysis_jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.get("is_guest"):
        raise HTTPException(status_code=400, detail="이미 귀속된 작업입니다")

    now = datetime.utcnow()
    project_doc = {
        "name": project_name,
        "user_id": current_user.id,
        "thumbnail_count": 0,
        "last_job_id": job_id,
        "status": "analyzing",
        "created_at": now,
        "updated_at": now,
    }
    project_result = await db.projects.insert_one(project_doc)
    project_id = str(project_result.inserted_id)

    await db.analysis_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "user_id": current_user.id,
            "project_id": project_id,
            "is_guest": False,
        }}
    )

    if job.get("status") == "done" and job.get("result"):
        frame_count = len(job["result"].get("frame_scores", []))
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"thumbnail_count": frame_count, "status": "done"}}
        )

    return {"project_id": project_id, "job_id": job_id}


# GET /analysis/job/{job_id} — 분석 작업 현재 상태 및 파이프라인 단계 조회 (guest 허용)
@router.get("/analysis/job/{job_id}", response_model=AnalysisJobResponse)
async def get_job(job_id: str):
    job = await db.analysis_jobs.find_one({"_id": ObjectId(job_id)})
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return AnalysisJobResponse(
        id=str(job["_id"]),
        status=job["status"],
        pipeline_step=job["pipeline_step"],
    )


# GET /analysis/job/{job_id}/result — 완료된 분석 결과 데이터 반환 (guest 허용)
@router.get("/analysis/job/{job_id}/result")
async def get_job_result(job_id: str):
    job = await db.analysis_jobs.find_one({"_id": ObjectId(job_id)})
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    # done 상태가 아니면 결과 데이터가 아직 없음
    if job["status"] != "done":
        raise HTTPException(status_code=400, detail="분석이 아직 완료되지 않았습니다")
    result = job.get("result")
    # done이지만 result 필드가 없으면 태스크 오류로 간주
    if not result:
        raise HTTPException(status_code=404, detail="결과 데이터가 없습니다")
    return {
        "job_id": job_id,
        "scene_count": result["scene_count"],
        "frame_count": result["frame_count"],
        "frame_scores": result["frame_scores"],
        "top_thumbnail_url": result.get("top_thumbnail_url"),
    }
