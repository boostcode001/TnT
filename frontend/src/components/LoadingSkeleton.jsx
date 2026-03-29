// 로딩 스켈레톤 — 분석 결과 대기 중 카드 형태의 플레이스홀더를 표시
// 실제 결과 카드와 동일한 레이아웃으로 레이아웃 시프트를 최소화
export default function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3.5">
      {/* 3개의 스켈레톤 카드를 순차적으로 fade-in (딜레이 차등 적용) */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[#181819] rounded-[14px] border border-zinc-800 overflow-hidden"
          style={{ animation: `pulse-fade 1.5s ease-in-out ${i * 0.2}s infinite` }}
        >
          {/* 이미지 영역 플레이스홀더 */}
          <div className="w-full h-[200px] bg-[#1e2530]" />
          {/* 버튼/인풋 영역 플레이스홀더 */}
          <div className="p-3.5 px-4 flex gap-2.5">
            <div className="w-[90px] h-7 bg-zinc-800 rounded-[7px]" />
            <div className="flex-1 h-7 bg-[#1e2020] rounded-[7px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
