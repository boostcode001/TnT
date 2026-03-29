import RankBadge from './RankBadge';

export default function ThumbnailCard({ thumbnail }) {
  if (!thumbnail) return null;
  const { rank, score, ctr, imageUrl, title, timestamp } = thumbnail;

  return (
    <div className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl overflow-hidden transition-colors">
      {/* 썸네일 영역 */}
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="w-full aspect-video object-cover" />
      ) : (
        <div className="w-full aspect-video bg-gray-700 flex items-center justify-center text-gray-500 text-sm">
          미리보기 없음
        </div>
      )}

      {/* 정보 영역 */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <RankBadge rank={rank} />
          <p className="text-sm text-gray-200 font-medium truncate flex-1">{title}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>적합도 <span className="text-gray-300 font-semibold">{score}</span></span>
          <span>CTR <span className="text-gray-300 font-semibold">{ctr}%</span></span>
          <span className="ml-auto">{timestamp}</span>
        </div>

        {/* TODO: PNG 다운로드 API 연동 */}
        <button
          disabled
          className="w-full py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-500 cursor-not-allowed mt-1"
        >
          다운로드
        </button>
      </div>
    </div>
  );
}
