'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SEED_ITEMS } from '@/lib/data';
import type { CampusItem, ItemDraft, Session } from '@/lib/types';

const ITEMS_KEY = 'campusfind-demo-items-v1';
const SESSION_KEY = 'campusfind-demo-session-v1';

type Store = {
  items: CampusItem[];
  session: Session | null;
  ready: boolean;
  signIn: (session: Session) => void;
  signOut: () => void;
  updateProfile: (name: string) => void;
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

  useEffect(() => {
    const saved = readLocal<CampusItem[]>(ITEMS_KEY, SEED_ITEMS);
    // Hydrate browser storage only after mount to keep server/client initial renders identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(Array.isArray(saved) ? saved : SEED_ITEMS);
    const savedSession = readLocal<Session | null>(SESSION_KEY, null);
    setSession(savedSession && typeof savedSession.email === 'string' && typeof savedSession.name === 'string' ? savedSession : null);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(ITEMS_KEY, JSON.stringify(items)); }
    catch { console.warn('CampusFind demo storage is full. Use a smaller image.'); }
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else window.localStorage.removeItem(SESSION_KEY);
    } catch { console.warn('CampusFind could not save the demo session.'); }
  }, [session, ready]);

  const value = useMemo<Store>(() => ({
    items, session, ready,
    signIn: (next) => setSession(next),
    signOut: () => setSession(null),
    updateProfile: (name) => {
      setSession((current) => current ? { ...current, name } : current);
      setItems((current) => current.map((item) => item.ownerEmail === session?.email ? { ...item, ownerName: name } : item));
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

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useCampus() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useCampus must be used within CampusProvider');
  return value;
}
