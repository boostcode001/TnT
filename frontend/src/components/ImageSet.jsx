// Mock 이미지 카드 — 비로그인 체험 모드에서 분석 결과 플레이스홀더로 사용
// 실제 분석 결과가 있으면 RealResultView를 사용하고 이 컴포넌트는 목 전용
import { useState } from "react";
import { BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import SimpleBarChart from "./SimpleBarChart";

export default function ImageSet({ index, workTitle }) {
  // 차트 표시 여부 토글 상태
  const [showChart, setShowChart] = useState(false);
  // 사용자가 직접 입력하는 이미지 제목
  const [title, setTitle] = useState("");

  return (
    <div
      className="bg-[#181819] rounded-[14px] border border-zinc-800 overflow-hidden"
      // index에 따라 딜레이를 다르게 해 순차적으로 등장하는 효과
      style={{ animation: `fadeUp 0.4s ease ${index * 0.08}s both` }}
    >
      {/* 이미지 플레이스홀더 영역 */}
      <div className="w-full h-[200px] border-b border-zinc-800 flex flex-col items-center justify-center gap-2 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #0f1e2d 60%, #1a2a3a 100%)" }}
      >
        {/* 격자 패턴 오버레이 */}
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(74,222,128,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.04) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" className="opacity-35">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#4ade80" strokeWidth="1.5"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="#4ade80"/>
          <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
        <span className="text-green-400 text-xs opacity-50 font-medium relative">
          {workTitle} · 이미지 {index}
        </span>
      </div>

      <div className="p-3 px-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 차트 토글 버튼 — 활성 상태에 따라 스타일 변경 */}
          <button
            onClick={() => setShowChart((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-medium cursor-pointer transition-all shrink-0 ${
              showChart
                ? "bg-[#004a77] border border-[#0369a1] text-sky-300"
                : "bg-transparent border border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            <BarChart2 size={13} />
            {showChart ? "차트 숨기기" : "차트로 보기"}
            {showChart ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* 이미지 제목 입력 — 로컬 상태로만 관리 (DB 저장 없음) */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
            <span className="text-gray-500 text-xs shrink-0">제목:</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="---"
              className="bg-transparent border-0 border-b border-gray-700 text-gray-300 text-xs py-0.5 px-1 outline-none w-full font-sans focus:border-green-400"
            />
          </div>
        </div>

        {showChart && (
          <div className="bg-[#131314] rounded-[10px] border border-zinc-800 p-3 px-4" style={{ animation: "fadeIn 0.2s ease" }}>
            <p className="mb-0.5 text-[11px] text-gray-500 uppercase tracking-wider">월별 분석 데이터</p>
            {/* index를 seed로 전달해 카드마다 다른 차트 모양 생성 */}
            <SimpleBarChart seed={index} />
          </div>
        )}
      </div>
    </div>
  );
}
