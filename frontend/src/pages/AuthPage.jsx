import { ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { await (isLogin ? login(payload) : register(payload)); navigate(location.state?.from || '/'); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-panel"><p className="eyebrow">{isLogin ? 'Welcome back' : 'Begin your story'}</p><h1>{isLogin ? 'Good to see you.' : <>Let’s find your<br/><em>kindred.</em></>}</h1><p className="auth-copy">{isLogin ? 'Sign in to follow your adoption journey.' : 'Create an account to meet the pets waiting for you.'}</p>{error && <p className="form-error">{error}</p>}<form className="auth-form" onSubmit={submit}>{!isLogin && <input name="name" placeholder="Your name" required/>}<input name="email" type="email" placeholder="Email address" required/><input name="password" type="password" placeholder="Password (6+ characters)" minLength="6" required/>{!isLogin && <select name="role" defaultValue="adopter"><option value="adopter">I want to adopt</option><option value="shelter">I represent a shelter</option></select>}<button className="primary-button" disabled={busy}>{busy ? 'Working...' : isLogin ? 'Log in' : 'Create account'} <ArrowRight size={17}/></button></form><p className="auth-switch">{isLogin ? 'New here?' : 'Already have an account?'} <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Log in'}</Link></p></div><div className="auth-image"><img src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1000&q=85" alt="Person gently hugging a dog"/></div></main>;
}
