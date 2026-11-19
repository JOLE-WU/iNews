import * as cheerio from 'cheerio';
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
const c=[['新浪社会','https://news.sina.com.cn/society/',/\/\d{4}-\d{2}-\d{2}\/doc-[a-z0-9]+\.shtml/g],
 ['网易社会','https://news.163.com/society/',/\/\d{2}\/\d{4}\/\d{2}\/[A-Z0-9]+\.html/g],
 ['腾讯社会','https://news.qq.com/zt2020/page/feiyan.htm',/\/rain\/a\/\d{8}\/\d+\.html/g]];
for(const [n,u,p] of c){
  try{const r=await fetch(u,{headers:{'User-Agent':UA}});const h=await r.text();
   const links=[...new Set([...h.matchAll(p)].map(m=>m[0]))].slice(0,3);
   console.log('##',n,r.status,h.length,'links',links.length,[...new Set([...h.matchAll(p)].map(m=>m[0]))].length);
   if(links.length){
     const l=links[0].startsWith('http')?links[0]:new URL(u).origin+links[0];
     const h2=await (await fetch(l,{headers:{'User-Agent':UA}})).text();
     const $=cheerio.load(h2);
     const ps=$('p').map((i,e)=>$(e).text().replace(/\s+/g,' ').trim()).get().filter(s=>s.length>18);
     const t=$('meta[property="og:title"]').attr('content')||$('h1').first().text().trim();
     console.log('   文章:',(t||'?').slice(0,30),'| p',ps.length,'| 字数',ps.join('').length);
   }
  }catch(e){console.log(n,'ERR',e.message.slice(0,40))}
}
