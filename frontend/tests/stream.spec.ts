import { test, expect } from '@playwright/test';
import { readEvents } from '../lib/chat-stream';
test('SSE parser preserves split UTF-8, CRLF boundaries and multiline data', async () => {
  const bytes = new TextEncoder().encode(
    ': heartbeat\r\nevent: refresh\r\ndata: {"text":"안녕"}\r\ndata: second line\r\n\r\n',
  );
  const events: { event: string; data: string }[] = [];
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
      controller.close();
    },
  });
  await readEvents(new Response(stream), async (event) => {
    events.push(event);
  });
  expect(events).toEqual([
    { event: 'refresh', data: '{"text":"안녕"}\nsecond line' },
  ]);
});
