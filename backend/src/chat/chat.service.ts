import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { fields, page, pagination, uuid } from '../common/validation.js';
import { text } from '../common/input.js';
@Injectable()
export class ChatService {
  constructor(private readonly db: DatabaseService) {}
  async member(id: string, user: string) {
    uuid(id);
    if (
      !(
        await this.db.pool.query(
          'SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2',
          [id, user],
        )
      ).rowCount
    )
      throw new NotFoundException('Conversation not found');
  }
  async create(user: string, input: unknown) {
    const d = fields(input, ['report_id']);
    const report = uuid(d.report_id, 'report_id');
    return this.db.transaction(async (client) => {
      const r = (
        await client.query(
          'SELECT author_id FROM reports WHERE id=$1 AND deleted_at IS NULL FOR SHARE',
          [report],
        )
      ).rows[0];
      if (!r) throw new NotFoundException('Report not found');
      if (r.author_id === user)
        throw new BadRequestException(
          'Cannot start a conversation with yourself',
        );
      const result = await client.query(
        `INSERT INTO conversations(report_id,requester_id) VALUES($1,$2)
    ON CONFLICT(report_id,requester_id) DO UPDATE SET requester_id=EXCLUDED.requester_id RETURNING id,report_id,created_at`,
        [report, user],
      );
      const conversation = result.rows[0];
      await client.query(
        'INSERT INTO conversation_members(conversation_id,user_id) VALUES($1,$2),($1,$3) ON CONFLICT DO NOTHING',
        [conversation.id, user, r.author_id],
      );
      return conversation;
    });
  }
  async list(user: string, input: unknown) {
    const q = fields(input, ['limit', 'cursor']);
    const { limit, cursor } = pagination(q);
    const params: unknown[] = [user];
    let condition = '';
    if (cursor) {
      params.push(cursor.time, cursor.id);
      condition = 'AND (c.created_at,c.id)<($2::timestamptz,$3::uuid)';
    }
    params.push(limit + 1);
    const rows = await this.db.pool.query(
      `SELECT c.id,c.report_id,c.created_at,r.title AS report_title,(r.deleted_at IS NOT NULL) AS report_deleted,
   to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_time
   FROM conversations c JOIN conversation_members m ON m.conversation_id=c.id JOIN reports r ON r.id=c.report_id
   WHERE m.user_id=$1 ${condition} ORDER BY c.created_at DESC,c.id DESC LIMIT $${params.length}`,
      params,
    );
    return page(rows.rows, limit);
  }
  async history(id: string, user: string, input: unknown) {
    await this.member(id, user);
    const q = fields(input, ['limit', 'cursor']);
    const { limit, cursor } = pagination(q);
    const params: unknown[] = [id];
    let condition = '';
    if (cursor) {
      params.push(cursor.time, cursor.id);
      condition = 'AND (created_at,id)<($2::timestamptz,$3::uuid)';
    }
    params.push(limit + 1);
    const rows = await this.db.pool.query(
      `SELECT id,conversation_id,sender_id,client_message_id,body,created_at,
   to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_time
   FROM messages WHERE conversation_id=$1 ${condition} ORDER BY created_at DESC,id DESC LIMIT $${params.length}`,
      params,
    );
    return page(rows.rows, limit);
  }
  async send(id: string, user: string, input: unknown) {
    await this.member(id, user);
    const d = fields(input, ['client_message_id', 'body']);
    const key = uuid(d.client_message_id, 'client_message_id');
    const body = text(d.body, 'body', 2000);
    return this.db.transaction(async (client: PoolClient) => {
      // Serialize sends with deletion and each other, giving commit order within a room.
      const report = (
        await client.query('SELECT report_id FROM conversations WHERE id=$1', [
          id,
        ])
      ).rows[0];
      await client.query('SELECT id FROM reports WHERE id=$1 FOR SHARE', [
        report.report_id,
      ]);
      await client.query(
        'SELECT id FROM conversations WHERE id=$1 FOR UPDATE',
        [id],
      );
      const existing = (
        await client.query(
          'SELECT id,conversation_id,sender_id,client_message_id,body,created_at FROM messages WHERE conversation_id=$1 AND sender_id=$2 AND client_message_id=$3',
          [id, user, key],
        )
      ).rows[0];
      if (existing) {
        if (existing.body !== body)
          throw new ConflictException(
            'client_message_id already used for another message',
          );
        return existing;
      }
      if (
        (
          await client.query('SELECT deleted_at FROM reports WHERE id=$1', [
            report.report_id,
          ])
        ).rows[0].deleted_at
      )
        throw new ConflictException(
          'Report deleted; conversation is read-only',
        );
      return (
        await client.query(
          `INSERT INTO messages(conversation_id,sender_id,client_message_id,body) VALUES($1,$2,$3,$4)
    RETURNING id,conversation_id,sender_id,client_message_id,body,created_at`,
          [id, user, key, body],
        )
      ).rows[0];
    });
  }
  async version(id: string, user: string) {
    await this.member(id, user);
    return (
      (
        await this.db.pool.query(
          'SELECT id FROM messages WHERE conversation_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1',
          [id],
        )
      ).rows[0]?.id ?? null
    );
  }
}
