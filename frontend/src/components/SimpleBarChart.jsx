// 간단한 세로 바 차트 — 분석 결과 프레임 스코어 시각화에 사용
// propData가 없으면 seed 기반 Mock 데이터로 자동 렌더링 (ImageSet 목 분석용)
export default function SimpleBarChart({ seed = 1, data: propData }) {
  // propData가 전달되지 않으면 seed를 이용해 Mock 데이터 생성
  const data = propData || (() => {
    const base = [12, 19, 3, 5, 2, 8, 14, 6, 17, 4];
    return ["Jan", "Feb", "Mar", "Apr", "May"].map((label, i) => ({
      label,
      // seed 오프셋으로 각 이미지카드마다 다른 패턴을 보여줌
      value: base[(i + seed) % base.length],
    }));
  })();

  // 최대값 기준으로 상대적 높이를 계산 (최소 1로 나누기 0 방지)
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: 130, gap: 10, padding: "4px 0 20px" }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
          <span style={{ color: "#9ca3af", fontSize: 10 }}>{d.value}</span>
          {/* 막대 높이를 최대값 대비 비율로 설정, cubic-bezier로 탄성 애니메이션 */}
          <div style={{
            height: `${(d.value / max) * 90}px`,
            background: "linear-gradient(180deg, #4ade80, #22c55e)",
            borderRadius: "5px 5px 0 0", width: "100%",
            transition: "height 0.6s cubic-bezier(0.34,1.56,0.64,1)",
          }} />
          <span style={{ color: "#9ca3af", fontSize: 10 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
