// 실제 ML 분석 결과 뷰 — GET /analysis/job/:id/result 응답을 시각화
// 순서: 상위 썸네일 → 요약 카드 → 프레임 스코어(접기/펼치기)
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { BarChart2, ChevronDown, ChevronUp, X } from "lucide-react";
import SimpleBarChart from "./SimpleBarChart";
import { renameProjectAPI } from "../api/index";
import useProjectStore from "../store/useProjectStore";

// ── AI API 호출 추상화 함수 — 추후 Claude/Gemini/ChatGPT로 교체 가능 ──
async function generateTitlesWithAI(thumbnails, customPrompt = '') {
  const prompt = `
아래는 유튜브 영상 썸네일 후보 데이터야.
각 썸네일에 어울리는 유튜브 제목을 하나씩 생성해줘.

조건:
- 각 제목은 30자 이내
- 클릭을 유도하는 매력적인 한국어 제목
- 썸네일마다 서로 다른 분위기의 제목
- 번호나 설명 없이 제목만 출력
${customPrompt ? `- 추가 스타일 조건: ${customPrompt}` : ''}

썸네일 데이터:
${thumbnails.map((t, i) => `${i + 1}. 씬${t.scene_index}, 타임스탬프 ${t.timestamp}초, 점수 ${Math.round(t.score * 100)}점`).join('\n')}

응답 형식 (JSON만, 다른 텍스트 없이):
{"titles": ["제목1", "제목2", "제목3"]}
  `.trim();

  // ── Claude API ──────────────────────────────────────
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_AI_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await response.json();
  const text = data.content?.[0]?.text ?? '{}';
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  return parsed.titles ?? [];

  // ── Gemini API (교체 시 위 블록 대신 사용) ──────────
  // const response = await fetch(
  //   `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${import.meta.env.VITE_AI_API_KEY}`,
  //   { method: 'POST', headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
  // );
  // const data = await response.json();
  // const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  // return JSON.parse(text.replace(/```json|```/g, '').trim()).titles ?? [];

  // ── ChatGPT API (교체 시 위 블록 대신 사용) ─────────
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_AI_API_KEY}` },
  //   body: JSON.stringify({
  //     model: 'gpt-4o-mini',
  //     messages: [{ role: 'user', content: prompt }],
  //   }),
  // });
  // const data = await response.json();
  // const text = data.choices?.[0]?.message?.content ?? '{}';
  // return JSON.parse(text.replace(/```json|```/g, '').trim()).titles ?? [];
}

// ── 프로젝트 이름 변경 제안 모달 ────────────────────────────────
function RenameModal({ title, onConfirm, onCancel }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="relative w-full max-w-[380px] mx-4 bg-[#2a2720] border border-[#3a3630] rounded-2xl p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[#f0ead8] font-bold text-base mb-1">프로젝트 이름 변경</p>
            <p className="text-[#a89880] text-sm leading-relaxed">
              이 썸네일의 AI 생성 제목으로 프로젝트 이름을 변경할까요?
            </p>
          </div>
          <div className="bg-[#211f1a] border border-[#b5832a]/40 rounded-xl px-4 py-3">
            <p className="text-[#5a5048] text-[11px] mb-1">변경될 이름</p>
            <p className="text-[#d4a843] text-sm font-semibold leading-snug">{title}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={onConfirm}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#b5832a] hover:bg-[#c99235] text-[#1a1814] transition-colors"
            >
              변경하기
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#35312a] hover:bg-[#45403a] text-[#a89880] transition-colors"
            >
              그냥 두기
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── 썸네일 hover 상세 팝업 (Steam 카드 스타일) ──────────────────
function ThumbnailHoverCard({ s, pos, rank, title }) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: pos.y,
        left: pos.x,
        zIndex: 99999,
        width: '260px',
        pointerEvents: 'none',
      }}
    >
      <div
        className="bg-[#1a1814] border border-[#3a3630] rounded-xl shadow-2xl overflow-hidden"
        style={{ animation: 'fadeIn 0.15s ease' }}
      >
        {/* 상단: 썸네일 플레이스홀더 */}
        <div
          className="relative w-full h-[140px] flex flex-col items-center justify-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, #1a2a3a 0%, #0f1e2d 100%)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#4ade80" strokeWidth="1.5"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="#4ade80"/>
            <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: '#5a5048', fontSize: '11px' }}>썸네일 준비 중</span>
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: rank === 1 ? '#b5832a' : rank === 2 ? '#1D9E75' : '#5a4a3a',
              color: '#f0ead8',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '6px',
            }}
          >
            {rank}위
          </div>
        </div>

        {/* AI 생성 제목 */}
        <div className="px-3 pt-3 pb-1">
          {title ? (
            <p className="text-[#f0ead8] text-[13px] font-semibold leading-snug">{title}</p>
          ) : (
            <div className="h-4 bg-[#2a2720] rounded animate-pulse w-3/4" />
          )}
        </div>

        <div className="mx-3 my-2 h-px bg-[#2e2b24]" />

        {/* 종합 점수 */}
        <div className="px-3 pb-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[#a89880] text-[11px]">종합 점수</span>
            <span className={`text-sm font-bold ${s.score >= 0.8 ? 'text-green-400' : s.score >= 0.6 ? 'text-yellow-400' : 'text-red-400'}`}>
              {Math.round(s.score * 100)}점
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#2e2b24] rounded-full">
            <div
              className={`h-full rounded-full ${s.score >= 0.8 ? 'bg-green-400' : s.score >= 0.6 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${s.score * 100}%` }}
            />
          </div>
        </div>

        <div className="mx-3 mb-2 h-px bg-[#2e2b24]" />

        {/* 점수 구성 */}
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <p className="text-[#7a6e5e] text-[10px] uppercase tracking-wider mb-0.5">점수 구성</p>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#a89880]">내용 적합성</span>
              <span className="text-green-400 font-semibold">50%</span>
            </div>
            <div className="text-[10px] text-[#5a5048]">CLIP 모델 — 영상 전체 대표도</div>
            <div className="w-full h-1 bg-[#2e2b24] rounded-full">
              <div className="h-full rounded-full bg-green-400/60" style={{ width: '50%' }} />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#a89880]">시각적 임팩트</span>
              <span className="text-yellow-400 font-semibold">40%</span>
            </div>
            <div className="text-[10px] text-[#5a5048]">움직임 · 장면 변화 · 대비</div>
            <div className="w-full h-1 bg-[#2e2b24] rounded-full">
              <div className="h-full rounded-full bg-yellow-400/60" style={{ width: '40%' }} />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#a89880]">OCR 정보 전달력</span>
              <span className="text-[#d4a843] font-semibold">10%</span>
            </div>
            <div className="text-[10px] text-[#5a5048]">화면 내 텍스트 분석</div>
            <div className="w-full h-1 bg-[#2e2b24] rounded-full">
              <div className="h-full rounded-full bg-[#d4a843]/60" style={{ width: '10%' }} />
            </div>
          </div>
        </div>

        {/* 씬 정보 */}
        <div className="mx-3 mb-3 bg-[#211f1a] rounded-lg px-3 py-2 flex justify-between">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[#5a5048] text-[10px]">씬</span>
            <span className="text-[#e8e0cc] text-xs font-semibold">{s.scene_index}</span>
          </div>
          <div className="w-px bg-[#2e2b24]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[#5a5048] text-[10px]">타임스탬프</span>
            <span className="text-[#e8e0cc] text-xs font-semibold">{s.timestamp}s</span>
          </div>
          <div className="w-px bg-[#2e2b24]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[#5a5048] text-[10px]">순위</span>
            <span className="text-[#d4a843] text-xs font-semibold">{rank}위</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── 썸네일 확대 라이트박스 ────────────────────────────────────
function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-[#a89880] hover:text-[#f0ead8] transition-colors text-sm flex items-center gap-1"
        >
          <X size={16} /> ESC로 닫기
        </button>
        {src ? (
          <img src={src} alt={alt} className="w-full rounded-xl shadow-2xl" />
        ) : (
          <div
            className="w-full aspect-video rounded-xl flex flex-col items-center justify-center gap-3"
            style={{ background: 'linear-gradient(135deg, #1a2a3a 0%, #0f1e2d 100%)' }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="opacity-40">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#4ade80" strokeWidth="1.5"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="#4ade80"/>
              <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span className="text-[#7a6e5e] text-sm">썸네일 준비 중</span>
          </div>
        )}
      </div>

    </div>
  );
}

// ── 썸네일 카드 저장 버튼 그룹 ──────────────────────────────
function ThumbnailActions({ s, thumbnailUrl, onRenamePropose }) {
  const [copied, setCopied] = useState(false);
  const [customNameOpen, setCustomNameOpen] = useState(false);
  const [customNameValue, setCustomNameValue] = useState('');
  // TODO: DB 연동 시 isPublic 상태를 서버에 저장
  const [isPublic, setIsPublic] = useState(false);

  const handleCopy = async () => {
    const text = thumbnailUrl || `score: ${Math.round(s.score * 100)}점, timestamp: ${s.timestamp}s`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const downloadBlob = async (filename) => {
    if (!thumbnailUrl) return;
    try {
      const response = await fetch(thumbnailUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleSave = () => {
    downloadBlob(`thumbnail_${s.scene_index}_${s.timestamp}s.png`);
  };

  const handleCustomSave = () => {
    if (!customNameValue.trim()) return;
    const name = customNameValue.trim();
    downloadBlob(name.endsWith('.png') ? name : `${name}.png`);
    setCustomNameOpen(false);
    setCustomNameValue('');
  };

  const btnCls = [
    'flex-1 py-1.5 rounded-lg text-[11px] border transition-colors',
    'bg-[#2a2720] border-[#3a3630] text-[#a89880]',
    'hover:border-[#b5832a]/60 hover:text-[#d4a843]',
  ].join(' ');

  const btnDisabledCls = [
    'flex-1 py-1.5 rounded-lg text-[11px] border',
    'bg-[#2a2720] border-[#3a3630] text-[#a89880]',
    'opacity-40 cursor-not-allowed',
  ].join(' ');

  return (
    <div className="px-2.5 pb-2.5 flex flex-col gap-1.5">
      <div className="flex gap-1">
        <button onClick={handleCopy} className={btnCls}>
          {copied ? '✓ 복사됨' : '📋 복사'}
        </button>
        <button
          onClick={handleSave}
          disabled={!thumbnailUrl}
          className={thumbnailUrl ? btnCls : btnDisabledCls}
        >
          {thumbnailUrl ? '💾 저장' : '준비 중'}
        </button>
        <button
          onClick={() => setIsPublic((v) => !v)}
          className={[
            'flex-1 py-1.5 rounded-lg text-[11px] border transition-colors',
            isPublic
              ? 'bg-[#b5832a]/20 border-[#b5832a]/60 text-[#d4a843]'
              : 'bg-[#2a2720] border-[#3a3630] text-[#a89880] hover:border-[#b5832a]/60 hover:text-[#d4a843]',
          ].join(' ')}
        >
          {isPublic ? '🌐 공개중' : '🔒 비공개'}
        </button>
        <button
          onClick={() => thumbnailUrl && setCustomNameOpen((v) => !v)}
          disabled={!thumbnailUrl}
          className={thumbnailUrl ? btnCls : btnDisabledCls}
        >
          📁 다른 이름
        </button>
      </div>

      {onRenamePropose && (
        <button
          onClick={onRenamePropose}
          className="w-full py-1.5 rounded-lg text-[11px] border transition-colors bg-[#2a2720] border-[#b5832a]/40 text-[#d4a843] hover:bg-[#b5832a]/10 mt-1"
        >
          📝 AI 제목으로 프로젝트 이름 변경
        </button>
      )}

      {customNameOpen && (
        <div className="flex gap-1">
          <input
            autoFocus
            value={customNameValue}
            onChange={(e) => setCustomNameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomSave();
              if (e.key === 'Escape') { setCustomNameOpen(false); setCustomNameValue(''); }
            }}
            placeholder="파일명 입력"
            className="flex-1 bg-[#211f1a] border border-[#3a3630] focus:border-[#b5832a] rounded-lg px-2 py-1 text-[11px] text-[#e8e0cc] outline-none transition-colors"
          />
          <button
            onClick={handleCustomSave}
            className="px-3 py-1 bg-[#b5832a] hover:bg-[#c99235] text-[#f0ead8] text-[11px] rounded-lg transition-colors shrink-0"
          >
            저장
          </button>
        </div>
      )}
    </div>
  );
}

export default function RealResultView({ result }) {
  const { projectId } = useParams();
  const renameProject = useProjectStore((s) => s.renameProject);

  // 프레임 스코어 섹션 펼침 여부 (기본 접힘)
  const [showChart, setShowChart] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  // 프레임 목록 전체 보기 여부 (기본 3개만 표시)
  const [showAllFrames, setShowAllFrames] = useState(false);

  // AI 생성 제목
  const [titles, setTitles] = useState({});
  const [titlesLoading, setTitlesLoading] = useState(false);

  // 프로젝트 이름 변경 모달
  const [renameModal, setRenameModal] = useState(null);

  // 썸네일 확대 라이트박스
  const [lightbox, setLightbox] = useState(null);

  // hover 카드
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // 차트는 상위 3개 프레임만 표시 (score 내림차순 정렬)
  const chartData = [...result.frame_scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => ({ label: `${s.timestamp}s`, value: Math.round(s.score * 100) }));

  // 썸네일 섹션도 동일한 상위 3개 사용
  const top3 = [...result.frame_scores].sort((a, b) => b.score - a.score).slice(0, 3);

  // AI 제목 생성
  useEffect(() => {
    if (!result?.frame_scores?.length) return;

    const top3Frames = [...result.frame_scores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    setTitlesLoading(true);
    generateTitlesWithAI(top3Frames, result.customPrompt ?? '')
      .then((generatedTitles) => {
        const titleMap = {};
        top3Frames.forEach((t, i) => {
          titleMap[`${t.scene_index}_${t.timestamp}`] = generatedTitles[i] ?? '';
        });
        setTitles(titleMap);
      })
      .catch(() => {
        // 실패 시 빈 상태 유지
      })
      .finally(() => setTitlesLoading(false));
  }, [result]);

  return (
    <>
    <div className="flex flex-col gap-3.5" style={{ animation: "fadeIn 0.4s ease" }}>

      {/* 1. 상위 썸네일 — score 높은 순 3개 카드 가로 나열 */}
      <div className="bg-[#201e19] rounded-[14px] border border-[#2e2b24] overflow-hidden">
        <div className="p-3 px-4 border-b border-[#2e2b24]">
          <p className="text-[#a89880] text-[13px] font-medium">상위 썸네일</p>
        </div>
        <div className="p-3.5 px-4 flex flex-col gap-3">
          {top3.map((s, i) => (
            <div
              key={i}
              className="bg-[#1a1814] border border-[#2e2b24] rounded-[10px] overflow-hidden flex"
              style={{ position: 'relative', zIndex: 0 }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const popupW = 260;
                const popupH = 440;

                const spaceRight = window.innerWidth - rect.right;
                const x = spaceRight > popupW + 16
                  ? rect.right + 12
                  : rect.left - popupW - 12;

                let y = rect.top;
                if (y + popupH > window.innerHeight - 16) {
                  y = window.innerHeight - popupH - 16;
                }
                if (y < 16) y = 16;

                setHoverPos({ x, y });
                setHoveredCard(i);
              }}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* 이미지 영역 */}
              <div
                className="relative shrink-0 w-[220px] h-[160px] overflow-hidden cursor-pointer"
                onClick={() => setLightbox({ src: result.top_thumbnail_url, alt: `썸네일 ${i + 1}` })}
              >
                {result.top_thumbnail_url ? (
                  <img
                    src={result.top_thumbnail_url}
                    alt={`썸네일 ${i + 1}`}
                    className="w-full h-full object-cover block"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #1a2a3a 0%, #0f1e2d 100%)', position: 'relative', zIndex: 0 }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
                      <rect x="3" y="3" width="18" height="18" rx="3" stroke="#4ade80" strokeWidth="1.5"/>
                      <circle cx="8.5" cy="8.5" r="1.5" fill="#4ade80"/>
                      <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ color: '#5a5048', fontSize: '11px' }}>썸네일 준비 중</span>
                  </div>
                )}
              </div>

              {/* 우측 정보 영역 */}
              <div className="flex-1 flex flex-col p-3 min-w-0">
                {/* AI 생성 제목 */}
                <div className="mb-2">
                  {titlesLoading ? (
                    <div className="h-4 bg-[#2a2720] rounded animate-pulse w-3/4" />
                  ) : titles[`${s.scene_index}_${s.timestamp}`] ? (
                    <p className="text-[#e8e0cc] text-[13px] font-semibold leading-snug line-clamp-2">
                      {titles[`${s.scene_index}_${s.timestamp}`]}
                    </p>
                  ) : (
                    <p className="text-[#5a5048] text-[12px]">제목 생성 중...</p>
                  )}
                </div>

                {/* 점수 바 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm font-bold ${s.score >= 0.8 ? 'text-green-400' : s.score >= 0.6 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {Math.round(s.score * 100)}점
                  </span>
                  <div className="flex-1 h-1.5 bg-[#2e2b24] rounded-full">
                    <div
                      className={`h-full rounded-full ${s.score >= 0.8 ? 'bg-green-400' : s.score >= 0.6 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${s.score * 100}%` }}
                    />
                  </div>
                </div>

                {/* 저장 버튼 그룹 */}
                <div className="mt-auto">
                  <ThumbnailActions
                    s={s}
                    thumbnailUrl={result.top_thumbnail_url}
                    onRenamePropose={
                      titles[`${s.scene_index}_${s.timestamp}`]
                        ? () => setRenameModal({ title: titles[`${s.scene_index}_${s.timestamp}`] })
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 요약 카드 — 씬 수 / 프레임 수 / 분석된 프레임 수 */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "씬 수", value: result.scene_count },
          { label: "프레임 수", value: result.frame_count },
          { label: "분석 프레임", value: result.frame_scores.length },
        ].map(({ label, value }) => (
          <div key={label} className="flex-[1_1_80px] bg-[#201e19] border border-[#2e2b24] rounded-xl p-3.5 px-4 text-center">
            <p className="mb-1 text-[#7a6e5e] text-[11px] uppercase tracking-wider">{label}</p>
            <p className="text-green-400 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* 3. 프레임 스코어 — 기본 접힘, "상세 분석 보기" 버튼으로 펼침 */}
      <div className="bg-[#201e19] rounded-[14px] border border-[#2e2b24] overflow-hidden">
        <div className={`p-3 px-4 flex items-center justify-between ${showDetail ? "border-b border-[#2e2b24]" : ""}`}>
          <p className="text-[#a89880] text-[13px] font-medium">프레임 스코어</p>
          <button
            onClick={() => setShowDetail((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-xs cursor-pointer transition-all ${
              showDetail ? "bg-[#2a1f0a] border border-[#b5832a]/60 text-[#d4a843]" : "bg-transparent border border-[#3a3630] text-[#a89880] hover:border-[#4a4640]"
            }`}
          >
            {showDetail ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showDetail ? "숨기기" : "상세 분석 보기"}
          </button>
        </div>

        {showDetail && (
          <>
            {/* 차트 토글 버튼 */}
            <div className="pt-2.5 px-4 pb-1 flex justify-end">
              <button
                onClick={() => setShowChart((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-xs cursor-pointer transition-all ${
                  showChart ? "bg-[#2a1f0a] border border-[#b5832a]/60 text-[#d4a843]" : "bg-transparent border border-[#3a3630] text-[#a89880] hover:border-[#4a4640]"
                }`}
              >
                <BarChart2 size={13} />
                {showChart ? "차트 숨기기" : "차트로 보기"}
              </button>
            </div>

            {/* 상위 3개 프레임을 바 차트로 시각화 */}
            {showChart && (
              <div className="px-4 pt-1 pb-3">
                <SimpleBarChart data={chartData} />
              </div>
            )}

            {/* 프레임 목록: 기본 3개, "전체 보기" 버튼으로 전체 펼침 */}
            <div className="px-4 pt-2 pb-4 flex flex-col gap-1.5">
              {(showAllFrames ? result.frame_scores : result.frame_scores.slice(0, 3)).map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg bg-[#1a1814]">
                  <span className="text-[#7a6e5e] text-[11px] w-[50px] shrink-0">씬 {s.scene_index}</span>
                  <span className="text-[#a89880] text-[11px] w-[55px] shrink-0">{s.timestamp}s</span>
                  {/* 점수 비율만큼 바 너비를 채움, 점수 구간별 색상 적용 */}
                  <div className="flex-1 h-1.5 bg-[#2e2b24] rounded-sm">
                    <div
                      className={`h-full rounded-sm transition-all duration-600 ${s.score >= 0.8 ? "bg-green-400" : s.score >= 0.6 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: `${s.score * 100}%` }}
                    />
                  </div>
                  <span className="text-[#e8e0cc] text-xs font-semibold w-9 text-right shrink-0">
                    {Math.round(s.score * 100)}
                  </span>
                </div>
              ))}
              {/* 3개 초과일 때만 "전체 보기" 버튼 표시 */}
              {result.frame_scores.length > 3 && (
                <button
                  onClick={() => setShowAllFrames((v) => !v)}
                  className="mt-1 py-[7px] rounded-lg bg-transparent border border-[#3a3630] text-[#7a6e5e] text-xs cursor-pointer transition-all w-full hover:border-green-400 hover:text-green-400"
                >
                  {showAllFrames ? "접기" : `전체 보기 (${result.frame_scores.length}개)`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>

    {lightbox && (
      <ImageLightbox
        src={lightbox.src}
        alt={lightbox.alt}
        onClose={() => setLightbox(null)}
      />
    )}
    {hoveredCard !== null && (
      <ThumbnailHoverCard
        s={top3[hoveredCard]}
        pos={hoverPos}
        rank={hoveredCard + 1}
        title={titles[`${top3[hoveredCard].scene_index}_${top3[hoveredCard].timestamp}`]}
      />
    )}
    {renameModal && (
      <RenameModal
        title={renameModal.title}
        onConfirm={async () => {
          try {
            await renameProjectAPI(projectId, renameModal.title);
            renameProject(projectId, renameModal.title);
          } catch {}
          setRenameModal(null);
        }}
        onCancel={() => setRenameModal(null)}
      />
    )}
    </>
  );
}
