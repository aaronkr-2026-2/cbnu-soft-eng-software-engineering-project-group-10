import {performance} from 'node:perf_hooks';
const base=new URL(process.env.BENCHMARK_URL??'http://127.0.0.1:3101');
if(!['127.0.0.1','localhost','[::1]'].includes(base.hostname))throw new Error('Benchmark is restricted to local servers');
const durations=[];let success=0,failures=0;
const raw=process.env.BENCHMARK_REQUESTS??'200';const requests=Number(raw);
if(!/^\d+$/.test(raw)||requests<1||requests>10000)throw new Error('BENCHMARK_REQUESTS must be 1?10000');
for(const concurrency of [1,5,10]) {
 durations.length=0;success=0;failures=0;let next=0;
 await fetch(new URL('/reports?limit=20',base),{signal:AbortSignal.timeout(10000)});
 const start=performance.now();
 await Promise.all(Array.from({length:concurrency},async()=>{
  while(next++<requests){const begin=performance.now();try {const res=await fetch(new URL('/reports?limit=20',base),{signal:AbortSignal.timeout(10000)});await res.arrayBuffer();if(res.ok)success++;else failures++;}catch{failures++;}durations.push(performance.now()-begin);}
 }));
 const seconds=(performance.now()-start)/1000;durations.sort((a,b)=>a-b);
 console.log(JSON.stringify({concurrency,requests,success,failures,seconds,successfulRps:success/seconds,p95Ms:durations[Math.ceil(durations.length*.95)-1]}));
}
