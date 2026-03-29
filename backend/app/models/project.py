# 프로젝트 관련 Pydantic 스키마 정의
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# 프로젝트 생성 요청 바디
class ProjectCreate(BaseModel):
    name: str

# 프로젝트 이름 변경 요청 바디
class ProjectUpdate(BaseModel):
    name: str

# 프로젝트 목록/상세 응답 스키마
class ProjectResponse(BaseModel):
    id: str
    name: str
    thumbnail_count: int   # 추출된 썸네일 수 (분석 완료 후 업데이트)
    created_at: datetime
    updated_at: datetime
