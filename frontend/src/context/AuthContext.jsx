import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('kindred_user') || 'null'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('kindred_token')));

  useEffect(() => {
    if (!localStorage.getItem('kindred_token')) return;
    client.get('/auth/me').then(({ data }) => {
      setUser(data.user);
      localStorage.setItem('kindred_user', JSON.stringify(data.user));
    }).catch(() => logout()).finally(() => setLoading(false));
  }, []);

  async function authenticate(mode, payload) {
    const { data } = await client.post(`/auth/${mode}`, payload);
    localStorage.setItem('kindred_token', data.token);
    localStorage.setItem('kindred_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }
  async function login(payload) { return authenticate('login', payload); }
  async function register(payload) { return authenticate('register', payload); }
  function logout() { localStorage.removeItem('kindred_token'); localStorage.removeItem('kindred_user'); setUser(null); }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
