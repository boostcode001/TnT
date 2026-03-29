// 로고 컴포넌트 — 사이드바 상단에 표시, 클릭 시 홈으로 이동
// name prop으로 팀/프로젝트명을 외부에서 주입받아 재사용 가능하게 설계
export default function Logo({ name, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2.5 pt-1 pb-5 border-b border-zinc-800 mb-4 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
    >
      {/* 그라디언트 배경의 아이콘 박스 */}
      <div className="w-[34px] h-[34px] rounded-[10px] shrink-0 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </div>
      {/* 그라디언트 텍스트 처리 — WebKit clip 방식 사용 */}
      <span className="text-base font-bold tracking-widest bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}
