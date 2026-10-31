import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { text } from '../common/input.js';
import {
  choice,
  date,
  fields,
  page,
  pagination,
  uuid,
} from '../common/validation.js';

const summary = `r.id,r.report_type,r.status,r.title,r.occurred_on::text,r.created_at,r.updated_at,r.recovered_at,
 json_build_object('id',c.id,'name',c.name) AS category,
 json_build_object('id',l.id,'name',l.name) AS location,
 COALESCE((SELECT json_agg(json_build_object('id',i.id,'url','/images/'||i.id,'width',i.width,'height',i.height) ORDER BY i.created_at,i.id)
 FROM report_images i WHERE i.report_id=r.id),'[]'::json) AS images`;
const joins =
  'FROM reports r JOIN categories c ON c.id=r.category_id JOIN locations l ON l.id=r.location_id';
@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}
  async catalogs() {
    const [categories, locations] = await Promise.all([
      this.db.pool.query(
        'SELECT id,name FROM categories WHERE is_active ORDER BY name,id',
      ),
      this.db.pool.query(
        'SELECT id,name FROM locations WHERE is_active ORDER BY name,id',
      ),
    ]);
    return { categories: categories.rows, locations: locations.rows };
  }
  async list(input: unknown, owner?: string) {
    const q = fields(input, [
      'limit',
      'cursor',
      'report_type',
      'status',
      'category_id',
      'location_id',
      'q',
    ]);
    const { limit, cursor } = pagination(q);
    const params: unknown[] = [];
    const where = ['r.deleted_at IS NULL'];
    const bind = (value: unknown) => {
      params.push(value);
      return '$' + params.length;
    };
    for (const key of ['report_type', 'status'])
      if (q[key] !== undefined)
        where.push(
          `r.${key}=${bind(choice(q[key], key === 'status' ? ['open', 'recovered'] : ['lost', 'found'], key))}`,
        );
    for (const key of ['category_id', 'location_id'])
      if (q[key] !== undefined)
        where.push(`r.${key}=${bind(uuid(q[key], key))}`);
    if (owner) where.push(`r.author_id=${bind(owner)}`);
    if (q.q !== undefined)
      where.push(
        `to_tsvector('simple',r.title||' '||r.description) @@ plainto_tsquery('simple',${bind(text(q.q, 'q', 100))})`,
      );
    if (cursor)
      where.push(
        `(r.created_at,r.id)<(${bind(cursor.time)}::timestamptz,${bind(cursor.id)}::uuid)`,
      );
    const rows = await this.db.pool.query(
      `SELECT ${summary},to_char(r.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_time
   ${joins} WHERE ${where.join(' AND ')} ORDER BY r.created_at DESC,r.id DESC LIMIT ${bind(limit + 1)}`,
      params,
    );
    return page(rows.rows, limit);
  }
  async detail(id: string) {
    const rows = await this.db.pool.query(
      `SELECT ${summary},r.description ${joins} WHERE r.id=$1 AND r.deleted_at IS NULL`,
      [uuid(id)],
    );
    if (!rows.rowCount) throw new NotFoundException('Report not found');
    return rows.rows[0];
  }
  async owned(client: PoolClient, id: string, user: string) {
    const row = (
      await client.query(
        'SELECT *,occurred_on::text AS occurred_on FROM reports WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',
        [uuid(id)],
      )
    ).rows[0];
    if (!row) throw new NotFoundException('Report not found');
    if (row.author_id !== user)
      throw new ForbiddenException('Report owner required');
    return row;
  }
  private async catalogsValid(
    client: PoolClient,
    category: string,
    location: string,
  ) {
    if (
      !(
        await client.query(
          'SELECT id FROM categories WHERE id=$1 AND is_active',
          [category],
        )
      ).rowCount ||
      !(
        await client.query(
          'SELECT id FROM locations WHERE id=$1 AND is_active',
          [location],
        )
      ).rowCount
    )
      throw new BadRequestException('Choose an active category and location');
  }
  async create(user: string, input: unknown) {
    const d = fields(input, [
      'title',
      'description',
      'report_type',
      'category_id',
      'location_id',
      'occurred_on',
    ]);
    const title = text(d.title, 'title', 120),
      description = text(d.description, 'description', 3000);
    const type = choice(d.report_type, ['lost', 'found'], 'report_type');
    const category = uuid(d.category_id, 'category_id'),
      location = uuid(d.location_id, 'location_id');
    const occurred = date(d.occurred_on);
    const id = await this.db.transaction(async (client) => {
      await this.catalogsValid(client, category, location);
      return (
        await client.query(
          `INSERT INTO reports(author_id,title,description,report_type,category_id,location_id,occurred_on)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [user, title, description, type, category, location, occurred],
        )
      ).rows[0].id as string;
    });
    return this.detail(id);
  }
  async update(id: string, user: string, input: unknown) {
    const d = fields(input, [
      'title',
      'description',
      'category_id',
      'location_id',
      'occurred_on',
      'status',
    ]);
    if (!Object.keys(d).length)
      throw new BadRequestException('At least one field is required');
    await this.db.transaction(async (client) => {
      const old = await this.owned(client, id, user);
      const title =
        d.title === undefined ? old.title : text(d.title, 'title', 120);
      const description =
        d.description === undefined
          ? old.description
          : text(d.description, 'description', 3000);
      const category =
        d.category_id === undefined
          ? old.category_id
          : uuid(d.category_id, 'category_id');
      const location =
        d.location_id === undefined
          ? old.location_id
          : uuid(d.location_id, 'location_id');
      if (d.category_id !== undefined || d.location_id !== undefined)
        await this.catalogsValid(client, category, location);
      const occurred =
        d.occurred_on === undefined ? old.occurred_on : date(d.occurred_on);
      const status =
        d.status === undefined
          ? old.status
          : choice(d.status, ['open', 'recovered'], 'status');
      await client.query(
        `UPDATE reports SET title=$2,description=$3,category_id=$4,location_id=$5,occurred_on=$6,
    recovered_at=CASE WHEN $7='recovered' THEN COALESCE(recovered_at,now()) ELSE NULL END,status=$7,updated_at=now() WHERE id=$1`,
        [id, title, description, category, location, occurred, status],
      );
    });
    return this.detail(id);
  }
  async remove(id: string, user: string) {
    await this.db.transaction(async (client) => {
      await this.owned(client, id, user);
      await client.query(
        'UPDATE reports SET deleted_at=now(),updated_at=now() WHERE id=$1',
        [id],
      );
      await client.query('DELETE FROM report_images WHERE report_id=$1', [id]);
    });
    return { success: true };
  }
}
