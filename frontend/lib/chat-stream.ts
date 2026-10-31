import { API_URL } from '../services/api.service';
export type StreamEvent = { event: string; data: string };
export async function readEvents(
  response: Response,
  receive: (event: StreamEvent) => Promise<void>,
) {
  if (!response.body) throw new Error('Streaming is unavailable.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer = (buffer + decoder.decode(value, { stream: !done })).replace(
        /\r\n/g,
        '\n',
      );
      if (buffer.length > 65536) throw new Error('Invalid event stream.');
      let end;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const lines = frame.split('\n');
        const event =
          lines
            .find((line) => line.startsWith('event:'))
            ?.slice(6)
            .trim() || 'message';
        const data = lines
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        if (data) await receive({ event, data });
      }
      if (done) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
export function connectRoom(id: string, token: string, signal: AbortSignal) {
  return fetch(`${API_URL}/conversations/${id}/events`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    signal,
    cache: 'no-store',
  });
}
