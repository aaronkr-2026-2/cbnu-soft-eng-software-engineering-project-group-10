import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { DatabaseService } from '../database/database.service.js';
import { object, text } from '../common/input.js';
const derive = promisify(scrypt);
const digest = (token: string) =>
  createHash('sha256').update(token).digest('hex');
@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}
  private credentials(input: unknown) {
    const data = object(input);
    const email = text(data.email, 'email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new BadRequestException('Invalid email');
    if (
      typeof data.password !== 'string' ||
      data.password.length < 12 ||
      data.password.length > 128
    )
      throw new BadRequestException('Password must be 12-128 characters');
    return { data, email, password: data.password };
  }
  async register(input: unknown) {
    const { data, email, password } = this.credentials(input);
    const fullName = text(data.full_name, 'full_name', 100);
    const studentNumber = text(data.student_number, 'student_number', 50);
    const salt = randomBytes(16).toString('hex');
    const hash = ((await derive(password, salt, 64)) as Buffer).toString('hex');
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'INSERT INTO users(email,password_hash) VALUES ($1,$2) RETURNING id,email',
        [email, `scrypt:${salt}:${hash}`],
      );
      await client.query(
        'INSERT INTO students(user_id,full_name,student_number) VALUES ($1,$2,$3)',
        [rows[0].id, fullName, studentNumber],
      );
      await client.query('COMMIT');
      return { ...rows[0], full_name: fullName, student_number: studentNumber };
    } catch (error) {
      await client.query('ROLLBACK');
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException(
          'Email or student number already registered',
        );
      throw error;
    } finally {
      client.release();
    }
  }
  async login(input: unknown) {
    const { email, password } = this.credentials(input);
    const { rows } = await this.db.pool.query(
      'SELECT id,password_hash FROM users WHERE lower(trim(email))=$1',
      [email],
    );
    const user = rows[0];
    const [, salt, expected] = user?.password_hash?.split(':') ?? [
      'scrypt',
      '00000000000000000000000000000000',
      '00'.repeat(64),
    ];
    const actual = (await derive(password, salt, 64)) as Buffer;
    const expectedBytes = Buffer.from(expected, 'hex');
    if (
      !user ||
      actual.length !== expectedBytes.length ||
      !timingSafeEqual(actual, expectedBytes)
    )
      throw new UnauthorizedException('Invalid email or password');
    const token = randomBytes(32).toString('hex');
    await this.db.pool.query(
      "INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '24 hours')",
      [digest(token), user.id],
    );
    return { access_token: token, token_type: 'Bearer', expires_in: 86400 };
  }
  async authenticate(header?: string) {
    const token = header?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
    if (!token) throw new UnauthorizedException('Bearer token required');
    const { rows } = await this.db.pool.query(
      `SELECT u.id FROM auth_sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND s.expires_at>now()`,
      [digest(token)],
    );
    if (!rows[0]) throw new UnauthorizedException('Session expired or invalid');
    return rows[0].id as string;
  }
  async logout(header?: string) {
    await this.authenticate(header);
    await this.db.pool.query('DELETE FROM auth_sessions WHERE token_hash=$1', [
      digest(header!.slice(7)),
    ]);
    return { success: true };
  }
  async me(header?: string) {
    const id = await this.authenticate(header);
    return (
      await this.db.pool.query(
        'SELECT u.id,u.email,s.full_name,s.student_number FROM users u JOIN students s ON s.user_id=u.id WHERE u.id=$1',
        [id],
      )
    ).rows[0];
  }
}
