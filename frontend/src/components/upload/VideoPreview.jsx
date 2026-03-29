import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProjectAPI, startAnalysisAPI, guestStartAnalysisAPI } from '../../api/index';
import useProjectStore from '../../store/useProjectStore';
import useAuthStore from '../../store/useAuthStore';

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB

function toMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(1);
}

export default function VideoPreview({ file, onReset }) {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [notifyEnabled, setNotifyEnabled] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [notifyDeniedMsg, setNotifyDeniedMsg] = useState(false);
  const addProject = useProjectStore((s) => s.addProject);
  const startPolling = useProjectStore((s) => s.startPolling);
  const customPrompt = useProjectStore((s) => s.customPrompt);
  const setCustomPrompt = useProjectStore((s) => s.setCustomPrompt);
  const clearCustomPrompt = useProjectStore((s) => s.clearCustomPrompt);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [draftPrompt, setDraftPrompt] = useState(customPrompt);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const PRESETS = [
    '🎨 밝은 색감', '👤 인물 중심', '📝 텍스트 강조',
    '🌙 다크톤', '⚡ 강렬한 대비', '🎬 영화적 구도',
  ];

  const appendPreset = (tag) => {
    setDraftPrompt((prev) => {
      if (prev.includes(tag)) return prev;
      return prev ? `${prev}, ${tag}` : tag;
    });
  };

  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const overSize = file.size > MAX_BYTES;

  const handleToggle = async (next) => {
    if (!next) {
      setNotifyEnabled(false);
      setNotifyDeniedMsg(false);
      return;
    }

    const perm = typeof Notification !== 'undefined' ? Notification.permission : 'denied';

    if (perm === 'granted') {
      setNotifyEnabled(true);
      setNotifyDeniedMsg(false);
    } else if (perm === 'default') {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        setNotifyEnabled(true);
        setNotifyDeniedMsg(false);
      } else {
        setNotifyEnabled(false);
        setNotifyDeniedMsg(true);
      }
    } else {
      // 'denied' — JS로 권한 요청 불가
      setNotifyEnabled(false);
      setNotifyDeniedMsg(true);
    }
  };

  const handleAnalyze = async () => {
    if (overSize) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadError('');
    try {
      const projectName = file.name.replace(/\.[^.]+$/, '');

      if (isLoggedIn) {
        // 로그인: 기존 흐름
        const projectRes = await createProjectAPI(projectName);
        const projectId = projectRes.data.id;
        const analysisRes = await startAnalysisAPI(projectId, file, setUploadProgress);
        const jobId = analysisRes.data.job_id;

        addProject({
          id: projectId,
          name: projectName,
          thumbnail_count: 0,
          created_at: new Date().toISOString().slice(0, 10),
          last_job_id: jobId,
        });
        localStorage.setItem('notify_on_complete', notifyEnabled ? 'true' : 'false');
        startPolling(projectId, jobId);
        navigate(`/result/${projectId}`);
      } else {
        // 비로그인: guest 엔드포인트 사용
        const analysisRes = await guestStartAnalysisAPI(file);
        const jobId = analysisRes.data.job_id;

        localStorage.setItem('guest_job', JSON.stringify({
          job_id: jobId,
          project_name: projectName,
          created_at: new Date().toISOString(),
        }));

        const tempId = `guest-${jobId}`;
        addProject({
          id: tempId,
          name: projectName,
          thumbnail_count: 0,
          created_at: new Date().toISOString().slice(0, 10),
          last_job_id: jobId,
        });
        navigate(`/result/${tempId}`);
      }
    } catch {
      setUploadError('업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* 좌측: 비디오 플레이어 */}
        <div className="rounded-xl overflow-hidden bg-black">
          <video
            src={objectUrl}
            controls
            className="w-full max-h-72 object-contain"
          />
        </div>

        {/* 우측: 파일 정보 + 액션 */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-[#7a6e5e] mb-1">파일명</p>
              <p className="text-sm text-[#e8e0cc] font-medium break-all leading-relaxed">
                {file.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7a6e5e] mb-1">파일 크기</p>
              <p className={`text-sm font-medium ${overSize ? 'text-red-400' : 'text-[#e8e0cc]'}`}>
                {toMB(file.size)} MB
                {overSize && (
                  <span className="ml-2 text-xs font-normal">
                    ⚠️ 500MB를 초과합니다
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            {/* 알림 토글 배너 */}
            <div className="bg-[#2a1f0a] border border-[#b5832a]/40 rounded-xl p-4 mb-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-base shrink-0">🔔</span>
                  <div>
                    <p className="text-[#e8e0cc] text-sm font-medium">분석 완료 알림</p>
                    <p className="text-[#7a6e5e] text-xs mt-0.5">분석이 끝나면 브라우저 알림으로 알려드립니다</p>
                  </div>
                </div>
                {/* 토글 스위치 */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifyEnabled}
                  onClick={() => handleToggle(!notifyEnabled)}
                  className={[
                    'relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0',
                    notifyEnabled ? 'bg-[#b5832a]' : 'bg-[#3a3630]',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                      notifyEnabled ? 'translate-x-5' : 'translate-x-0',
                    ].join(' ')}
                  />
                </button>
              </div>
              {notifyDeniedMsg && (
                <p className="text-[#d4a843] text-[11px] mt-1 pl-8">브라우저 설정에서 알림을 허용해주세요</p>
              )}
            </div>

            {/* 사용자 지정 프롬프트 패널 */}
            <div className="border border-[#3a3630] rounded-xl overflow-hidden mb-2">
              <button
                type="button"
                onClick={() => setIsCustomOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#211f1a] hover:bg-[#2a2720] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#d4a843] text-sm">✦</span>
                  <span className="text-[#e8e0cc] text-sm font-medium">사용자 지정 프롬프트</span>
                  {customPrompt && (
                    <span className="text-[11px] text-[#b5832a] bg-[#b5832a]/10 px-2 py-0.5 rounded-full">적용됨</span>
                  )}
                </div>
                <span className="text-[#7a6e5e] text-xs">{isCustomOpen ? '▲' : '▼'}</span>
              </button>

              {isCustomOpen && (
                <div className="flex flex-col gap-2.5 px-4 py-3 bg-[#1a1814]">
                  <p className="text-[11px] text-[#7a6e5e] leading-relaxed">
                    썸네일 AI 제목 생성 시 반영할 스타일이나 조건을 입력하세요
                  </p>
                  <textarea
                    rows={3}
                    value={draftPrompt}
                    onChange={(e) => setDraftPrompt(e.target.value)}
                    placeholder="예: 밝고 강렬한 색감, 인물 중심, 한국어 텍스트 포함"
                    className="bg-[#211f1a] border border-[#3a3630] focus:border-[#b5832a] rounded-lg px-3 py-2 text-xs text-[#e8e0cc] resize-none w-full outline-none transition-colors"
                  />
                  <div className="flex flex-wrap gap-1">
                    {PRESETS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => appendPreset(tag)}
                        className="text-[11px] px-2 py-1 rounded-md border border-[#3a3630] text-[#a89880] hover:border-[#b5832a] hover:text-[#d4a843] transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => { clearCustomPrompt(); setDraftPrompt(''); }}
                      className="text-xs text-[#5a5048] hover:text-[#a89880] transition-colors"
                    >
                      초기화
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCustomPrompt(draftPrompt); setIsCustomOpen(false); }}
                      className="bg-[#b5832a] hover:bg-[#c99235] text-[#f0ead8] text-xs rounded-lg px-3 py-1.5 transition-colors"
                    >
                      {customPrompt === draftPrompt && customPrompt ? '✓ 적용됨' : '적용'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={overSize || uploading}
              className={[
                'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors',
                overSize || uploading
                  ? 'bg-[#35312a] text-[#7a6e5e] cursor-not-allowed'
                  : 'bg-[#b5832a] hover:bg-[#c99235] active:bg-[#9a6e22] text-[#f0ead8]',
              ].join(' ')}
            >
              {uploading ? '분석 중...' : '분석 시작하기 🚀'}
            </button>

            {/* 업로드 진행률 바 */}
            {uploading && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-[#a89880]">
                  <span>{uploadProgress >= 100 ? '서버 처리 중...' : '업로드 중...'}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#2e2b24] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#b5832a] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onReset}
              className="text-sm text-[#7a6e5e] hover:text-[#d4cab4] transition-colors py-1"
            >
              다른 파일 선택
            </button>
          </div>
        </div>
      </div>

      {overSize && (
        <p className="text-red-400 text-sm flex items-center gap-1.5">
          <span>⚠️</span> 파일 크기가 500MB를 초과합니다. 다른 파일을 선택해주세요.
        </p>
      )}
      {uploadError && (
        <p className="text-red-400 text-sm flex items-center gap-1.5">
          <span>⚠️</span> {uploadError}
        </p>
      )}
    </div>
  );
}
