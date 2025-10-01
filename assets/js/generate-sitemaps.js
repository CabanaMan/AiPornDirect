#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const args=process.argv; const base=(args[args.indexOf('--base')+1]||'https://aiporndirect.com').replace(/\/+$/,'');
const outRoot=process.cwd();
function iso(){return new Date().toISOString().slice(0,10);}
function slugify(s){return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');}
function collect(){
  const urls=new Set([`${base}/`]);
  const d=path.join(outRoot,'data');
  if(fs.existsSync(d)){
    for(const f of fs.readdirSync(d).filter(x=>x.endsWith('.json'))){
      try{
        const j=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));
        const push=(p,v)=>{if(!v)return; urls.add(`${base}/${p}/${slugify(v)}/`);};
        (j.categories||[]).forEach(x=>push('category',x.slug||x.name));
        (j.tags||[]).forEach(x=>push('tag',x.slug||x.name));
        (j.vendors||[]).forEach(x=>push('vendor',x.slug||x.name));
        (j.guides||[]).forEach(x=>push('guide',x.slug||x.title));
      }catch(_){}}
  }
  return Array.from(urls);
}
function writeSet(file,urls){
  const today=iso();
  const xml=['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u=>`  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`),
    '</urlset>'].join('\n');
  fs.writeFileSync(path.join(outRoot,file),xml,'utf8');
}
(function main(){
  const all=collect();
  if(all.length>50000){
    const parts=[]; while(all.length) parts.push(all.splice(0,49000));
    const today=iso();
    const idx=['<?xml version="1.0" encoding="UTF-8"?>','<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
    parts.forEach((p,i)=>{
      const fn=`sitemap-${i+1}.xml`; writeSet(fn,p);
      idx.push(`  <sitemap><loc>${base}/${fn}</loc><lastmod>${today}</lastmod></sitemap>`);
    });
    idx.push('</sitemapindex>');
    fs.writeFileSync(path.join(outRoot,'sitemap-index.xml'),idx.join('\n'),'utf8');
    console.log('Wrote sitemap-index.xml + parts');
  }else{
    writeSet('sitemap.xml',all);
    console.log('Wrote sitemap.xml with',all.length,'URLs');
  }
})();
