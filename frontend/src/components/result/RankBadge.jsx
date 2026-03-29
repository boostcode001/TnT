export default function RankBadge({ rank }) {
  const cfg =
    rank === 1 ? 'bg-yellow-500 text-yellow-950' :
    rank === 2 ? 'bg-gray-300  text-gray-800'    :
    rank === 3 ? 'bg-orange-400 text-orange-950'  :
                 'bg-gray-700  text-gray-300';
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${cfg}`}>
      {rank}
    </span>
  );
}