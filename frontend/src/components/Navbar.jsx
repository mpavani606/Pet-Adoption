import { ArrowRight, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const close = () => setOpen(false);
  return <header className="topbar"><Link className="brand" to="/" onClick={close}><span className="brand-mark">k</span><span>kindred</span></Link><nav className={open ? 'nav-links open' : 'nav-links'}><Link to="/#discover" onClick={close}>Find a friend</Link><Link to="/#how" onClick={close}>How it works</Link>{user && <Link to="/my-requests" className={location.pathname === '/my-requests' ? 'nav-active' : ''} onClick={close}>My requests</Link>}{user && ['shelter', 'admin'].includes(user.role) && <><Link to="/pets/new" className={location.pathname === '/pets/new' ? 'nav-active' : ''} onClick={close}>Add pet</Link><Link to="/requests" className={location.pathname === '/requests' ? 'nav-active' : ''} onClick={close}>Manage</Link></>}</nav><div className="header-actions"><button className="icon-button mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X size={20}/> : <Menu size={20}/>}</button>{user ? <button className="user-chip" onClick={logout}>{user.name?.slice(0, 1).toUpperCase()} <span>Sign out</span></button> : <Link className="login-link" to="/login">Log in <ArrowRight size={15}/></Link>}</div></header>;
}
