import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NavBar({ user, onLogout }) {
    const { pathname } = useLocation();

    const active = (path) => (pathname === path ? 'active' : '');

    return (
        <nav className="navbar">
            <div className="container navbar__inner">
                <Link to="/" className="navbar__logo">
                    <span className="navbar__logo-mark">CC</span>
                    CollabCampus
                </Link>

                {user ? (
                    <>
                        <ul className="navbar__links">
                            <li><Link to="/join" className={active('/join')}>Browse Teams</Link></li>
                            <li><Link to="/create" className={active('/create')}>Create Team</Link></li>
                            <li><Link to="/created" className={active('/created')}>My Teams</Link></li>
                            <li><Link to="/requested" className={active('/requested')}>Requests</Link></li>
                        </ul>
                        <div className="navbar__user">
                            <span className="navbar__user-name">{user.name || user.email}</span>
                            <button className="btn btn-outline btn-sm" onClick={onLogout}>
                                Sign out
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="navbar__user">
                        <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
                        <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
