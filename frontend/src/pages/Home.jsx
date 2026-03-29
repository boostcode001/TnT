// 홈 페이지 — 영상 업로드 및 분석 시작 화면
// guestUsed가 true이면 업로드 UI 대신 "체험 완료" 안내 화면 표시
import { useState } from "react";
import { Send, LogIn } from "lucide-react";

export default function Home({ userName = "USER", onSubmit, guestUsed = false }) {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  // 드래그 앤 드롭 영역 활성화 여부
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    // 영상 파일이 아니면 무시
    if (!file || !file.type.startsWith("video/")) return;
    setVideoFile(file);
    // 미리보기용 임시 URL 생성 (컴포넌트 언마운트 시 자동 해제됨)
    setVideoUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex-1 flex flex-col items-center overflow-y-auto bg-[#131314] pb-15">
      {/* 환영 헤더 */}
      <div className="flex flex-col items-center gap-2 pt-18 px-5 pb-12 text-center">
        <div className="flex items-center gap-2.5 mb-1">
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none" className="shrink-0 mt-0.5">
            <path d="M18 2 L20.5 13 L31 10 L23 18 L31 26 L20.5 23 L18 34 L15.5 23 L5 26 L13 18 L5 10 L15.5 13 Z" fill="url(#sg)" />
            <defs><linearGradient id="sg" x1="0" y1="0" x2="36" y2="36"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs>
          </svg>
          <h1 className="text-[32px] font-bold text-gray-100 tracking-tight leading-tight">
            {userName}님 안녕하세요
          </h1>
        </div>
        <p className="text-[15px] text-gray-500 leading-relaxed">
          TnT project의 대시보드에 오신걸 환영합니다.
        </p>
      </div>

      <div className="w-full max-w-[680px] px-5 flex flex-col gap-4">
        {/* 비로그인 체험 1회 완료 후: 로그인 유도 화면 */}
        {guestUsed ? (
          <div className="flex flex-col items-center gap-5 py-16 px-6 rounded-[20px] border border-zinc-800 bg-[#1a1a1b]">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <LogIn size={28} className="text-blue-400" />
            </div>
            <div className="text-center flex flex-col gap-2">
              <p className="text-gray-200 text-[17px] font-semibold">체험이 완료되었습니다</p>
              <p className="text-gray-500 text-[13px] leading-relaxed">
                로그인하면 작품을 저장하고 관리할 수 있습니다.<br />
                새로고침하면 다시 체험할 수 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 영상 선택 후: 미리보기 + 영상 교체 버튼 */}
            {videoUrl ? (
              <div className="rounded-[20px] overflow-hidden border border-zinc-800">
                <video src={videoUrl} controls className="w-full block bg-black" />
                <div className="bg-[#1a1a1b] py-2.5 px-4 flex items-center justify-between border-t border-zinc-800">
                  <span className="text-gray-400 text-xs">📎 {videoFile?.name}</span>
                  <button
                    onClick={() => { setVideoFile(null); setVideoUrl(null); }}
                    className="bg-transparent border border-gray-700 rounded-md text-gray-500 text-[11px] py-1 px-2.5 cursor-pointer hover:border-gray-500 hover:text-gray-400 transition-colors"
                  >
                    영상 교체
                  </button>
                </div>
              </div>
            ) : (
              // 영상 미선택: 드래그 앤 드롭 업로드 영역
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                // 드래그 중 테두리/배경색 변경으로 시각 피드백 제공
                className={`flex flex-col items-center justify-center gap-4 w-full aspect-video rounded-[20px] cursor-pointer border-2 border-dashed transition-colors relative overflow-hidden ${
                  dragging ? "border-green-400 bg-green-400/5" : "border-gray-700 bg-[#1a1a1b] hover:border-gray-600"
                }`}
              >
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
                <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center relative z-10">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round"/>
                    <polyline points="17 8 12 3 7 8" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="3" x2="12" y2="15" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="text-center relative z-10 flex flex-col gap-1.5">
                  <span className="text-gray-200 text-[15px] font-semibold">소개 영상을 업로드해주세요</span>
                  <span className="text-gray-500 text-[13px]">클릭하거나 영상 파일을 여기로 드래그하세요</span>
                  <span className="text-gray-600 text-xs">MP4, MOV, AVI, WEBM 등 지원</span>
                </div>
              </label>
            )}

            {/* 영상 선택 완료 시 전송 버튼 표시 */}
            {videoUrl && (
              <button
                onClick={() => onSubmit && onSubmit(videoFile)}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl w-full bg-gradient-to-br from-green-400 to-blue-500 border-none text-[#0a1a0a] text-[15px] font-bold cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px"
                style={{ animation: "fadeIn 0.3s ease" }}
              >
                <Send size={18} /> 전송
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
