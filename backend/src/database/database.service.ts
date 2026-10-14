import 'dotenv/config';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';

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
      throw new Error('DATABASE_URL is required. Configure backend/.env first.');
    }
    this.connectionPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
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
      throw new Error('PostgreSQL connection failed. Check DATABASE_URL, TLS and network access.');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.connectionPool?.end();
  }
}
