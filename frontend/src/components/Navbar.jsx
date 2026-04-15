import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LangContext } from '../contexts/LangContext';
import { GraduationCap, BookOpen, LogOut, MessageSquare, User, ChevronDown, Globe, Calendar } from 'lucide-react';
import { assetUrl } from '../services/api';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { lang, switchLang, t } = useContext(LangContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const userMenuRef = useRef(null);
  const langMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };

  const isActive = (path) => location.pathname === path;

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';
  const avatarUrl = user?.avatar_url ? assetUrl(user.avatar_url) : null;
  
  // Determine courses path based on user role
  const coursesPath = user?.role === 'lecturer' ? '/instructor/dashboard' : '/courses';
  const isCoursesActive = location.pathname === '/courses' || location.pathname === '/instructor/dashboard';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setShowLangMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <div className="nav-brand-icon">
          <GraduationCap size={20} />
        </div>
        <span className="nav-brand-text">VanAnhLMS</span>
      </Link>

      <div className="nav-links">
        {user ? (
          <>
            <Link to={coursesPath} className={`nav-link ${isCoursesActive ? 'nav-link-active' : ''}`}
              style={isCoursesActive ? { color: 'var(--primary)', background: 'var(--primary-light)' } : {}}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={15} /> {t('nav_courses')}
              </span>
            </Link>
            <Link to="/timetable" className={`nav-link ${isActive('/timetable') ? 'nav-link-active' : ''}`}
              style={isActive('/timetable') ? { color: 'var(--primary)', background: 'var(--primary-light)' } : {}}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={15} /> {t('nav_timetable')}
              </span>
            </Link>
            <Link to="/guide" className={`nav-link ${isActive('/guide') ? 'nav-link-active' : ''}`}
              style={isActive('/guide') ? { color: 'var(--primary)', background: 'var(--primary-light)' } : {}}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={15} /> {t('nav_guide')}
              </span>
            </Link>
            <Link to="/forum" className={`nav-link ${isActive('/forum') ? 'nav-link-active' : ''}`}
              style={isActive('/forum') ? { color: 'var(--primary)', background: 'var(--primary-light)' } : {}}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={15} /> {t('nav_forum')}
              </span>
            </Link>

            {/* Language Switcher */}
            <div style={{ position: 'relative', marginLeft: '0.5rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }} ref={langMenuRef}>
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Globe size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{lang.toUpperCase()}</span>
              </button>
              
              {showLangMenu && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: '140px',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  <button
                    onClick={() => {
                      switchLang('vi');
                      setShowLangMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.875rem',
                      textAlign: 'left',
                      border: 'none',
                      background: lang === 'vi' ? 'var(--primary-light)' : 'transparent',
                      color: lang === 'vi' ? 'var(--primary)' : 'var(--text)',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: lang === 'vi' ? '600' : '400',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--primary-light)'}
                    onMouseLeave={(e) => e.target.style.background = lang === 'vi' ? 'var(--primary-light)' : 'transparent'}
                  >
                    <span style={{ fontSize: '1rem' }}>🇻🇳</span>
                    <span>Tiếng Việt</span>
                  </button>
                  <button
                    onClick={() => {
                      switchLang('en');
                      setShowLangMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.875rem',
                      textAlign: 'left',
                      border: 'none',
                      background: lang === 'en' ? 'var(--primary-light)' : 'transparent',
                      color: lang === 'en' ? 'var(--primary)' : 'var(--text)',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: lang === 'en' ? '600' : '400',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--primary-light)'}
                    onMouseLeave={(e) => e.target.style.background = lang === 'en' ? 'var(--primary-light)' : 'transparent'}
                  >
                    <span style={{ fontSize: '1rem' }}>🇬🇧</span>
                    <span>English</span>
                  </button>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div style={{ position: 'relative', marginLeft: '0.5rem' }} ref={userMenuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="nav-user"
                style={{ 
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.5rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div className="avatar" style={{ overflow: 'hidden' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    initial
                  )}
                </div>
                <span style={{ color: 'var(--text)', fontSize: '0.875rem' }}>{user.name}</span>
                <span className="badge badge-primary">{user.role}</span>
                <ChevronDown size={16} style={{ color: 'var(--text-light)' }} />
              </button>

              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: '200px',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  <Link
                    to={coursesPath}
                    onClick={() => setShowUserMenu(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      transition: 'background 0.2s',
                      borderBottom: '1px solid var(--border)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <BookOpen size={16} />
                    <span style={{ fontSize: '0.875rem' }}>{t('nav_courses')}</span>
                  </Link>
                  
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      transition: 'background 0.2s',
                      borderBottom: '1px solid var(--border)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <User size={16} />
                    <span style={{ fontSize: '0.875rem' }}>{t('nav_profile')}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} />
                    <span>{t('nav_logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-sm">{t('nav_login')}</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
