import { useEffect, useState } from 'react';
import DropZone from '../components/upload/DropZone';
import VideoPreview from '../components/upload/VideoPreview';
import NotificationPermissionModal from '../components/ui/NotificationPermissionModal';
import LoginModal from '../components/ui/LoginModal';
import useAuthStore from '../store/useAuthStore';

export default function UploadPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 최초 1회만 알림 허용 여부 질문
  useEffect(() => {
    const asked = localStorage.getItem('notification_asked');
    if (!asked) setShowNotifModal(true);
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#f0ead8] mb-1">
          새 프로젝트 — 영상 업로드
        </h1>
        <p className="text-sm text-[#a89880]">
          유튜브 영상을 업로드하면 AI가 최적 썸네일을 생성합니다
        </p>
      </div>

      {/* 비로그인 안내 배너 */}
      {!isLoggedIn && (
        <div className="bg-[#2a1f0a] border border-[#b5832a]/40 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0">💾</span>
            <div>
              <p className="text-[#e8e0cc] text-sm font-semibold">
                로그인하면 분석 결과를 저장할 수 있어요
              </p>
              <p className="text-[#7a6e5e] text-xs mt-0.5">
                생성된 썸네일과 제목을 언제든지 다시 확인할 수 있습니다
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-[#b5832a] hover:bg-[#c99235] text-[#1a1814] text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              로그인하기
            </button>
          </div>
        </div>
      )}

      {selectedFile ? (
        <VideoPreview
          file={selectedFile}
          onReset={() => setSelectedFile(null)}
        />
      ) : (
        <DropZone onFileSelect={setSelectedFile} />
      )}

      <NotificationPermissionModal
        isOpen={showNotifModal}
        onClose={() => setShowNotifModal(false)}
      />

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
