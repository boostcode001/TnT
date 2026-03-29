import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../store/useProjectStore';
import useAuthStore from '../store/useAuthStore';

// ── 날짜 포맷 ───────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 10).replace(/-/g, '.');
}

// ── StatusBadge ────────────────────────────────────────────
function getStatus(project) {
  if (project.status === 'done') return 'done';
  if (project.thumbnail_count > 0) return 'done';
  if (project.status === 'failed') return 'failed';
  if (!project.last_job_id) return 'done';
  return 'analyzing';
}

function StatusBadge({ status }) {
  const cls =
    status === 'done'   ? 'bg-green-500/20 text-green-400' :
    status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400';
  return (
    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {status === 'done' ? '완료' : status === 'failed' ? '실패' : '분석중'}
    </span>
  );
}

// ── ProjectCard ────────────────────────────────────────────
function ProjectCard({ project, onClick }) {
  return (
    <div
      onClick={onClick}
      className="
        bg-[#211f1a] border border-[#2e2b24]
        hover:border-2 hover:border-[#b5832a]
        rounded-xl p-5 cursor-pointer
        transition-all duration-150
        flex flex-col gap-3 min-h-[130px]
      "
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#f0ead8] line-clamp-2 flex-1">
          {project.name}
        </h3>
        <StatusBadge status={getStatus(project)} />
      </div>
      <p className="text-xs text-[#7a6e5e]">🖼 썸네일 {project.thumbnail_count}개</p>
      <p className="text-xs text-[#5a5048] mt-auto">{formatDate(project.created_at)}</p>
    </div>
  );
}

// ── NewProjectCard ─────────────────────────────────────────
function NewProjectCard({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="
        border-2 border-dashed border-[#3a3630]
        hover:border-[#b5832a] hover:text-[#d4a843]
        rounded-xl p-5 cursor-pointer
        transition-colors duration-150
        flex flex-col items-center justify-center gap-2
        min-h-[130px] text-[#7a6e5e]
      "
    >
      <span className="text-2xl leading-none">＋</span>
      <span className="text-sm font-medium">새 프로젝트 만들기</span>
    </div>
  );
}

// ── WelcomeSection ─────────────────────────────────────────
function WelcomeSection({ onStart }) {
  return (
    <div className="mb-8">
      {/* 카피 */}
      <p className="text-[#f0ead8] text-xl font-bold">
        고민하지 마세요, TnT가 대신 찾아드릴게요 🎬
      </p>
      <p className="text-[#a89880] text-sm mt-1">
        영상을 올리면 AI가 썸네일과 제목을 자동으로 만들어드립니다.
      </p>

      {/* 사용법 3단계 */}
      <div className="bg-[#211f1a] border border-[#2e2b24] rounded-2xl p-5 mt-4">
        <div className="flex gap-0">
          {[
            { step: '① 영상 업로드', emoji: '🎬', title: '영상 업로드', desc: '유튜브 영상 파일을 올려주세요' },
            { step: '② AI 분석',    emoji: '⚙️', title: 'AI 분석',    desc: 'AI가 핵심 장면을 분석합니다' },
            { step: '③ 결과 확인',  emoji: '✨', title: '결과 확인',  desc: '썸네일과 제목을 바로 받아보세요' },
          ].map((item, idx) => (
            <>
              {idx > 0 && (
                <div key={`sep-${idx}`} className="w-px bg-[#2e2b24] self-stretch my-2" />
              )}
              <div key={item.step} className="flex-1 flex flex-col items-center text-center gap-2 px-4">
                <span className="text-[#b5832a] text-xs font-bold uppercase tracking-wider">{item.step}</span>
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-[#e8e0cc] text-sm font-semibold">{item.title}</span>
                <span className="text-[#7a6e5e] text-xs leading-relaxed">{item.desc}</span>
              </div>
            </>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-end mt-3">
        <button
          onClick={onStart}
          className="bg-[#b5832a] hover:bg-[#c99235] text-[#1a1814] text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          새 프로젝트 시작하기 →
        </button>
      </div>
    </div>
  );
}

// ── DashboardPage ──────────────────────────────────────────
export default function DashboardPage() {
  const { projects, loading, fetchProjects } = useProjectStore();
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const [claimDone, setClaimDone] = useState(() => {
    // 로그인 상태일 때만 claim_done 표시
    const done = sessionStorage.getItem('claim_done');
    if (done) {
      sessionStorage.removeItem('claim_done');
      return true;
    }
    return false;
  });

  // 로그아웃 시 배너 자동 숨김
  useEffect(() => {
    if (!isLoggedIn) setClaimDone(false);
  }, [isLoggedIn]);

  useEffect(() => { if (isLoggedIn) fetchProjects(); }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#2a2720] rounded-2xl h-36 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* 귀속 완료 배너 */}
      {claimDone && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-green-400 text-sm">
            🎉 이전에 분석한 결과가 내 프로젝트에 저장되었어요!
          </p>
          <button onClick={() => setClaimDone(false)} className="text-green-600 hover:text-green-400 text-xs">
            닫기
          </button>
        </div>
      )}

      {/* 웰컴 섹션 */}
      <WelcomeSection onStart={() => navigate('/upload')} />

      {/* 프로젝트 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-[#f0ead8]">내 프로젝트</h1>
        <span className="bg-[#2a2720] text-[#a89880] text-xs font-semibold px-2.5 py-1 rounded-full">
          {projects.length}
        </span>
      </div>

      {projects.length === 0 ? (
        /* 빈 상태 */
        !isLoggedIn ? (
          <div className="flex flex-col items-center justify-center gap-3 mt-8 py-16
            bg-[#211f1a] border border-dashed border-[#3a3630] rounded-2xl text-center">
            <span className="text-4xl">🎬</span>
            <p className="text-[#e8e0cc] text-base font-semibold">
              영상을 올려 썸네일을 만들어보세요
            </p>
            <p className="text-[#7a6e5e] text-sm leading-relaxed">
              로그인하면 결과를 저장하고 언제든지 다시 볼 수 있어요
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 mt-8 py-16
            bg-[#211f1a] border border-dashed border-[#3a3630] rounded-2xl text-center">
            <span className="text-4xl">🎬</span>
            <p className="text-[#e8e0cc] text-base font-semibold">
              아직 만들어진 작품이 없어요
            </p>
            <p className="text-[#7a6e5e] text-sm leading-relaxed">
              영상 하나만 올려보세요.<br />
              AI가 썸네일과 제목을 바로 만들어드릴게요.
            </p>
          </div>
        )
      ) : (
        /* 카드 그리드 */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => navigate(`/result/${p.id}`)}
            />
          ))}
          <NewProjectCard onClick={() => navigate('/upload')} />
        </div>
      )}
    </div>
  );
}
