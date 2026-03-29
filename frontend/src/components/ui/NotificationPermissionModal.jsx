import { useEffect, useState } from 'react';

// phase: 'ask' | 'granting' | 'granted' | 'denied'

export default function NotificationPermissionModal({ isOpen, onClose }) {
  const [phase, setPhase] = useState('ask');

  // 모달 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) setPhase('ask');
  }, [isOpen]);

  const handleAllow = async () => {
    setPhase('granting');
    const result = await Notification.requestPermission();

    if (result === 'granted') {
      localStorage.setItem('notification_asked', 'granted');
      setPhase('granted');
      setTimeout(onClose, 800);
    } else {
      localStorage.setItem('notification_asked', 'denied');
      setPhase('denied');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification_asked', 'dismissed');
    onClose();
  };

  return (
    <div
      className={[
        'fixed inset-0 z-[9999] flex items-center justify-center bg-black/60',
        'transition-opacity duration-200',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      ].join(' ')}
      onClick={phase === 'ask' ? handleDismiss : undefined}
    >
      <div
        className={[
          'relative w-full max-w-sm bg-gray-800 rounded-2xl p-8 shadow-2xl mx-4 text-center',
          'transition-all duration-200',
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {phase === 'granted' ? (
          /* 허용 완료 피드백 */
          <div className="flex flex-col items-center gap-3 py-2">
            <span className="text-4xl">✅</span>
            <p className="text-base font-semibold text-gray-100">허용됨!</p>
            <p className="text-sm text-gray-400">분석 완료 시 알림을 보내드릴게요.</p>
          </div>
        ) : phase === 'denied' ? (
          /* 거부 안내 */
          <div className="flex flex-col items-center gap-4">
            <span className="text-4xl">🔕</span>
            <p className="text-base font-semibold text-gray-100">알림이 차단되었어요</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              브라우저 설정에서 알림을 허용할 수 있어요.
              <br />
              <span className="text-gray-500">
                주소창 왼쪽 자물쇠 아이콘 → 사이트 설정 → 알림 허용
              </span>
            </p>
            <button onClick={onClose} className={btnPrimary}>확인</button>
          </div>
        ) : (
          /* 기본 질문 */
          <div className="flex flex-col items-center gap-4">
            <span className="text-4xl">🔔</span>
            <p className="text-base font-semibold text-gray-100">알림을 허용하시겠어요?</p>
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
              {"썸네일 분석이 완료되면 브라우저 알림으로 바로 알려드려요.\n업로드 후 다른 탭으로 이동해도 결과를 놓치지 않을 수 있어요."}
            </p>
            <div className="flex flex-col gap-2 w-full mt-1">
              <button
                onClick={handleAllow}
                disabled={phase === 'granting'}
                className={btnPrimary}
              >
                {phase === 'granting' ? '요청 중...' : '허용하기'}
              </button>
              <button onClick={handleDismiss} className={btnGhost}>
                나중에
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnPrimary =
  'w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white transition-colors';
const btnGhost =
  'w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors';
