import { useRef, useState } from 'react';

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

function validate(file) {
  if (!ALLOWED_TYPES.includes(file.type))
    return '지원하지 않는 파일 형식입니다. (MP4 · MOV · AVI만 가능)';
  if (file.size > MAX_BYTES)
    return `파일 크기가 너무 큽니다. (최대 500MB, 현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
  return null;
}

export default function DropZone({ onFileSelect }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (file) => {
    if (!file) return;
    const err = validate(file);
    if (err) { setError(err); return; }
    setError('');
    onFileSelect(file);
  };

  // ── 드래그 핸들러 ──────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragEnter = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = (e) => {
    // 자식 요소로 이동할 때는 무시
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          'border-2 border-dashed rounded-2xl min-h-64',
          'flex flex-col items-center justify-center gap-4',
          'transition-colors duration-150 cursor-default select-none',
          dragging
            ? 'border-[#e0bc6a] bg-[#3d2a0a]/40'
            : 'border-[#d4a843] bg-[#2a1f0a]/30',
        ].join(' ')}
      >
        <span className="text-5xl">☁️</span>

        <div className="text-center flex flex-col gap-1">
          <p className="text-[#e8e0cc] text-base font-medium">
            {dragging ? '여기에 파일을 놓으세요' : '영상 파일을 드래그하거나 선택하세요'}
          </p>
          <p className="text-[#7a6e5e] text-sm">MP4 · MOV · AVI (최대 500MB)</p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="bg-[#b5832a] hover:bg-[#c99235] active:bg-[#9a6e22] text-[#f0ead8] text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          파일 선택하기
        </button>

        {/* 숨겨진 파일 input */}
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm flex items-center gap-1.5">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
