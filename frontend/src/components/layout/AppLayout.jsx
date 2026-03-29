import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { EllipsisVertical, HelpCircle, Plus, Search, Share2, Star, X } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useProjectStore from '../../store/useProjectStore';
import { renameProjectAPI, deleteProjectAPI } from '../../api/index';
import LoginModal from '../ui/LoginModal';

// ── DeleteConfirmModal ──────────────────────────────────────
function DeleteConfirmModal({ project, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-[360px] mx-4 bg-[#2a2720] border border-[#3a3630] rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-[#f0ead8] mb-2">정말 삭제하시겠습니까?</h3>
        <p className="text-sm text-[#a89880] mb-5">
          '{project.name}' 프로젝트가 영구적으로 삭제됩니다.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className={btnGhost}>취소</button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
const btnGhost = 'px-4 py-2 rounded-lg text-sm font-medium bg-[#35312a] hover:bg-[#45403a] text-[#e8e0cc] transition-colors';

// ── ProjectContextMenu ──────────────────────────────────────
function ProjectContextMenu({ project, pos, onClose, onRename, onDelete, toggleFavorite }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ top: pos.y, left: pos.x }}
      className="fixed z-[9999] bg-[#2a2720] border border-[#3a3630] rounded-xl shadow-xl py-1 min-w-[160px]"
    >
      <button onClick={() => { toggleFavorite(project.id); onClose(); }} className={ctxItemCls}>
        ★ {project.favorite ? '즐겨찾기 해제' : '즐겨찾기'}
      </button>
      <button onClick={() => { onRename(project); onClose(); }} className={ctxItemCls}>
        ✏️ 이름 변경
      </button>
      <hr className="border-[#3a3630] my-1" />
      <button onClick={() => { onDelete(project); onClose(); }} className={`${ctxItemCls} text-red-400 hover:text-red-300`}>
        🗑️ 삭제
      </button>
    </div>
  );
}
const ctxItemCls = 'flex items-center gap-2 w-full px-4 py-2 text-sm text-[#e8e0cc] hover:bg-[#35312a] transition-colors text-left';

