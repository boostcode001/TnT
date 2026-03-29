import RankBadge from './RankBadge';

export default function BestCard({ item }) {
  if (!item) return null;
  const { rank, score, ctr, imageUrl, title, timestamp } = item;

  return (
    <div className="bg-gray-900 border-2 border-yellow-500/40 rounded-2xl overflow-hidden">
      {/* 썸네일 영역 */}
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="w-full aspect-video object-cover" />
      ) : (
        <div className="w-full aspect-video bg-gray-700 flex items-center justify-center text-gray-500 text-sm">
          미리보기 없음
        </div>
      )}

      {/* 정보 영역 */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <RankBadge rank={rank} />
          <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">Best Thumbnail</span>
        </div>

        <p className="text-gray-100 text-base font-semibold leading-snug">{title}</p>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>🎯 적합도 <span className="text-white font-bold">{score}</span></span>
          <span>📈 예상 CTR <span className="text-white font-bold">{ctr}%</span></span>
          <span>⏱ {timestamp}</span>
        </div>

        {/* TODO: PNG 다운로드 API 연동 */}
        <button
          disabled
          className="mt-1 w-full py-2 rounded-xl text-sm font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 cursor-not-allowed"
        >
          PNG 다운로드 (준비 중)
        </button>
      </div>
    </div>
  );
}
