import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProjectStore from '../store/useProjectStore';
import useAuthStore from '../store/useAuthStore';
import WorkContent from './WorkContent';

// ── ResultHeader ────────────────────────────────────────────
function ResultHeader({ project, resultData }) {
  return (
    <div className="bg-[#211f1a] border border-[#2e2b24] rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <span className="text-[#f0ead8] font-semibold text-sm truncate">{project.name}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
          project.status === 'failed'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-green-500/20 text-green-400'
        }`}>
          {project.status === 'failed' ? '❌ 분석 실패' : '✅ 분석 완료'}
        </span>
      </div>
      {resultData && (
        <div className="flex gap-4 text-[#a89880] text-sm">
          <span>🎬 씬 {resultData.scene_count}개</span>
          <span>🖼 프레임 {resultData.frame_count}개</span>
          <span>📊 분석 {resultData.frame_scores?.length ?? 0}개</span>
        </div>
      )}
    </div>
  );
}

export default function ResultPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const loading = useProjectStore((s) => s.loading);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      const found = projects.find((p) => p.id === projectId) ??
                    projects.find((p) => String(p.id) === String(projectId));
      if (!found) {
        fetchProjects();
      }
    }
  }, [isLoggedIn, projectId]);

  const project =
    projects.find((p) => p.id === projectId) ??
    projects.find((p) => String(p.id) === String(projectId));

  if (!project) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64 gap-3 text-[#a89880]">
          <div className="w-5 h-5 border-2 border-[#b5832a] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">프로젝트 불러오는 중...</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-[#a89880]">
        <p>프로젝트를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-[#d4a843] hover:text-[#e0bc6a] text-sm transition-colors"
        >
          ← 대시보드로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-[#7a6e5e] hover:text-[#d4cab4] transition-colors text-sm"
        >
          ← 대시보드
        </button>
        <span className="text-[#3a3630]">/</span>
        <h1 className="text-xl font-bold text-[#f0ead8] truncate">{project.name}</h1>
      </div>

      {project.status === 'failed' ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#a89880]">
          <span className="text-4xl">❌</span>
          <p className="text-base">분석 중 오류가 발생했습니다.</p>
          <p className="text-sm text-[#5a5048]">영상을 다시 업로드해 주세요.</p>
          <button
            onClick={() => navigate('/upload')}
            className="mt-2 bg-[#b5832a] hover:bg-[#c99235] text-[#f0ead8] text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            다시 업로드하기
          </button>
        </div>
      ) : project.last_job_id ? (
        <>
          <ResultHeader project={project} resultData={resultData} />
          <WorkContent
            key={project.id}
            workTitle={project.name}
            jobId={project.last_job_id}
            onResult={(data) => setResultData(data)}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#a89880]">
          <span className="text-4xl">⏳</span>
          <p className="text-base">분석이 아직 시작되지 않았습니다.</p>
          <button
            onClick={() => navigate('/upload')}
            className="mt-2 bg-[#b5832a] hover:bg-[#c99235] text-[#f0ead8] text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            영상 업로드하기
          </button>
        </div>
      )}
    </div>
  );
}