// ── AppHeader ──────────────────────────────────────────────
function AppHeader({ sidebarOpen, onShare }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isResultPage = pathname.startsWith('/result/');
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-[#211f1a] border-b border-[#2a2720] flex items-center justify-between px-6">
        <div className="flex items-center">
          <span
            onClick={() => {
              if (!isLoggedIn && isResultPage) {
                setShowLeaveWarning(true);
              } else {
                navigate('/dashboard');
              }
            }}
            className={[
              'text-[#f0ead8] font-bold text-xl tracking-tight cursor-pointer',
              'hover:text-[#d4a843] transition-all duration-300 overflow-hidden whitespace-nowrap',
              sidebarOpen ? 'w-40 opacity-100' : 'w-0 opacity-0',
            ].join(' ')}
          >
            TnT
          </span>
        </div>
        {isResultPage && (
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2720] hover:bg-[#35312a] border border-[#3a3630] hover:border-[#b5832a]/60 text-[#a89880] hover:text-[#d4a843] text-sm rounded-lg transition-all"
          >
            <Share2 size={15} />
            공유
          </button>
        )}
      </header>

      {showLeaveWarning && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowLeaveWarning(false); }}
        >
          <div
            className="relative w-full max-w-[380px] mx-4 bg-[#2a2720] border border-[#3a3630] rounded-2xl p-6 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <span className="text-4xl">⚠️</span>
              <div>
                <p className="text-[#f0ead8] font-bold text-base mb-2">
                  분석 결과가 사라집니다
                </p>
                <p className="text-[#a89880] text-sm leading-relaxed">
                  로그인하지 않으면 현재 분석 결과가<br/>
                  대시보드로 이동 시 사라집니다.<br/>
                  로그인하면 결과를 영구 저장할 수 있어요.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-1">
                <button
                  onClick={() => setShowLeaveWarning(false)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#b5832a] hover:bg-[#c99235] text-[#1a1814] transition-colors"
                >
                  결과 페이지에 머물기
                </button>
                <button
                  onClick={() => {
                    setShowLeaveWarning(false);
                    const { removeProject, projects } = useProjectStore.getState();
                    projects
                      .filter((p) => p.id.startsWith('guest-'))
                      .forEach((p) => removeProject(p.id));
                    localStorage.removeItem('guest_job');
                    navigate('/dashboard');
                  }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#35312a] hover:bg-[#45403a] text-[#a89880] transition-colors"
                >
                  그냥 대시보드로 이동
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── ShareModal ─────────────────────────────────────────────
function ShareModal({ onClose }) {
  const shareUrl = window.location.href;
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleTwitter = () => {
    const text = encodeURIComponent('TnT로 만든 썸네일 분석 결과를 확인해보세요!');
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleKakao = () => {
    // 카카오 SDK 미연동 시 링크 복사로 대체
    handleCopyLink();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] mx-4 bg-[#2a2720] border border-[#3a3630] rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[#f0ead8] font-bold text-base">결과 공유하기</h3>
          <button onClick={onClose} className="text-[#7a6e5e] hover:text-[#e8e0cc] transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-[#a89880] text-sm mb-4 leading-relaxed">
          아래 링크를 공유하면 누구든 이 분석 결과를 볼 수 있어요.
        </p>

        <div className="flex gap-2 mb-5">
          <div className="flex-1 bg-[#211f1a] border border-[#3a3630] rounded-lg px-3 py-2 text-xs text-[#7a6e5e] truncate">
            {shareUrl}
          </div>
          <button
            onClick={handleCopyLink}
            className={[
              'shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-[#b5832a] hover:bg-[#c99235] text-[#1a1814]',
            ].join(' ')}
          >
            {copied ? '✓ 복사됨' : '링크 복사'}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[#5a5048] text-xs uppercase tracking-wider mb-1">SNS 공유</p>
          <div className="flex gap-2">
            <button
              onClick={handleTwitter}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#211f1a] hover:bg-[#2a2720] border border-[#3a3630] hover:border-[#b5832a]/40 rounded-xl text-sm text-[#a89880] hover:text-[#e8e0cc] transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X (트위터)
            </button>
            <button
              onClick={handleKakao}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#211f1a] hover:bg-[#2a2720] border border-[#3a3630] hover:border-[#b5832a]/40 rounded-xl text-sm text-[#a89880] hover:text-[#e8e0cc] transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.667 1.516 5.01 3.813 6.4L4.5 21l4.688-2.906C10.077 18.356 11.024 18.5 12 18.5c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
              </svg>
              카카오톡
            </button>
          </div>
        </div>

        <p className="text-[#5a5048] text-xs mt-4 text-center">
          링크를 받은 사람은 로그인 없이도 결과를 볼 수 있어요
        </p>
      </div>
    </div>
  );
}

// ── AccountPopup ───────────────────────────────────────────
function AccountPopup({ onClose }) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const go = (path) => { onClose(); navigate(path); };
  const handleLogout = () => { onClose(); logout(); navigate('/'); };

  return (
    <div className="absolute bottom-16 left-4 z-50 bg-[#2a2720] border border-[#3a3630] rounded-xl shadow-xl py-1 min-w-[160px]">
      <button onClick={() => go('/settings')} className={itemCls}>
        ⚙️ <span>설정</span>
      </button>
      <button onClick={() => go('/help')} className={itemCls}>
        ❓ <span>도움말</span>
      </button>
      <hr className="border-[#3a3630] my-1" />
      <button onClick={handleLogout} className={`${itemCls} text-red-400 hover:text-red-300`}>
        🚪 <span>로그아웃</span>
      </button>
    </div>
  );
}
const itemCls = 'flex items-center gap-2 w-full px-4 py-2 text-sm text-[#e8e0cc] hover:bg-[#35312a] transition-colors text-left';

// ── Sidebar ────────────────────────────────────────────────
function Sidebar({ sidebarOpen }) {
  const { user } = useAuthStore();
  const {
    projects, toggleFavorite, removeProject, renameProject,
  } = useProjectStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [popupOpen, setPopupOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentHidden, setRecentHidden] = useState(false);

  const [menuOpen, setMenuOpen] = useState(null); // { project, x, y }
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const popupRef = useRef(null);
  const searchInputRef = useRef(null);

  // 팝업 외부 클릭 닫기
  useEffect(() => {
    if (!popupOpen) return;
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popupOpen]);

  // 검색창 자동 포커스
  useEffect(() => {
    if (isSearching) searchInputRef.current?.focus();
  }, [isSearching]);

  const openMenu = (e, project) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuH = 130;
    let y = rect.top;
    if (y + menuH > window.innerHeight) y = rect.bottom - menuH;
    setMenuOpen({ project, x: rect.right + 4, y });
  };

  const startRename = (project) => {
    setRenamingId(project.id);
    setRenameValue(project.name);
  };

  const handleRenameSubmit = async (id) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingId(null); return; }
    try {
      await renameProjectAPI(id, trimmed);
      renameProject(id, trimmed);
    } catch {}
    setRenamingId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProjectAPI(deleteTarget.id);
      removeProject(deleteTarget.id);
    } catch {}
    setDeleteTarget(null);
  };

  const navItemCls = (active) => [
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left',
    active
      ? 'bg-[#b5832a]/20 text-[#f0ead8] font-medium'
      : 'text-[#a89880] hover:text-[#e8e0cc] hover:bg-[#2a2720]',
  ].join(' ');

  const projectRowCls = (active) => [
    'group flex items-center gap-2 pl-3 pr-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-[#2a2720] w-full',
    active ? 'text-[#d4a843]' : 'text-[#a89880]',
  ].join(' ');

  const sectionLabelCls = 'text-[11px] text-[#5a5048] uppercase tracking-wider px-3 py-1.5';

  // 즐겨찾기 / 최근 항목 분리
  const favorites = projects.filter((p) => p.favorite);
  const recents = [...projects.filter((p) => !p.favorite)]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 5);

  // 검색 필터
  const searchResults = searchQuery.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const closeSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
  };

  // 프로젝트 행 렌더러
  const renderProjectRow = (p) => {
    const active = pathname === `/result/${p.id}`;
    const isRenaming = renamingId === p.id;
    return (
      <div key={p.id} className={projectRowCls(active)}>
        <div
          className="flex-1 truncate cursor-pointer min-w-0"
          onClick={() => !isRenaming && navigate(`/result/${p.id}`)}
        >
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit(p.id);
                if (e.key === 'Escape') setRenamingId(null);
              }}
              onBlur={() => setRenamingId(null)}
              className="w-full bg-[#211f1a] border border-[#b5832a] rounded px-2 py-0.5 text-xs text-[#e8e0cc] outline-none"
            />
          ) : (
            <span className="block truncate">{p.name}</span>
          )}
        </div>
        {!isRenaming && (
          <button
            type="button"
            onClick={(e) => openMenu(e, p)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#7a6e5e] hover:text-[#e8e0cc] shrink-0 px-0.5 rounded"
            aria-label="메뉴"
          >
            <EllipsisVertical size={13} />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <aside className={[
        'fixed left-0 top-16 bottom-0 bg-[#211f1a] border-r border-[#2a2720] flex flex-col',
        'transition-all duration-300 ease-in-out overflow-hidden',
        sidebarOpen ? 'w-60' : 'w-0',
      ].join(' ')}>
        <div className={[
          'flex flex-col h-full transition-opacity duration-200',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">

          {/* ① 새 프로젝트 */}
          <Link to="/upload" className={navItemCls(pathname === '/upload')}>
            <Plus size={17} />
            새 프로젝트
          </Link>

          {/* ② 검색 */}
          {user && (isSearching ? (
            <div className="flex flex-col gap-1 mt-2">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') closeSearch(); }}
                onBlur={() => { if (!searchQuery.trim()) closeSearch(); }}
                placeholder="프로젝트 검색..."
                className="w-full bg-[#2a2720] border border-[#3a3630] focus:border-[#b5832a] rounded-lg px-3 py-2 text-sm text-[#e8e0cc] outline-none transition-colors"
              />
              {searchQuery.trim() && (
                <div className="flex flex-col gap-0.5 mt-1">
                  {searchResults.length === 0 ? (
                    <p className="px-3 py-1.5 text-xs text-[#5a5048]">검색 결과 없음</p>
                  ) : (
                    searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { navigate(`/result/${p.id}`); closeSearch(); }}
                        className={projectRowCls(pathname === `/result/${p.id}`) + ' text-left'}
                      >
                        <span className="flex-1 truncate">{p.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsSearching(true)}
              className={navItemCls(false) + ' mt-2'}
            >
              <Search size={17} />
              검색
            </button>
          ))}

          {/* ③ 즐겨찾기 */}
          {user && favorites.length > 0 && (
            <div className="mt-2">
              <div className={sectionLabelCls + ' flex items-center gap-1.5'}>
                <Star size={11} />
                즐겨찾기
              </div>
              <div className="flex flex-col gap-0.5">
                {favorites.map((p) => renderProjectRow(p))}
              </div>
            </div>
          )}

          {/* ④ 최근 항목 */}
          {user && (
            <div className="mt-2">
              <div className="group flex items-center justify-between px-3 py-1.5">
                <span className="text-[11px] text-[#5a5048] uppercase tracking-wider">최근 항목</span>
                <button
                  onClick={() => setRecentHidden((v) => !v)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-[#7a6e5e] hover:text-[#d4cab4]"
                >
                  {recentHidden ? '펼치기' : '숨기기'}
                </button>
              </div>
              {!recentHidden && (
                <div className="flex flex-col gap-0.5">
                  {recents.map((p) => renderProjectRow(p))}
                </div>
              )}
            </div>
          )}

          {/* ⑤ 비로그인 도움말 */}
          {!user && (
            <Link
              to="/help"
              className={navItemCls(pathname === '/help') + ' mt-2'}
            >
              <HelpCircle size={17} />
              도움말
            </Link>
          )}

        </nav>

        {/* 하단 계정 영역 */}
        <div ref={popupRef} className="relative p-4 border-t border-[#2a2720]">
          {popupOpen && user && <AccountPopup onClose={() => setPopupOpen(false)} />}
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#b5832a] flex items-center justify-center text-xs font-bold text-[#f0ead8] shrink-0">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-sm text-[#d4cab4] truncate">
                  {user.username}
                </span>
              </div>
              <button
                onClick={() => setPopupOpen((v) => !v)}
                className="text-[#7a6e5e] hover:text-[#e8e0cc] transition-colors p-1 rounded-md hover:bg-[#2a2720] shrink-0"
                aria-label="계정 메뉴"
              >
                <EllipsisVertical size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setPopupOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#b5832a] hover:bg-[#c99235] text-[#1a1814] text-sm font-bold rounded-lg transition-colors"
            >
              🔑 로그인
            </button>
          )}
          {popupOpen && !user && (
            <LoginModal isOpen={true} onClose={() => setPopupOpen(false)} />
          )}
        </div>
        </div>
      </aside>

      {/* 컨텍스트 메뉴 */}
      {menuOpen && (
        <ProjectContextMenu
          project={menuOpen.project}
          pos={{ x: menuOpen.x, y: menuOpen.y }}
          onClose={() => setMenuOpen(null)}
          onRename={startRename}
          onDelete={(p) => setDeleteTarget(p)}
          toggleFavorite={toggleFavorite}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <DeleteConfirmModal
          project={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ── AppLayout ──────────────────────────────────────────────
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#1a1814]">
      <AppHeader sidebarOpen={sidebarOpen} onShare={() => setShareModalOpen(true)} />
      {/* 사이드바 토글 버튼 — 사이드바 오른쪽 테두리에 걸치는 fixed 위치 */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className={[
          'fixed top-5 z-50 flex items-center justify-center',
          'w-6 h-6 rounded-md',
          'text-[#7a6e5e] hover:text-[#e8e0cc] hover:bg-[#2a2720]',
          'transition-all duration-300',
          sidebarOpen ? 'left-[216px]' : 'left-4',
        ].join(' ')}
        aria-label={sidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          {sidebarOpen ? (
            <>
              <rect x="1" y="2" width="4" height="12" rx="1" fill="currentColor" opacity="0.9"/>
              <path d="M9 5l-2 3 2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="14" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
            </>
          ) : (
            <>
              <rect x="1" y="2" width="4" height="12" rx="1" fill="currentColor" opacity="0.3"/>
              <path d="M7 5l2 3-2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="14" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
            </>
          )}
        </svg>
      </button>
      <Sidebar sidebarOpen={sidebarOpen} />
      <main className={[
        'mt-16 flex-1 overflow-y-auto p-8 transition-all duration-300',
        sidebarOpen ? 'ml-60' : 'ml-0',
      ].join(' ')}>
        <Outlet />
      </main>
      {shareModalOpen && <ShareModal onClose={() => setShareModalOpen(false)} />}
    </div>
  );
}
