import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, X } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const EMPTY = { username: '', password: '', confirm: '' };

export default function LoginModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('login');
  const [fields, setFields] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { login, register } = useAuthStore();

  const set = (key) => (e) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setFields(EMPTY);
    setErrors({});
    setShowPw(false);
    setShowConfirm(false);
  };

  // ── 유효성 검사 ────────────────────────────────
  const validateLogin = () => {
    const e = {};
    if (!fields.username.trim()) e.username = '아이디를 입력해주세요.';
    if (!fields.password) e.password = '비밀번호를 입력해주세요.';
    return e;
  };

  const validateRegister = () => {
    const e = {};
    if (fields.username.trim().length < 3) e.username = '아이디는 3자 이상이어야 합니다.';
    if (fields.password.length < 4) e.password = '비밀번호는 4자 이상이어야 합니다.';
    if (fields.password !== fields.confirm) e.confirm = '비밀번호가 일치하지 않습니다.';
    return e;
  };

  // ── 제출 핸들러 ────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = activeTab === 'login' ? validateLogin() : validateRegister();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setApiError('');
    setLoading(true);
    let result;
    if (activeTab === 'login') {
      result = await login(fields.username, fields.password);
    } else {
      result = await register(fields.username, fields.password);
    }
    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setApiError(result.message);
    }
  };

  // ── 렌더 ───────────────────────────────────────
  return createPortal(
    <div
      className={[
        'fixed inset-0 z-[9999] flex items-center justify-center bg-black/60',
        'transition-opacity duration-200',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      ].join(' ')}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={[
          'relative w-full max-w-[420px] bg-[#2a2720] rounded-2xl p-8 shadow-2xl mx-4',
          'transition-all duration-200',
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        ].join(' ')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#a89880] hover:text-[#e8e0cc] transition-colors"
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        {/* 탭 */}
        <div className="flex gap-1 mb-6 p-1 bg-[#211f1a] rounded-xl">
          {['login', 'register'].map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={[
                'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                activeTab === tab
                  ? 'bg-[#b5832a] text-[#f0ead8]'
                  : 'bg-[#35312a] text-[#a89880] hover:text-[#d4cab4]',
              ].join(' ')}
            >
              {tab === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {activeTab === 'login' ? (
            <>
              <Field label="아이디" error={errors.username}>
                <input
                  type="text"
                  value={fields.username}
                  onChange={set('username')}
                  placeholder="username"
                  className={inputCls(errors.username)}
                />
              </Field>

              <Field label="비밀번호" error={errors.password}>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={fields.password}
                    onChange={set('password')}
                    placeholder="••••••••"
                    className={inputCls(errors.password) + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89880] hover:text-[#e8e0cc]"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              {apiError && <p className="text-xs text-red-400">{apiError}</p>}

              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? '처리 중...' : '로그인하기'}
              </button>

              <p className="text-center text-xs text-[#7a6e5e]">
                <button
                  type="button"
                  className="text-[#d4a843] hover:text-[#e0bc6a] transition-colors"
                  onClick={() => console.log('[TODO] 비밀번호 찾기')}
                >
                  비밀번호를 잊으셨나요?
                </button>
              </p>
            </>
          ) : (
            <>
              <Field label="아이디" error={errors.username}>
                <input
                  type="text"
                  value={fields.username}
                  onChange={set('username')}
                  placeholder="3자 이상"
                  className={inputCls(errors.username)}
                />
              </Field>

              <Field label="비밀번호" error={errors.password}>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={fields.password}
                    onChange={set('password')}
                    placeholder="••••••••"
                    className={inputCls(errors.password) + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89880] hover:text-[#e8e0cc]"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              <Field label="비밀번호 확인" error={errors.confirm}>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={fields.confirm}
                    onChange={set('confirm')}
                    placeholder="••••••••"
                    className={inputCls(errors.confirm) + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89880] hover:text-[#e8e0cc]"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              {apiError && <p className="text-xs text-red-400">{apiError}</p>}

              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? '처리 중...' : '회원가입하기'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── 헬퍼 컴포넌트 / 스타일 ──────────────────────────

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[#a89880]">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputCls = (hasError) =>
  [
    'w-full bg-[#211f1a] rounded-lg px-3 py-2.5 text-sm text-[#f0ead8]',
    'outline-none transition-colors',
    hasError
      ? 'border border-red-500 focus:border-red-400'
      : 'border border-[#3a3630] focus:border-[#b5832a]',
  ].join(' ');

const btnCls =
  'w-full bg-[#b5832a] hover:bg-[#c99235] active:bg-[#9a6e22] text-[#f0ead8] font-semibold py-2.5 rounded-xl transition-colors text-sm mt-1';
