/**
 * 抓取 iTab 榜单文章的正文，生成 docs/articles.json。
 *
 * iTab 的 /api/top/list 只返回「标题 + 热度 + 链接」，不含正文。
 * 本脚本根据链接抓取原文页并用 cheerio 提取正文，产出静态 JSON。
 * 前端（同源读取 articles.json）按 link 匹配显示真实正文，规避浏览器 CORS 限制。
 *
 * 用法：node scripts/fetch-articles.mjs
 * 由 GitHub Actions 定时运行（低频），无需出 IPA。
 */
import * as cheerio from 'cheerio';
import CryptoJS from 'crypto-js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'articles.json');

const API = 'https://base.itab.link';
const VERSION = '2.4.12';
const SECRET = 'itab1314';
const FP = 'inews-article-fetch';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

/* 抓取范围：iTab 真实平台 ID -> 展示名。聚焦有真实文章页的新闻/科技/财经源。 */
const SOURCES = [
  ['ithome', 'IT之家', '74Kvx59dkx'],
  ['kr36', '36氪', 'Q1Vd5Ko85R'],
  ['sspai', '少数派', 'Y2KeDGQdNP'],
  ['huxiu', '虎嗅网', '5VaobgvAj1'],
  ['juejin', '掘金', 'rYqoXz8dOD'],
  ['jiqizhixin', '机器之心', 'DOvnNz1vEB'],
  ['qbitai', '量子位', 'MZd7azPorO'],
  ['readhub', 'Readhub', 'b0vmrPldB1'],
  ['xueqiu', '雪球', 'X12owXzvNV'],
  ['yicai', '第一财经', '0MdKam4ow1'],
  ['wallstreetcn', '华尔街见闻', 'G2me3ndwjq'],
  ['oschina', '开源中国', 'rYqoXZzdOD'],
  ['csdn', 'CSDN', 'DgeyrgMoZq'],
  ['github', 'GitHub', 'rYqoXQ8vOD'],
  ['toutiao', '今日头条', 'toutiao'],
  ['qqnews', '腾讯新闻', '12owgX0oNV'],
  ['ifanr', '爱范儿', 'Jndkp4ye3V'],
  ['github2', '开源中国·资讯', 'rYqoXZzdOD']
];
const PER_SOURCE = 12;   // 每个平台取前 N 条
const CONCURRENCY = 6;   // 正文抓取并发数
const MIN_BODY = 60;     // 正文少于此字数视为抓取失败

function sign() {
  return CryptoJS.AES.encrypt(Date.now().toString(), SECRET).toString();
}
async function getJSON(url, timeout = 12000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeout);
  try {
    const r = await fetch(url, { signal: c.signal, headers: { signaturekey: sign(), version: VERSION, mode: 'itab', fp: FP } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; } finally { clearTimeout(t); }
}
async function fetchHtml(url, timeout = 15000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeout);
  try {
    const r = await fetch(url, { signal: c.signal, headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' } });
    if (!r.ok) return null;
    let buf = Buffer.from(await r.arrayBuffer());
    const head = buf.subarray(0, 3000).toString('latin1');
    if (/charset=["']?(gb2312|gbk|gb18030)/i.test(head)) {
      try { buf = Buffer.from(new TextDecoder('gb18030').decode(buf), 'utf8'); } catch {}
    }
    return buf.toString('utf8');
  } catch { return null; } finally { clearTimeout(t); }
}

/* 依据域名选正文容器，再退回通用 <p> 拼接 */
function extractBody(html, url) {
  if (!html) return '';
  const $ = cheerio.load(html);
  $('script,style,nav,footer,header,aside,noscript,iframe,form').remove();
  let el = null;
  try {
    if (/ithome\.com/.test(url)) el = $('#paragraph, .post_content, .content');
    else if (/36kr\.com/.test(url)) el = $('.article-content, article, .content-detail');
    else if (/sspai\.com/.test(url)) el = $('.article-content, article');
    else if (/huxiu\.com/.test(url)) el = $('.article-content, article, .content');
    else if (/juejin\.cn/.test(url)) el = $('.article-content, article');
    else if (/jiqizhixin\.com|qbitai\.com/.test(url)) el = $('.article-content, article, .rich_media_content');
    else if (/yicai\.com|wallstreetcn\.com/.test(url)) el = $('.article-content, article, .rich_media_content');
    else if (/github\.com/.test(url)) el = $('article, .markdown-body');
    else if (/toutiao\.com/.test(url)) el = $('.article-content, article');
    if (el && el.length) {
      const txt = el.first().text().replace(/\s+/g, ' ').trim();
      if (txt.length >= MIN_BODY) return txt.slice(0, 6000);
    }
  } catch {}
  const ps = $('p').map((i, e) => $(e).text().replace(/\s+/g, ' ').trim()).get().filter(s => s.length > 18);
  return ps.join('\n').slice(0, 6000);
}

/* 简单并发池 */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let idx = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      try { out[i] = await fn(items[i], i); } catch { out[i] = null; }
    }
  }));
  return out;
}

async function main() {
  console.log('[fetch-articles] 开始拉取 iTab 榜单…');
  const jobs = [];
  for (const [key, name, id] of SOURCES) {
    const json = await getJSON(`${API}/api/top/list?lang=cn&id=${encodeURIComponent(id)}&size=${PER_SOURCE}`);
    const data = json?.code === 200 && Array.isArray(json.data) ? json.data : [];
    for (const row of data) {
      const link = row.link || '';
      if (!/^https?:/.test(link)) continue;
      // 搜索页/话题页无单一正文，跳过（保留在榜单里，前端会显示"阅读原文"）
      if (/\/(search|weibo\?|s\?wd=|topic_innerflow)/.test(link) || /s\.weibo\.com|baidu\.com\/s\?/.test(link)) continue;
      jobs.push({ key, name, title: row.title, link });
    }
  }
  console.log(`[fetch-articles] 待抓正文 ${jobs.length} 篇（并发 ${CONCURRENCY}）`);

  const results = await mapLimit(jobs, CONCURRENCY, async (job) => {
    const html = await fetchHtml(job.link);
    const body = extractBody(html, job.link);
    return { ...job, body, ok: body.length >= MIN_BODY };
  });

  const map = {};
  let okCount = 0;
  for (const r of results) {
    if (!r?.ok) continue;
    okCount++;
    // 用 link 作 key，前端按 link 精确匹配
    map[r.link] = { title: r.title, source: r.name, body: r.body.slice(0, 3000), updatedAt: Date.now() };
  }
  const payload = { generatedAt: Date.now(), count: okCount, articles: map };
  writeFileSync(OUT, JSON.stringify(payload), 'utf8');
  console.log(`[fetch-articles] 完成：${okCount}/${jobs.length} 篇有正文 → ${OUT}`);
}
main().catch(e => { console.error('[fetch-articles] 失败:', e); process.exit(1); });
