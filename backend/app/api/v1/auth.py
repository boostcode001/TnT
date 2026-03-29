# 인증 API — 로그인, 회원가입, 내 정보 조회
from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from app.core.database import db
from app.core.security import create_access_token, get_current_user
from app.models.user import LoginRequest, TokenResponse, UserResponse
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

router = APIRouter()


# POST /auth/login — 로그인 후 JWT 토큰 반환
@router.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user = await db.users.find_one({"username": request.username})
    if user is None or not verify_password(request.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 틀렸습니다",
        )
    token = create_access_token({"sub": request.username})
    return TokenResponse(access_token=token)


# POST /auth/register — 회원가입 (아이디 + 비밀번호)
@router.post("/auth/register", status_code=201)
async def register(request: LoginRequest):
    # 아이디 중복 확인
    existing = await db.users.find_one({"username": request.username})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 아이디입니다",
        )
    # 아이디 길이 검증
    if len(request.username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="아이디는 3자 이상이어야 합니다",
        )
    # 비밀번호 길이 검증
    if len(request.password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호는 4자 이상이어야 합니다",
        )
    # 유저 생성
    doc = {
        "username": request.username,
        "password": hash_password(request.password),
        "created_at": datetime.utcnow(),
    }
    await db.users.insert_one(doc)
    # 가입 후 자동 로그인용 토큰 발급
    token = create_access_token({"sub": request.username})
    return {"access_token": token, "message": "회원가입 완료"}


# GET /auth/me — 현재 로그인된 유저 정보 반환
@router.get("/auth/me", response_model=UserResponse)
async def me(current_user: UserResponse = Depends(get_current_user)):
    return current_user


# DELETE /auth/withdraw — 회원탈퇴 (유저 + 관련 데이터 전부 삭제)
@router.delete("/auth/withdraw", status_code=200)
async def withdraw(current_user: UserResponse = Depends(get_current_user)):
    from bson import ObjectId

    # 1. 유저의 프로젝트 목록 조회
    projects = await db.projects.find(
        {"user_id": current_user.id}
    ).to_list(length=1000)

    project_ids = [str(p["_id"]) for p in projects]

    # 2. 관련 analysis_jobs 삭제
    if project_ids:
        await db.analysis_jobs.delete_many(
            {"project_id": {"$in": project_ids}}
        )

    # 3. 프로젝트 삭제
    await db.projects.delete_many({"user_id": current_user.id})

    # 4. 유저 삭제
    await db.users.delete_one({"username": current_user.username})

    return {"message": "계정이 삭제되었습니다"}