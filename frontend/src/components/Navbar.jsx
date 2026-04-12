import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LogOut, Globe, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <div className="nav-brand-icon-img" style={{ 
          width: '40px', height: '40px', background: 'var(--primary)', 
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          fontWeight: 'bold', fontSize: '20px'
        }}>
          C
        </div>
        <span className="nav-brand-text">CodeHub LMS</span>
      </Link>

      <div className="nav-links">
        <Link to="/courses" className={`nav-link ${isActive('/courses') ? 'nav-link-active' : ''}`}
          style={isActive('/courses') ? { color: 'var(--primary)' } : {}}>
          Khóa học
        </Link>
        <Link to="#" className="nav-link">
          Thời gian biểu
        </Link>
        <Link to="/forum" className={`nav-link ${isActive('/forum') ? 'nav-link-active' : ''}`}
          style={isActive('/forum') ? { color: 'var(--primary)' } : {}}>
          Hướng dẫn sử dụng
        </Link>
        
        <div className="nav-divider"></div>

        <div className="lang-selector">
          <Globe size={16} />
          <span>Tiếng Việt ‎(vi)‎</span>
          <ChevronDown size={14} />
        </div>

        {user ? (
          <div className="nav-user-dropdown">
            <div className="nav-user">
              <span className="nav-user-name">{user.name}</span>
              <div className="avatar">{initial}</div>
            </div>
            <div className="dropdown-menu">
              <Link to="/dashboard" className="dropdown-item">Dashboard</Link>
              <button onClick={handleLogout} className="dropdown-item text-danger">
                <LogOut size={15} /> Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          <Link to="/login" className="btn btn-login">Bạn chưa đăng nhập. (Đăng nhập)</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
