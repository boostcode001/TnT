import { create } from 'zustand';
import { projectsAPI } from '../api/projects';
import { getJobStatusAPI, getJobResultAPI } from '../api/index';

const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,
  loading: false,
  customPrompt: '',
  activePolls: {},
  setCustomPrompt: (prompt) => set({ customPrompt: prompt }),
  clearCustomPrompt: () => set({ customPrompt: '' }),

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const res = await projectsAPI.getAll();
      set({ projects: res.data, loading: false });
    } catch {
      set({ projects: [], loading: false });
    }
  },

  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),

  removeProject: (id) =>
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

  setCurrentProject: (project) => set({ currentProject: project }),

  toggleFavorite: (id) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, favorite: !p.favorite } : p
      ),
    })),

  renameProject: (id, name) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, name } : p
      ),
    })),

  clearProjects: () => set({ projects: [], currentProject: null }),

  clearGuestProjects: () =>
    set((state) => ({
      projects: state.projects.filter((p) => !p.id.startsWith('guest-')),
    })),

  startPolling: (projectId, jobId) => {
    const { activePolls } = useProjectStore.getState();
    if (activePolls[projectId]) return;

    useProjectStore.setState((s) => ({
      activePolls: { ...s.activePolls, [projectId]: true },
    }));

    let pollCount = 0;
    let isFirstPoll = true;
    const MAX_POLL = 60;

    const poll = async () => {
      while (pollCount < MAX_POLL) {
        const state = useProjectStore.getState();
        if (!state.activePolls[projectId]) return;

        try {
          const res = await getJobStatusAPI(jobId);
          const { status: s } = res.data;

          if (s === 'done') {
            const r = await getJobResultAPI(jobId);

            useProjectStore.setState((state) => ({
              projects: state.projects.map((p) =>
                p.id === projectId
                  ? { ...p, status: 'done', thumbnail_count: r.data.frame_scores?.length ?? 0 }
                  : p
              ),
              activePolls: Object.fromEntries(
                Object.entries(state.activePolls).filter(([k]) => k !== projectId)
              ),
            }));

            if (
              !isFirstPoll &&
              typeof Notification !== 'undefined' &&
              Notification.permission === 'granted' &&
              localStorage.getItem('notify_on_complete') === 'true'
            ) {
              new Notification('TnT 분석 완료 🎉', {
                body: '썸네일 분석이 완료되었습니다. 결과를 확인해보세요!',
                icon: '/favicon.svg',
              });
            }
            return;
          }

          if (s === 'failed') {
            useProjectStore.setState((state) => ({
              activePolls: Object.fromEntries(
                Object.entries(state.activePolls).filter(([k]) => k !== projectId)
              ),
            }));
            return;
          }

          isFirstPoll = false;
          pollCount++;
          await new Promise((r) => setTimeout(r, 2000));
        } catch {
          useProjectStore.setState((state) => ({
            activePolls: Object.fromEntries(
              Object.entries(state.activePolls).filter(([k]) => k !== projectId)
            ),
          }));
          return;
        }
      }
    };

    poll();
  },

  stopPolling: (projectId) =>
    set((state) => ({
      activePolls: Object.fromEntries(
        Object.entries(state.activePolls).filter(([k]) => k !== projectId)
      ),
    })),

}));

export default useProjectStore;
