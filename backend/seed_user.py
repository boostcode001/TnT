# 초기 관리자 계정 생성 스크립트 — 최초 배포 시 한 번만 실행
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    # database.py와 동일한 방식으로 DB 연결
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DB_NAME]

    try:
        # 중복 실행 방지: admin 계정이 이미 있으면 종료
        existing = await db.users.find_one({"username": "admin"})
        if existing:
            print("이미 존재합니다")
            return

        # 초기 admin 계정 삽입 (운영 환경에서는 비밀번호 해싱 적용 필요)
        await db.users.insert_one({
            "username": "admin",
            "password": pwd_context.hash("1234"),
            "created_at": datetime.utcnow(),
        })
        print("admin 계정이 생성되었습니다")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed())
