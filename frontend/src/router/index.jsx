import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import LandingPage from '../pages/LandingPage';
import DashboardPage from '../pages/DashboardPage';
import UploadPage from '../pages/UploadPage';
import ResultPage from '../pages/ResultPage';
import SettingsPage from '../pages/SettingsPage';
import HelpPage from '../pages/HelpPage';
import useAuthStore from '../store/useAuthStore';

// ── PublicRoute ────────────────────────────────────────────
// 이미 로그인된 상태에서 / 접근 시 /dashboard로 바로 리다이렉트
// LandingPage 렌더 자체를 막아서 깜빡임 방지
function PublicRoute({ children }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;
  return children;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PublicRoute>
        <LandingPage />
      </PublicRoute>
    ),
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard',         element: <DashboardPage /> },
      { path: '/upload',            element: <UploadPage /> },
      { path: '/result/:projectId', element: <ResultPage /> },
      { path: '/settings',          element: <SettingsPage /> },
      { path: '/help',              element: <HelpPage /> },
    ],
  },
]);

export default router;
