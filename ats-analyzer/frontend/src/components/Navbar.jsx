import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <svg className="brand-mark" viewBox="0 0 40 24" width="28" height="17" aria-hidden="true">
          <path
            d="M0 12 Q5 2 10 12 T20 12 T30 12 T40 12"
            fill="none"
            stroke="var(--accent-strong)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        Resonance
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/">Analyze</Link>
            <Link to="/history">History</Link>
            <span className="nav-user">{user.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
