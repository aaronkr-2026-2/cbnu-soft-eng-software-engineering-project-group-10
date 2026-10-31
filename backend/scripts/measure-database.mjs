import {config} from 'dotenv';
import pg from 'pg';
import os from 'node:os';
config({path:'.env.test.local',quiet:true});
if(!process.env.DATABASE_URL || !new URL(process.env.DATABASE_URL).pathname.endsWith('_test')) throw new Error('Measurement requires a dedicated _test database');
const db=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});await db.connect();
try {
 const counts=(await db.query('SELECT (SELECT count(*) FROM users) AS users,(SELECT count(*) FROM reports) AS reports')).rows[0];
 const sizes=(await db.query(`SELECT relname,pg_total_relation_size(relid)::bigint AS total_bytes,pg_indexes_size(relid)::bigint AS index_bytes FROM pg_catalog.pg_statio_user_tables ORDER BY relname`)).rows;
 const plan=(await db.query(`EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id,created_at FROM reports
 WHERE deleted_at IS NULL AND to_tsvector('simple',title||' '||description) @@ plainto_tsquery('simple',$1)
 ORDER BY created_at DESC,id DESC LIMIT 21`,['benchmarkneedle'])).rows[0]['QUERY PLAN'];
 console.log(JSON.stringify({time:new Date().toISOString(),platform:os.platform(),cpu:os.cpus()[0]?.model,cores:os.cpus().length,totalMemory:os.totalmem(),counts,sizes,plan},null,2));
} finally {await db.end();}
