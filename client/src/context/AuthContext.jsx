import { useMemo, useState } from 'react';
import { AuthContext } from './authContextObject';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem('currentUser');
      return null;
    }
  });

  const login = ({ token: nextToken, user }) => {
    setToken(nextToken);
    setCurrentUser(user);
    localStorage.setItem('token', nextToken);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  };

  const value = useMemo(
    () => ({
      token,
      currentUser,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
