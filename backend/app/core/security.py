# JWT 토큰 생성 및 검증 — 인증이 필요한 모든 엔드포인트에서 Depends로 사용
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from app.core.database import db
from app.models.user import UserResponse

# FastAPI가 Authorization 헤더에서 Bearer 토큰을 자동으로 추출하도록 설정
# tokenUrl은 Swagger UI의 로그인 버튼과 연동됨
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def create_access_token(data: dict) -> str:
    """
    JWT 액세스 토큰 생성
    - data: 토큰에 담을 페이로드 (보통 {"sub": username})
    - 만료 시각(exp)을 현재 시각 + EXPIRE_HOURS로 설정
    """
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    """
    JWT 토큰을 검증하고 현재 로그인 유저를 반환
    - 토큰이 없거나 만료/위조된 경우 401 반환
    - DB에서 username으로 유저를 조회해 존재 여부도 확인
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 서명 및 만료 검증
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        # sub 필드가 없으면 잘못된 토큰
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # 실제 DB에서 유저 확인 (탈퇴/삭제된 계정 방어)
    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception

    return UserResponse(id=str(user["_id"]), username=user["username"])
