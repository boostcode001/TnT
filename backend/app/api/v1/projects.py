# 프로젝트 CRUD API — 로그인한 유저의 프로젝트만 조회/생성/수정/삭제 가능
from fastapi import APIRouter, Depends, HTTPException
from app.core.database import db
from app.core.security import get_current_user
from app.models.project import ProjectCreate, ProjectUpdate
from app.models.user import UserResponse
from bson import ObjectId
from datetime import datetime

router = APIRouter()


# GET /projects — 내 프로젝트 목록 (최신순)
@router.get("/projects")
async def get_projects(current_user: UserResponse = Depends(get_current_user)):
    # user_id로 필터링해 다른 유저의 프로젝트가 노출되지 않도록 보장
    projects = await db.projects.find({"user_id": current_user.id}).sort("created_at", -1).to_list(length=100)
    # MongoDB의 _id(ObjectId)를 문자열 id로 변환해 JSON 직렬화 가능하게 처리
    for p in projects:
        p["id"] = str(p["_id"])
        del p["_id"]
    return projects


# POST /projects — 새 프로젝트 생성
@router.post("/projects", status_code=201)
async def create_project(project: ProjectCreate, current_user: UserResponse = Depends(get_current_user)):
    now = datetime.utcnow()
    doc = {
        "name": project.name,
        # 프로젝트 소유자 기록 — 조회 시 user_id 필터에 사용
        "user_id": current_user.id,
        "thumbnail_count": 0,
        # 연결된 분석 작업 ID (분석 시작 시 업데이트됨)
        "last_job_id": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.projects.insert_one(doc)
    return {"id": str(result.inserted_id), "name": project.name}


# PATCH /projects/{project_id} — 프로젝트 이름 변경
@router.patch("/projects/{project_id}")
async def update_project(project_id: str, project: ProjectUpdate, current_user: UserResponse = Depends(get_current_user)):
    # user_id 조건을 함께 걸어 다른 유저의 프로젝트를 수정하지 못하도록 방어
    result = await db.projects.update_one(
        {"_id": ObjectId(project_id), "user_id": current_user.id},
        {"$set": {"name": project.name, "updated_at": datetime.utcnow()}}
    )
    # matched_count가 0이면 프로젝트가 없거나 권한 없음
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"id": project_id, "name": project.name}


# DELETE /projects/{project_id} — 프로젝트 삭제
@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: str, current_user: UserResponse = Depends(get_current_user)):
    # user_id 조건으로 본인 프로젝트만 삭제 가능
    result = await db.projects.delete_one({"_id": ObjectId(project_id), "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
