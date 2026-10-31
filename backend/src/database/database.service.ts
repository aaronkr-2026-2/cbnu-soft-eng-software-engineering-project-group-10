import 'dotenv/config';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool, type PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private connectionPool?: Pool;

  get pool(): Pool {
    if (!this.connectionPool) {
      throw new Error('Database is not connected');
    }
    return this.connectionPool;
  }

  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL is required. Configure backend/.env first.',
      );
    }
    this.connectionPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      statement_timeout: 10000,
      idle_in_transaction_session_timeout: 15000,
    });
    this.connectionPool.on('error', () => {
      this.logger.error('An idle PostgreSQL connection failed');
    });
    try {
      await this.pool.query('SELECT 1');
      this.logger.log('PostgreSQL connected');
    } catch {
      await this.connectionPool.end();
      this.connectionPool = undefined;
      throw new Error(
        'PostgreSQL connection failed. Check DATABASE_URL, TLS and network access.',
      );
    }
  }

  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.connectionPool?.end();
  }
}
