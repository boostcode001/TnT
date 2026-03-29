# 유저 관련 Pydantic 스키마 정의
from pydantic import BaseModel
from datetime import datetime


# DB 저장용 유저 모델 (내부 처리 전용, API 응답에는 사용하지 않음)
class User(BaseModel):
    id: str
    username: str
    password: str  # 평문 저장 (운영 환경에서는 해싱 필요)
    created_at: datetime


# 로그인 요청 바디 — username/password를 JSON으로 받음
class LoginRequest(BaseModel):
    username: str
    password: str


# 로그인 성공 응답 — JWT 토큰 반환
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"  # OAuth2 표준에 따라 기본값 설정


# 유저 정보 응답 — password를 절대 포함하지 않음 (보안)
class UserResponse(BaseModel):
    id: str
    username: str
