'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { RequireLogin } from '@/components/require-login';
import { Loading } from '@/components/request-state';
import { useCampus } from '@/lib/store';
import type { Message, Page } from '@/lib/report-types';
import { apiError, responseStatus } from '@/services/api.service';
import { connectRoom, readEvents } from '@/lib/chat-stream';

function Room({ id }: { id: string }) {
  const { authorized, accessToken, session, expire } = useCampus();
  const [messages, setMessages] = useState<Message[]>([]);
  const known = useRef(new Map<string, Message>());
  const [cursor, setCursor] = useState<string | null>(null);
  const initialized = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('Connecting...');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [failed, setFailed] = useState<{
    client_message_id: string;
    body: string;
  }>();
  const [sending, setSending] = useState(false);
  const pending = useRef(false);
  const olderPending = useRef(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const [restart, setRestart] = useState(0);
  const messageList = useRef<HTMLOListElement>(null);
  const followLatest = useRef(true);
  const preserveScroll = useRef<{ top: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const list = messageList.current;
    if (!list) return;
    if (preserveScroll.current) {
      list.scrollTop =
        preserveScroll.current.top +
        list.scrollHeight -
        preserveScroll.current.height;
      preserveScroll.current = null;
    } else if (followLatest.current) list.scrollTop = list.scrollHeight;
  }, [messages]);
  const merge = useCallback((rows: Message[]) => {
    for (const row of rows) known.current.set(row.id, row);
    setMessages(
      [...known.current.values()].sort(
        (a, b) =>
          a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
      ),
    );
  }, []);
  const refresh = useCallback(
    async (signal: AbortSignal) => {
      const previous = new Set(known.current.keys());
      let next: string | null = null;
      do {
        const page: Page<Message> = await authorized(
          `/conversations/${id}/messages?limit=50${next ? '&cursor=' + encodeURIComponent(next) : ''}`,
          { signal },
        );
        if (signal.aborted) return;
        if (!initialized.current) {
          setCursor(page.next_cursor);
          initialized.current = true;
        }
        merge(page.items);
        setLoaded(true);
        // Recover every missed page after reconnect, stopping at already known history.
        if (!previous.size || page.items.some((row) => previous.has(row.id)))
          break;
        next = page.next_cursor;
      } while (next);
    },
    [authorized, id, merge],
  );

  useEffect(() => {
    if (!accessToken) return;
    let stopped = false,
      timer: ReturnType<typeof setTimeout> | undefined;
    let active: AbortController | undefined;
    let delay = 1000;
    async function run() {
      if (stopped || document.hidden || (active && !active.signal.aborted))
        return;
      const controller = new AbortController();
      active = controller;
      // Bound the initial connection attempt without timing out healthy streams.
      let handshake: ReturnType<typeof setTimeout> | undefined;
      try {
        setStatus('Connecting...');
        await refresh(controller.signal);
        handshake = setTimeout(() => controller.abort(), 65000);
        const response = await connectRoom(id, accessToken!, controller.signal);
        clearTimeout(handshake);
        if (response.status === 401) {
          expire();
          return;
        }
        if (response.status === 404) {
          setError('Conversation unavailable or access denied.');
          stopped = true;
          return;
        }
        if (!response.ok)
          throw new Error('Realtime is temporarily unavailable.');
        setStatus('Connected');
        setError('');
        delay = 1000;
        await readEvents(response, async (event) => {
          if (controller.signal.aborted) return;
          if (event.event === 'ready' || event.event === 'refresh')
            await refresh(controller.signal);
          else if (event.event === 'session-ended') {
            const data = JSON.parse(event.data);
            if (data.status === 401) expire();
            else {
              setError('Conversation access is no longer available.');
              stopped = true;
            }
            controller.abort();
          } else if (event.event === 'unavailable')
            throw new Error('Realtime is temporarily unavailable.');
        });
      } catch (cause) {
        if (!controller.signal.aborted) setError(apiError(cause));
        if (responseStatus(cause) === 404 || responseStatus(cause) === 400)
          stopped = true;
      } finally {
        if (handshake) clearTimeout(handshake);
        controller.abort();
        if (!stopped && !document.hidden && active === controller) {
          setStatus('Reconnecting — messages remain saved');
          timer = setTimeout(run, delay);
          delay = Math.min(delay * 2, 30000);
        }
      }
    }
    const visibility = () => {
      if (timer) clearTimeout(timer);
      if (document.hidden) {
        active?.abort();
        setStatus('Paused while this tab is hidden');
      } else if (!active || active.signal.aborted) void run();
    };
    void run();
    document.addEventListener('visibilitychange', visibility);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      active?.abort();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [accessToken, id, refresh, expire, restart]);

  async function older() {
    if (!cursor || olderPending.current) return;
    olderPending.current = true;
    setOlderBusy(true);
    setError('');
    try {
      const page = await authorized<Page<Message>>(
        `/conversations/${id}/messages?limit=50&cursor=${encodeURIComponent(cursor)}`,
      );
      if (messageList.current)
        preserveScroll.current = {
          top: messageList.current.scrollTop,
          height: messageList.current.scrollHeight,
        };
      merge(page.items);
      setCursor(page.next_cursor);
    } catch (cause) {
      setError(apiError(cause));
    } finally {
      olderPending.current = false;
      setOlderBusy(false);
    }
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    const payload = failed || {
      client_message_id: crypto.randomUUID(),
      body: draft.trim(),
    };
    if (!payload.body || payload.body.length > 2000) return;
    pending.current = true;
    setSending(true);
    setError('');
    try {
      const row = await authorized<Message>(`/conversations/${id}/messages`, {
        method: 'POST',
        body: payload,
      });
      merge([row]);
      setDraft('');
      setFailed(undefined);
    } catch (cause) {
      setFailed(payload);
      setError(apiError(cause));
    } finally {
      pending.current = false;
      setSending(false);
    }
  }
  return (
    <div className="container-page max-w-4xl py-10">
      <Link href="/inbox" className="text-blue-600">
        ← Inbox
      </Link>
      <div className="my-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Conversation</h1>
        <button
          className="btn-secondary"
          onClick={() => setRestart((n) => n + 1)}
        >
          Reconnect / refresh
        </button>
      </div>
      <p role="status" className="mb-4 text-sm text-slate-500">
        {status}
      </p>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-rose-50 p-4 text-rose-700"
        >
          {error}
        </p>
      )}
      {!loaded && !error && <Loading label="Loading messages..." />}
      {cursor && (
        <button
          className="btn-secondary mb-5"
          disabled={olderBusy}
          onClick={older}
        >
          {olderBusy ? 'Loading...' : 'Load older messages'}
        </button>
      )}
      <p className="sr-only" role="status">
        {messages.length} messages loaded.
      </p>
      <ol
        ref={messageList}
        onScroll={() => {
          const list = messageList.current;
          if (list)
            followLatest.current =
              list.scrollHeight - list.scrollTop - list.clientHeight < 80;
        }}
        aria-label="Messages"
        className="card-base max-h-[60vh] space-y-4 overflow-y-auto p-5"
      >
        {loaded && !messages.length && (
          <li className="py-8 text-center text-slate-500">
            No messages yet. Introduce yourself.
          </li>
        )}
        {messages.map((message) => (
          <li
            key={message.id}
            className={`flex ${message.sender_id === session?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.sender_id === session?.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}
            >
              <p className="mb-1 text-xs font-semibold">
                {message.sender_id === session?.id
                  ? 'You'
                  : 'Other participant'}
              </p>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              <time
                className="mt-2 block text-xs opacity-75"
                dateTime={message.created_at}
              >
                {new Date(message.created_at).toLocaleString()}
              </time>
            </div>
          </li>
        ))}
      </ol>
      <form onSubmit={send} className="mt-6 space-y-3">
        <label htmlFor="message" className="label-base">
          Message
        </label>
        <textarea
          id="message"
          rows={3}
          maxLength={2000}
          required
          disabled={sending || !!failed}
          className="input-base"
          value={failed?.body || draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about the item..."
        />
        {failed && (
          <p className="text-sm text-amber-800">
            Delivery is unconfirmed. Retry sends the same message safely.
            Discarding cannot undo a message already saved by the server.
          </p>
        )}
        <div className="flex gap-3">
          <button
            disabled={sending || (!failed && !draft.trim())}
            className="btn-primary"
          >
            {sending
              ? 'Sending...'
              : failed
                ? 'Retry same message'
                : 'Send message'}
          </button>
          {failed && (
            <button
              disabled={sending}
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFailed(undefined);
                setDraft('');
              }}
            >
              Discard draft
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useCampus();
  return (
    <RequireLogin next={`/inbox/${id}`}>
      <Room key={id + session?.id} id={id} />
    </RequireLogin>
  );
}
