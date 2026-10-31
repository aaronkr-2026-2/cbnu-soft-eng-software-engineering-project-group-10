import {config} from 'dotenv';import pg from 'pg';
config({path:'.env.test.local',quiet:true});
if(!process.env.DATABASE_URL || !new URL(process.env.DATABASE_URL).pathname.endsWith('_test'))throw new Error('Dedicated _test database required');
const run=process.argv.find(v=>v.startsWith('--run='))?.slice(6);
if(!run || !/^[a-f0-9-]{36}$/.test(run))throw new Error('Pass the run UUID printed by seed:benchmark');
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
try {
 await db.query('BEGIN');
 const users=(await db.query('SELECT id FROM users WHERE email LIKE $1',['bench-'+run+'-%@example.invalid'])).rows.map(u=>u.id);
 await db.query('DELETE FROM conversations WHERE report_id IN (SELECT id FROM reports WHERE author_id=ANY($1::uuid[]))',[users]);
 await db.query('DELETE FROM reports WHERE author_id=ANY($1::uuid[])',[users]);
 await db.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[users]);
 await db.query('COMMIT');console.log('Removed synthetic users and their reports:',users.length);
} catch {await db.query('ROLLBACK');console.error('Cleanup failed; rolled back');process.exitCode=1;}finally{await db.end();}
