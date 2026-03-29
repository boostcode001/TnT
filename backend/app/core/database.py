# MongoDB 비동기 클라이언트 연결 — 앱 전역에서 db 객체를 공유해 사용
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# motor는 FastAPI의 비동기 환경과 호환되는 MongoDB 드라이버
client = AsyncIOMotorClient(settings.MONGO_URI)
# settings.DB_NAME에 지정된 데이터베이스를 전역 db 객체로 노출
db = client[settings.DB_NAME]
