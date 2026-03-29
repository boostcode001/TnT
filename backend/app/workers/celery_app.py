# Celery 앱 설정 — Redis를 브로커/백엔드로 사용하는 비동기 태스크 큐
from celery import Celery
from app.core.config import settings

# 브로커(태스크 전달)와 백엔드(결과 저장) 모두 Redis 사용
celery_app = Celery(
    "tnt_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    # 태스크 직렬화 포맷을 JSON으로 통일 (가독성 및 호환성)
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    # 로그 타임스탬프 및 스케줄링을 한국 시간 기준으로 설정
    timezone="Asia/Seoul",
)

# tasks 모듈을 여기서 임포트해 Celery가 태스크를 자동 등록하도록 강제
import app.workers.tasks  # noqa: F401
