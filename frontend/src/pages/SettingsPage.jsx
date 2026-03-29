import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { authAPI } from '../api/auth';

// ── 공통 섹션 래퍼 ─────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-[#2a2720]/50 rounded-2xl p-6 mb-4">
      <h2 className="text-sm font-semibold text-[#a89880] uppercase tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── 토글 스위치 ────────────────────────────────────────────
function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-[#e8e0cc]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0',
          checked ? 'bg-[#b5832a]' : 'bg-[#45403a]',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </label>
  );
}

// ── SettingsPage ───────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // 계정 정보 편집
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    // TODO: PATCH /api/users/me API 연동
    console.log('[TODO] 계정 정보 저장');
    setEditing(false);
  };

  // 푸시 알림 — Notification.permission이 source of truth
  const [notifyPush, setNotifyPush] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [pushMessage, setPushMessage] = useState('');

  const handlePushToggle = async (next) => {
    if (!next) {
      localStorage.removeItem('notification_asked');
      setNotifyPush(false);
      setPushMessage('완전히 끄려면 브라우저 사이트 설정에서 변경해주세요.');
      return;
    }

    const perm = typeof Notification !== 'undefined' ? Notification.permission : 'denied';

    if (perm === 'granted') {
      setNotifyPush(true);
      setPushMessage('');
    } else if (perm === 'default') {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        localStorage.setItem('notification_asked', 'granted');
        setNotifyPush(true);
        setPushMessage('');
      } else {
        localStorage.setItem('notification_asked', 'denied');
        setNotifyPush(false);
        setPushMessage('알림 권한이 거부되었습니다. 브라우저 설정에서 직접 허용해주세요.');
      }
    } else {
      // 'denied' — JS로 권한 요청 불가
      setNotifyPush(false);
      setPushMessage('브라우저 설정에서 직접 허용해주세요.');
    }
  };

  // 시작 화면 건너뛰기
  const [skipLanding, setSkipLanding] = useState(
    () => localStorage.getItem('skip_landing') === 'true'
  );

  const handleSkipToggle = (next) => {
    if (next) {
      localStorage.setItem('skip_landing', 'true');
    } else {
      localStorage.removeItem('skip_landing');
    }
    setSkipLanding(next);
  };

  // 계정 탈퇴
  const handleWithdraw = async () => {
    if (window.confirm('정말 계정을 탈퇴하시겠습니까?\n모든 프로젝트와 분석 결과가 영구 삭제됩니다.')) {
      try {
        await authAPI.withdraw();
      } catch {
        // 실패해도 로컬 정리는 진행
      } finally {
        localStorage.removeItem('access_token');
        localStorage.removeItem('guest_job');
        localStorage.removeItem('notify_on_complete');
        logout();
        navigate('/');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-[#f0ead8] mb-6">설정</h1>

      {/* 섹션 1 — 계정 정보 */}
      <Section title="계정 정보">
        <div className="flex flex-col gap-3">
          <InfoRow label="아이디" value={user?.username ?? '—'} />
          {editing ? (
            <div className="flex gap-2 mt-1">
              <button onClick={handleSave} className={btnPrimary}>저장</button>
              <button onClick={() => setEditing(false)} className={btnGhost}>취소</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className={`${btnGhost} self-start mt-1`}>
              편집
            </button>
          )}
        </div>
      </Section>

      {/* 섹션 2 — 알림 설정 */}
      <Section title="알림 설정">
        <div className="flex flex-col gap-3">
          {/* 알림 필요 이유 설명 카드 */}
          <div className="bg-[#211f1a] border border-[#3a3630] rounded-xl p-4 mb-3 flex gap-3">
            <span className="text-lg shrink-0">🔔</span>
            <p className="text-[12px] text-[#a89880] leading-relaxed">
              영상 분석은 평균 30~60초 소요됩니다. 알림을 켜두면 분석이 완료됐을 때
              다른 탭에서 작업 중이어도 즉시 알림을 받을 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Toggle
              label="브라우저 푸시 알림 허용"
              checked={notifyPush}
              onChange={
                typeof Notification !== 'undefined' && Notification.permission === 'denied'
                  ? () => setPushMessage('브라우저 설정에서 직접 허용해주세요.')
                  : handlePushToggle
              }
            />
            {pushMessage && (
              <p className="text-xs text-yellow-400 pl-0.5">{pushMessage}</p>
            )}
          </div>
        </div>
      </Section>

      {/* 섹션 3 — 시작 화면 */}
      <Section title="시작 화면">
        <div className="flex flex-col gap-1.5">
          <Toggle
            label="접속 시 시작 화면 건너뛰기"
            checked={skipLanding}
            onChange={handleSkipToggle}
          />
          <p className="text-xs text-[#7a6e5e]">
            켜면 다음 접속부터 시작 화면 없이 바로 대시보드로 이동합니다
          </p>
        </div>
      </Section>

      {/* 섹션 4 — 테마 */}
      <Section title="테마">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[#c99235] ring-2 ring-[#d4a843] ring-offset-2 ring-offset-[#2a2720]" />
            <span className="text-sm text-[#e8e0cc]">다크 모드 (현재)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled
              className="flex items-center gap-3 text-sm text-[#5a5048] cursor-not-allowed"
            >
              <div className="w-4 h-4 rounded-full bg-[#45403a]" />
              라이트 모드 (준비 중)
            </button>
          </div>
          <p className="text-xs text-[#7a6e5e] mt-1">
            라이트 모드는 추후 업데이트 예정입니다.
          </p>
        </div>
      </Section>

      {/* 섹션 5 — 계정 관리 */}
      <Section title="계정 관리">
        <div className="flex gap-3">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className={btnGhost}
          >
            로그아웃
          </button>
          <button
            onClick={handleWithdraw}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            계정 탈퇴
          </button>
        </div>
      </Section>
    </div>
  );
}

// ── 헬퍼 ───────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-[#7a6e5e] w-14 shrink-0">{label}</span>
      <span className="text-sm text-[#e8e0cc]">{value}</span>
    </div>
  );
}

const btnPrimary =
  'px-4 py-2 rounded-lg text-sm font-medium bg-[#b5832a] hover:bg-[#c99235] text-[#f0ead8] transition-colors';
const btnGhost =
  'px-4 py-2 rounded-lg text-sm font-medium bg-[#35312a] hover:bg-[#45403a] text-[#e8e0cc] transition-colors';
