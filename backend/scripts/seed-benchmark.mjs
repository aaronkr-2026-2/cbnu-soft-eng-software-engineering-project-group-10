import {config} from 'dotenv';
import pg from 'pg';
import {randomUUID,randomBytes,scryptSync} from 'node:crypto';
config({path:'.env.test.local',quiet:true});
if(!process.env.DATABASE_URL || !new URL(process.env.DATABASE_URL).pathname.endsWith('_test')) throw new Error('Seed requires a dedicated _test database');
const number=(name,fallback,max)=>{const raw=process.argv.find(v=>v.startsWith('--'+name+'='))?.split('=')[1]??String(fallback);if(!/^\d+$/.test(raw)||Number(raw)<1||Number(raw)>max)throw new Error('Invalid '+name);return Number(raw);};
const users=number('users',500,100000),reports=number('reports',1000,10000);
const run=randomUUID(),salt=randomBytes(16).toString('hex');
const hash='scrypt:'+salt+':'+scryptSync(randomBytes(32),salt,64).toString('hex');
const db=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});
await db.connect();
try {
 await db.query('BEGIN');await db.query("SET LOCAL statement_timeout='120s'");
 await db.query('CREATE TEMP TABLE benchmark_users(id uuid, n integer) ON COMMIT DROP');
 await db.query(`WITH inserted AS (
 INSERT INTO users(email,password_hash) SELECT $1||'-'||n||'@example.invalid',$2 FROM generate_series(1,$3::int) n RETURNING id,email)
 INSERT INTO benchmark_users SELECT id,row_number() OVER(ORDER BY email) FROM inserted`,['bench-'+run,hash,users]);
 await db.query(`INSERT INTO students(user_id,full_name,student_number) SELECT id,'Fictional Benchmark Student',$1||'-'||n FROM benchmark_users`,[run]);
 const category=(await db.query('SELECT id FROM categories WHERE is_active ORDER BY name LIMIT 1')).rows[0]?.id;
 const location=(await db.query('SELECT id FROM locations WHERE is_active ORDER BY name LIMIT 1')).rows[0]?.id;
 if(!category||!location)throw new Error('Run migrations first');
 await db.query(`INSERT INTO reports(author_id,category_id,location_id,report_type,title,description,occurred_on)
 SELECT u.id,$1,$2,CASE WHEN series.n%2=0 THEN 'lost' ELSE 'found' END,
 CASE WHEN series.n%997=0 THEN 'benchmarkneedle ' ELSE '' END || 'Fictional item '||series.n,
 'Synthetic benchmark data; not a real student report.','2026-01-01'::date
 FROM generate_series(1,$3::int) AS series(n) JOIN benchmark_users u ON u.n=((series.n-1)%$4::int)+1`,[category,location,reports,users]);
 await db.query('COMMIT');await db.query('ANALYZE reports');
 console.log(JSON.stringify({run,users,reports,cleanupEmailPrefix:'bench-'+run+'-'}));
} catch(error) {await db.query('ROLLBACK');console.error('Seed failed; transaction rolled back', error.code??'unknown');process.exitCode=1;}
finally {await db.end();}
