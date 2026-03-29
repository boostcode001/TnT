# 환경 변수 설정 — .env 파일 또는 시스템 환경 변수에서 값을 읽어옴
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # MongoDB 연결 URI (Docker Compose 서비스명 기반)
    MONGO_URI: str = "mongodb://mongodb-server:27017"
    # 사용할 데이터베이스 이름
    DB_NAME: str = "tnt_capstone"
    # JWT 서명에 사용할 비밀 키 — 반드시 .env에서 주입해야 함
    SECRET_KEY: str
    # JWT 알고리즘 (HS256: 대칭키 서명)
    ALGORITHM: str = "HS256"
    # 액세스 토큰 유효 시간 (시간 단위)
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    # Celery 브로커 및 결과 백엔드용 Redis URL
    REDIS_URL: str = "redis://redis-server:6379/0"

    class Config:
        env_file = ".env"

settings = Settings()
