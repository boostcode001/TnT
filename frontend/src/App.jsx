import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RouterProvider } from 'react-router-dom';
import router from './router/index';
import useAuthStore from './store/useAuthStore';
import LoginModal from './components/ui/LoginModal';

export default function App() {
  const isRestoring      = useAuthStore((s) => s.isRestoring);
  const restoreFromToken = useAuthStore((s) => s.restoreFromToken);
  const isLoggedIn       = useAuthStore((s) => s.isLoggedIn);

  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    restoreFromToken();
  }, []);

  useEffect(() => {
    const handler = () => setShowSessionModal(true);
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

  useEffect(() => {
    if (isLoggedIn) setShowSessionModal(false);
  }, [isLoggedIn]);

  // 복원 완료 전: 스피너 (깜빡임 방지)
  if (isRestoring) {
    return (
      <div className="min-h-screen bg-[#1a1814] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#b5832a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />

      {showSessionModal && createPortal(
        <>
          {/* 세션 만료 토스트 배너 */}
          <div
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] bg-[#2a2720] border border-[#b5832a]/60 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3"
            style={{ animation: 'fadeIn 0.2s ease' }}
          >
            <span className="text-xl">⏰</span>
            <div>
              <p className="text-[#f0ead8] text-sm font-semibold">세션이 만료되었습니다</p>
              <p className="text-[#a89880] text-xs">다시 로그인해주세요</p>
            </div>
          </div>

          {/* 로그인 모달 */}
          <LoginModal
            isOpen={true}
            onClose={() => setShowSessionModal(false)}
          />
        </>,
        document.body
      )}
    </>
  );
}
