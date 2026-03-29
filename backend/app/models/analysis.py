# 분석 작업 관련 Pydantic 스키마 정의
from pydantic import BaseModel
from datetime import datetime
from typing import Literal


# DB 저장용 분석 작업 전체 모델
class AnalysisJob(BaseModel):
    id: str
    project_id: str
    # 작업 상태: pending(대기) → processing(처리중) → done(완료) / failed(실패)
    status: Literal["pending", "processing", "done", "failed"]
    # 파이프라인 현재 단계: 씬 감지 → 임베딩 → 스코어링 → 완료
    pipeline_step: Literal["scene_detect", "embedding", "scoring", "done"]
    created_at: datetime


# 상태 조회 API 응답 — 프론트 폴링에 사용 (결과 데이터 제외)
class AnalysisJobResponse(BaseModel):
    id: str
    status: Literal["pending", "processing", "done", "failed"]
    pipeline_step: Literal["scene_detect", "embedding", "scoring", "done"]
