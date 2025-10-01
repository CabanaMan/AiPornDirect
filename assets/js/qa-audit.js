#!/usr/bin/env node
const https=require('https'); const fs=require('fs'); const {URL}=require('url');
const base=(process.argv[process.argv.indexOf('--base')+1]||'https://aiporndirect.com').replace(/\/+$/,'');
const seen=new Set(), errs=[], dups=[], thin=[]; const titles=new Map(), descs=new Map();
function get(u){return new Promise((res,rej)=>{https.get(new URL(u),(r)=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>res({s:r.statusCode,h:r.headers,t:b}));}).on('error',rej);});}
function links(html){const rx=/href="(\/[^"#?]+\/?)"/g;const L=new Set();let m;while((m=rx.exec(html)))L.add(base+m[1]);return [...L];}
function words(h){return h.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').length;}
async function crawl(u){
  if(seen.has(u))return; seen.add(u);
  const r=await get(u); if(r.s>=400){errs.push({u,issue:r.s}); return;}
  const h=r.t||'';
  const h1=(h.match(/<h1\b/gi)||[]).length; if(h1!==1) errs.push({u,issue:`H1=${h1}`});
  const title=(h.match(/<title>(.*?)<\/title>/i)||[])[1]||''; const desc=(h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)||[])[1]||'';
  const canon=(h.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)||[])[1]||'';
  if(!canon) errs.push({u,issue:'no-canonical'}); if(!desc) errs.push({u,issue:'no-description'});
  if(title){ if(titles.has(title)) dups.push({u,of:titles.get(title),field:'title'}); else titles.set(title,u); }
  if(desc){ if(descs.has(desc)) dups.push({u,of:descs.get(desc),field:'description'}); else descs.set(desc,u); }
  if(words(h)<200) thin.push({u,w:words(h)});
  await Promise.all(links(h).filter(x=>x.startsWith(base)).map(crawl));
}
(async()=>{
  await crawl(base+'/');
  fs.writeFileSync('errors.csv','url,issue\n'+errs.map(e=>`${e.u},${e.issue}`).join('\n'));
  fs.writeFileSync('duplicates.csv','url,duplicate_of,field\n'+dups.map(d=>`${d.u},${d.of},${d.field}`).join('\n'));
  fs.writeFileSync('thin.csv','url,word_count\n'+thin.map(t=>`${t.u},${t.w}`).join('\n'));
  console.log('QA: errors.csv, duplicates.csv, thin.csv');
})();
