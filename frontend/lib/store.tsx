'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  apiError,
  getAccount,
  isUnauthorized,
  login,
  logout,
  request,
} from '@/services/api.service';

type Session = { id: string; name: string; email: string };
type RequestOptions = Parameters<typeof request>[1];
type Store = {
  session: Session | null;
  ready: boolean;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<boolean>;
  expire: () => void;
  authorized: <T>(path: string, options?: RequestOptions) => Promise<T>;
};
const StoreContext = createContext<Store | null>(null);

export function CampusProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const token = useRef<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [notice, setNotice] = useState('');
  const signingOut = useRef(false);
  const expire = useCallback(() => {
    token.current = null;
    setAccessToken(null);
    setSession(null);
    setNotice('Your session has expired. Please sign in again.');
  }, []);

  useEffect(() => {
    // Remove obsolete prototype data; never persist authentication or real reports.
    try {
      localStorage.removeItem('campusfind-demo-items-v1');
      localStorage.removeItem('campusfind-demo-session-v1');
    } catch {}
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const current = accessToken;
    const check = async () => {
      try {
        await getAccount(current);
      } catch (cause) {
        if (isUnauthorized(cause) && token.current === current) expire();
      }
    };
    const timer = setTimeout(
      () => {
        if (token.current === current) expire();
      },
      Math.max(0, expiresAt - Date.now()),
    );
    window.addEventListener('focus', check);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', check);
    };
  }, [accessToken, expiresAt, expire]);

  const authorized = useCallback(
    async <T,>(path: string, options?: RequestOptions): Promise<T> => {
      const current = token.current;
      if (!current) throw new Error('Please sign in to continue.');
      try {
        const result = await request<T>(path, { ...options, token: current });
        if (token.current !== current)
          throw new Error('Your session changed. Please try again.');
        return result;
      } catch (cause) {
        if (isUnauthorized(cause) && token.current === current) expire();
        throw cause;
      }
    },
    [expire],
  );

  async function signIn(email: string, password: string) {
    const result = await login(email, password);
    try {
      const account = await getAccount(result.access_token);
      const previous = token.current;
      token.current = result.access_token;
      setAccessToken(result.access_token);
      setSession({
        id: account.id,
        name: account.full_name,
        email: account.email,
      });
      setExpiresAt(Date.now() + result.expires_in * 1000);
      setNotice('');
      if (previous) void logout(previous).catch(() => undefined);
    } catch (cause) {
      await logout(result.access_token).catch(() => undefined);
      throw cause;
    }
  }
  async function signOut() {
    if (signingOut.current) return false;
    signingOut.current = true;
    const current = token.current;
    try {
      if (current) await logout(current);
    } catch (cause) {
      if (!isUnauthorized(cause)) {
        setNotice(apiError(cause));
        return false;
      }
    } finally {
      signingOut.current = false;
    }
    if (current === token.current) {
      token.current = null;
      setAccessToken(null);
      setSession(null);
      setNotice('');
    }
    return true;
  }
  return (
    <StoreContext.Provider
      value={{
        session,
        ready: true,
        accessToken,
        authorized,
        expire,
        signIn,
        signOut,
      }}
    >
      {notice && (
        <p
          role="alert"
          className="bg-amber-50 px-6 py-3 text-sm text-amber-900"
        >
          {notice}
        </p>
      )}
      {children}
    </StoreContext.Provider>
  );
}

export function useCampus() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useCampus must be used within CampusProvider');
  return value;
}
