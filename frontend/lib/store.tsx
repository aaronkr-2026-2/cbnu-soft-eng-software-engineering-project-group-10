'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { apiError, getAccount, isUnauthorized, login, logout } from '@/services/api.service';
import { SEED_ITEMS } from '@/lib/data';
import type { CampusItem, ItemDraft, Session } from '@/lib/types';

const ITEMS_KEY = 'campusfind-demo-items-v1';
const SESSION_KEY = 'campusfind-demo-session-v1';

type Store = {
  items: CampusItem[];
  session: Session | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<boolean>;
  addItem: (item: ItemDraft) => string;
  editItem: (id: string, draft: ItemDraft) => void;
  setRecovered: (id: string, recovered: boolean) => void;
  deleteItem: (id: string) => void;
};

const StoreContext = createContext<Store | null>(null);

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CampusProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CampusItem[]>(SEED_ITEMS);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const token = useRef<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [notice, setNotice] = useState('');
  const signingOut = useRef(false);

  useEffect(() => {
    const saved = readLocal<CampusItem[]>(ITEMS_KEY, SEED_ITEMS);
    // Hydrate browser storage only after mount to keep server/client initial renders identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(Array.isArray(saved) ? saved : SEED_ITEMS);
    // Old demo profiles never authenticate a real account.
    try { window.localStorage.removeItem(SESSION_KEY); } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(ITEMS_KEY, JSON.stringify(items)); }
    catch { console.warn('CampusFind demo storage is full. Use a smaller image.'); }
  }, [items, ready]);

  useEffect(() => {
    if (!session || !token.current) return;
    const currentToken = token.current;
    const expire = () => {
      if (token.current !== currentToken) return;
      token.current = null; setSession(null);
      setNotice('Your session has expired. Please sign in again.');
    };
    const timer = window.setTimeout(expire, Math.max(0, expiresAt - Date.now()));
    const verify = async () => {
      if (Date.now() >= expiresAt) { expire(); return; }
      try { await getAccount(currentToken); }
      catch (cause) { if (isUnauthorized(cause)) expire(); }
    };
    window.addEventListener('focus', verify);
    return () => { window.clearTimeout(timer); window.removeEventListener('focus', verify); };
  }, [session, expiresAt]);

  const value = useMemo<Store>(() => ({
    items, session, ready,
    signIn: async (email, password) => {
      const result = await login(email, password);
      try {
        const account = await getAccount(result.access_token);
        const previous = token.current;
        token.current = result.access_token;
        setExpiresAt(Date.now() + result.expires_in * 1000);
        setSession({ name: account.full_name, email: account.email });
        setNotice('');
        if (previous) void logout(previous).catch(() => undefined);
      } catch (cause) {
        await logout(result.access_token).catch(() => undefined);
        throw cause;
      }
    },
    signOut: async () => {
      if (signingOut.current) return false;
      signingOut.current = true;
      const current = token.current;
      try { if (current) await logout(current); }
      catch (cause) {
        if (!isUnauthorized(cause)) { setNotice(apiError(cause)); return false; }
      } finally { signingOut.current = false; }
      if (token.current === current) { token.current = null; setSession(null); setNotice(''); }
      return true;
    },
    addItem: (draft) => {
      if (!session) throw new Error('Sign in to create a post.');
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
      setItems((current) => [{ ...draft, id, status: 'open', ownerName: session.name,
        ownerEmail: session.email, createdAt: new Date().toISOString() }, ...current]);
      return id;
    },
    editItem: (id, draft) => setItems((current) => current.map((item) =>
      item.id === id && session?.email === item.ownerEmail ? { ...item, ...draft } : item)),
    setRecovered: (id, recovered) => setItems((current) => current.map((item) =>
      item.id === id && session?.email === item.ownerEmail ? { ...item, status: recovered ? 'recovered' : 'open' } : item)),
    deleteItem: (id) => setItems((current) => current.filter((item) =>
      item.id !== id || session?.email !== item.ownerEmail))
  }), [items, session, ready]);

  return <StoreContext.Provider value={value}>{notice && <p role="alert" className="bg-amber-50 px-6 py-3 text-sm text-amber-900">{notice}</p>}{children}</StoreContext.Provider>;
}

export function useCampus() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useCampus must be used within CampusProvider');
  return value;
}
