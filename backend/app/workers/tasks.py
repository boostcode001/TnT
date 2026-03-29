# ML 파이프라인 Celery 태스크 — 씬 감지 → 임베딩 → 스코어링 순으로 Mock 처리
import os
import time
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
from app.workers.celery_app import celery_app
from app.core.config import settings


def _get_collection():
    """
    Celery worker는 FastAPI의 비동기 루프와 별도로 실행되므로
    motor(비동기) 대신 pymongo(동기) 클라이언트를 사용
    """
    client = MongoClient(settings.MONGO_URI)
    db = client[settings.DB_NAME]
    return client, db.analysis_jobs


@celery_app.task(name="run_analysis_pipeline")
def run_analysis_pipeline(job_id: str, video_path: str):
    """
    ML 분석 파이프라인 태스크
    - job_id: 분석 작업 문서의 MongoDB ObjectId 문자열
    - video_path: 업로드된 영상 파일의 임시 경로
    - 각 단계 사이 sleep(2)로 실제 처리처럼 보이게 구성 (Mock)
    """
    client, col = _get_collection()
    try:
        oid = ObjectId(job_id)

        # 1단계: 씬 감지 시작 — status를 processing으로 변경
        col.update_one({"_id": oid}, {"$set": {"status": "processing", "pipeline_step": "scene_detect"}})

        # 2단계: 임베딩 처리
        time.sleep(2)
        col.update_one({"_id": oid}, {"$set": {"pipeline_step": "embedding"}})

        # 3단계: 스코어링
        time.sleep(2)
        col.update_one({"_id": oid}, {"$set": {"pipeline_step": "scoring"}})

        # 4단계: 완료 — Mock 결과 데이터를 함께 저장
        time.sleep(2)
        frame_scores = [
            {"timestamp": 1.2, "scene_index": 0, "score": 0.82},
            {"timestamp": 3.4, "scene_index": 0, "score": 0.61},
            {"timestamp": 6.1, "scene_index": 1, "score": 0.74},
            {"timestamp": 8.9, "scene_index": 1, "score": 0.55},
            {"timestamp": 11.3, "scene_index": 2, "score": 0.91},
            {"timestamp": 14.7, "scene_index": 2, "score": 0.68},
            {"timestamp": 17.2, "scene_index": 3, "score": 0.77},
            {"timestamp": 20.5, "scene_index": 3, "score": 0.43},
            {"timestamp": 23.1, "scene_index": 4, "score": 0.88},
            {"timestamp": 26.8, "scene_index": 4, "score": 0.65},
        ]
        col.update_one({"_id": oid}, {"$set": {
            "status": "done",
            "pipeline_step": "done",
            # Mock ML 결과: 씬별 대표 프레임과 점수 (실제 모델 교체 시 이 부분만 수정)
            "result": {
                "scene_count": 5,
                "frame_count": 18,
                "frame_scores": frame_scores,
                # 실제 썸네일 추출 기능 구현 전까지 null 유지
                "top_thumbnail_url": None
            }
        }})

        # projects 컬렉션의 status, thumbnail_count 업데이트
        job_doc = col.find_one({"_id": oid})
        if job_doc and job_doc.get("project_id"):
            pc = MongoClient(settings.MONGO_URI)
            pd = pc[settings.DB_NAME]
            pd.projects.update_one(
                {"_id": ObjectId(job_doc["project_id"])},
                {"$set": {
                    "status": "done",
                    "thumbnail_count": 10,
                    "updated_at": datetime.utcnow(),
                }}
            )
            pc.close()

    except Exception:
        # 어느 단계에서든 예외 발생 시 failed로 마킹 후 재raise
        col.update_one({"_id": oid}, {"$set": {"status": "failed"}})
        raise
    finally:
        # 임시 영상 파일 정리 — 성공/실패 관계없이 항상 삭제
        if os.path.exists(video_path):
            os.remove(video_path)
        client.close()
