# FastAPI 앱 진입점 — 미들웨어 설정 및 라우터 등록
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import projects, auth, analysis

app = FastAPI(title="TnT API Server")

# CORS 설정: 개발 환경에서 모든 출처 허용 (운영 배포 시 origins 제한 필요)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 각 도메인별 라우터를 /api/v1 하위로 등록
app.include_router(projects.router, prefix="/api/v1", tags=["projects"])
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(analysis.router, prefix="/api/v1", tags=["analysis"])

@app.get("/")
async def index():
    # 헬스체크 용도 — 서버 동작 확인
    return {"status": "online", "message": "TnT API Server is running"}
