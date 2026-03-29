import { create } from 'zustand';
import { authAPI } from '../api/auth';

async function handleGuestClaim() {
  const guestJobRaw = localStorage.getItem('guest_job');
  if (!guestJobRaw) return;
  try {
    const guestJob = JSON.parse(guestJobRaw);
    const { claimAnalysisAPI } = await import('../api/index');
    const claimRes = await claimAnalysisAPI(guestJob.job_id, guestJob.project_name);
    localStorage.removeItem('guest_job');
    sessionStorage.setItem('claim_done', 'true');

    const { default: useProjectStore } = await import('./useProjectStore');
    const { addProject, removeProject } = useProjectStore.getState();

    removeProject(`guest-${guestJob.job_id}`);
    addProject({
      id: claimRes.data.project_id,
      name: guestJob.project_name,
      thumbnail_count: 0,
      created_at: new Date().toISOString().slice(0, 10),
      last_job_id: guestJob.job_id,
      status: 'analyzing',
    });
  } catch {
    localStorage.removeItem('guest_job');
  }
}

const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  isRestoring: true,

  login: async (username, password) => {
    try {
      const res = await authAPI.login(username, password);
      const { access_token } = res.data;
      localStorage.setItem('access_token', access_token);
      // 토큰 저장 후 /auth/me로 유저 정보 가져오기
      const meRes = await authAPI.me();
      set({ user: meRes.data, isLoggedIn: true });
      await handleGuestClaim();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail ?? '로그인에 실패했습니다.';
      return { success: false, message };
    }
  },

  register: async (username, password) => {
    try {
      const res = await authAPI.register(username, password);
      const { access_token } = res.data;
      localStorage.setItem('access_token', access_token);
      const meRes = await authAPI.me();
      set({ user: meRes.data, isLoggedIn: true });
      await handleGuestClaim();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail ?? '회원가입에 실패했습니다.';
      return { success: false, message };
    }
  },

  logout: () => {
    authAPI.logout().catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('notify_on_complete');
    localStorage.removeItem('guest_job');
    sessionStorage.removeItem('claim_done');
    set({ user: null, isLoggedIn: false });

    // 프로젝트 스토어 초기화
    import('./useProjectStore').then(({ default: useProjectStore }) => {
      useProjectStore.getState().clearProjects();
    });
  },

  restoreFromToken: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isRestoring: false });
      return;
    }
    try {
      const res = await authAPI.me();
      set({ user: res.data, isLoggedIn: true, isRestoring: false });
    } catch {
      localStorage.removeItem('access_token');
      set({ isRestoring: false });
    }
  },
  devLogin: () => set({ user: { id: 'dev-001', username: '개발자' }, isLoggedIn: true }),
}));

export default useAuthStore;
