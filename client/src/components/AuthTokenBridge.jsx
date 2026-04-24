import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/react';

/**
 * AuthTokenBridge — syncs Clerk's JWT to localStorage so that
 * the axios `api.js` interceptor can attach it to API requests.
 *
 * This component ONLY manages the token. Role detection and
 * user creation are handled exclusively by PostLoginRedirect.
 */
const AuthTokenBridge = () => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const syncingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const sync = async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;

      try {
        if (!isLoaded) return;

        if (!isSignedIn) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('dbRole');
          return;
        }

        const token = await getToken();
        if (cancelled) return;

        if (token) {
          localStorage.setItem('token', token);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to sync Clerk token:', err);
        }
      } finally {
        syncingRef.current = false;
      }
    };

    sync();

    // Refresh token periodically (Clerk tokens expire)
    if (isSignedIn) {
      intervalId = setInterval(sync, 55 * 1000);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSignedIn, isLoaded, getToken]);

  return null;
};

export default AuthTokenBridge;
