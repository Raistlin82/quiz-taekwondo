import { chromium } from 'playwright';
const b = await chromium.launch({ channel:'chrome-beta', headless:true });
const p = await b.newPage({ viewport:{width:480,height:1100}, deviceScaleFactor:2 });
const writes=[]; const errs=[];
p.on('request', r=>{ const u=r.url(); const m=r.request?.()?.method?.()||r.method(); if(m==='POST' && (u.includes('/rest/v1/scores')||u.includes('/rest/v1/profiles')||u.includes('/rest/v1/rpc/increment_profile_run'))) writes.push(`${m} ${u.split('supabase.co')[1].split('?')[0]}`); });
p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:5173/', { waitUntil:'networkidle' });
await p.waitForTimeout(2500); // anon session
await p.locator('.name-box').fill('__smoketest__');
await p.getByRole('button',{name:/Inizia il quiz/i}).click();
await p.waitForTimeout(700);
for (let n=0;n<20;n++){ const a=p.locator('.ans').first(); if(await a.count()===0)break; await a.click().catch(()=>{}); await p.waitForTimeout(200); const nx=p.locator('.next-btn'); if(await nx.count()){await nx.click().catch(()=>{});await p.waitForTimeout(240);} if(await p.locator('.end-title').count())break; }
await p.waitForTimeout(2500);
const guestNote = await p.locator('.guest-note').count();
console.log('ONLINE WRITES by guest (expected NONE):', writes.length?JSON.stringify(writes):'none ✓');
console.log('guest-note shown on EndScreen:', guestNote);
console.log('pageerrors:', errs.length?JSON.stringify(errs):'none');
await b.close();
