/**
 * 直接从源站提取资讯内容，生成 docs/articles.json。
 *
 * 思路（2024-11 更新）：不再依赖 iTab 的"标题+跳转链接"，改为
 *   ① 直抓源站列表页（澎湃/第一财经/华尔街见闻/爱范儿/少数派），拿到文章链接；
 *   ② 对 JS 渲染站点（36氪/虎嗅/机器之心/IT之家/量子位等），用 iTab 榜单拿文章链接；
 *   ③ 逐篇抓取文章页，提取 og:title / og:image / 发布时间 / 完整正文。
 * 前端同源读取 articles.json，资讯流和详情全文都直接展示，无需跳转原文。
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

/* ---------- 源站直抓配置：列表页 + 文章链接模式 + 频道归属 ----------
   life = 社会民生，hot = 时政热点，tech = 科技，finance = 财经，ent = 文娱 */
const DIRECT_SOURCES = [
  /* 社会民生（每个源都验证过正文可提取） */
  { name: '中新网·社会', channel: 'life',    color: '#1e5aa8', list: ['https://www.chinanews.com.cn/society/'],              pat: /\/[a-z]+\/\d{4}\/\d{2}-\d{2}\/\d+\.shtml/g, per: 24 },
  { name: '人民网·社会', channel: 'life',    color: '#b02a1e', list: ['http://society.people.com.cn/'],                     pat: /\/n1\/\d{4}\/\d{4}\/c\d+-\d+\.html/g, titleFrom: 'title', per: 24 },
  { name: '新京报',     channel: 'life',    color: '#c8102e', list: ['https://www.bjnews.com.cn/news/1.html', 'https://www.bjnews.com.cn/'], pat: /\/detail\/\d{16}\.html/g, per: 24 },
  { name: '红星新闻',   channel: 'life',    color: '#d0021b', list: ['https://www.cdsb.com/'],                             pat: /https:\/\/static\.cdsb\.com\/micropub\/Articles\/\d{6}\/[0-9a-f]{32}\.html/g, per: 24 },

  /* 时政热点 */
  { name: '南方都市报', channel: 'hot',     color: '#0b6ec7', list: ['https://www.oeeee.com/'],                            pat: /\/html\/\d{6}\/\d{2}\/\d+\.html/g },
  { name: '澎湃新闻',   channel: 'hot',     color: '#d4442b', list: ['https://www.thepaper.cn/channel_25950', 'https://www.thepaper.cn/'], pat: /newsDetail_forward_\d+/g },
  { name: '中新网',     channel: 'hot',     color: '#1e5aa8', list: ['https://www.chinanews.com.cn/'],                     pat: /\/[a-z]+\/\d{4}\/\d{2}-\d{2}\/\d+\.shtml/g },
  { name: '中国新闻周刊', channel: 'hot',   color: '#1c4e8a', list: ['https://www.inewsweek.cn/'],                          pat: /\/[a-z]+\/\d{4}-\d{2}-\d{2}\/\d+\.shtml/g },

  /* 文娱 */
  { name: '澎湃·文娱',  channel: 'ent',     color: '#b23a6b', list: ['https://www.thepaper.cn/channel_25953'],             pat: /newsDetail_forward_\d+/g },
  { name: '新京报·娱乐', channel: 'ent',    color: '#c8102e', list: ['https://www.bjnews.com.cn/ent/1.html'],               pat: /\/detail\/\d{16}\.html/g },

  /* 财经 */
  { name: '第一财经',   channel: 'finance', color: '#c8102e', list: ['https://www.yicai.com/'],                            pat: /news\/\d+\.html/g },
  { name: '华尔街见闻', channel: 'finance', color: '#0b5d3b', list: ['https://wallstreetcn.com/'],                         pat: /articles\/\d+/g },
  { name: '界面新闻',   channel: 'finance', color: '#1b4f8f', list: ['https://www.jiemian.com/lists/2.html'],              pat: /\/article\/\d+\.html/g },

  /* 科技 */
  { name: '爱范儿',     channel: 'tech',    color: '#1a6cd6', list: ['https://www.ifanr.com/'],                            pat: /https:\/\/www\.ifanr\.com\/\d{6,}/g },
  { name: '少数派',     channel: 'tech',    color: '#d4483a', list: ['https://sspai.com/'],                                pat: /\/post\/\d+/g }
];

/* ---------- iTab 补充来源：列表页 JS 渲染抓不到，用 iTab 榜单拿文章链接 ---------- */
const ITAB_SOURCES = [
  { name: 'IT之家',   channel: 'tech',    color: '#0a58c9', id: '74Kvx59dkx' },
  { name: '36氪',     channel: 'tech',    color: '#2b7bd4', id: 'Q1Vd5Ko85R' },
  { name: '虎嗅网',   channel: 'tech',    color: '#5a54c9', id: '5VaobgvAj1' },
  { name: '机器之心', channel: 'tech',    color: '#1a1a2e', id: 'DOvnNz1vEB' },
  { name: '量子位',   channel: 'tech',    color: '#0e7a5f', id: 'MZd7azPorO' },
  { name: '少数派·榜', channel: 'tech',   color: '#d4483a', id: 'Y2KeDGQdNP' },
  { name: '开源中国', channel: 'tech',    color: '#2c8a4a', id: 'rYqoXZzdOD' }
];

const PER_SOURCE = 18;   // 每个平台取前 N 篇
const CONCURRENCY = 6;   // 正文抓取并发数
const MIN_BODY = 130;    // 正文少于此字数视为"只有标题"，直接丢弃
const BODY_MAX = 2800;   // 正文截断长度（控制 JSON 体积）
const MAX_AGE_DAYS = 10; // 超过 N 天的旧闻不进流

/* 标题清洗：去掉站点后缀 / 频道前缀 */
function cleanTitle(t) {
  let s = (t || '').replace(/\s+/g, ' ').trim();
  // 人民网等：标题--社会·法治--人民网
  s = s.replace(/\s*(--|——|_|\|)\s*[^\-—|_]{0,10}?(社会|法治|时政|要闻|财经|文化|娱乐|体育|观点|国际|地方|滚动|教育|健康)[·・\w]*\s*(--|——|_|\|).*$/, '');
  // 站点名后缀：标题_央视网 / 标题 - 新京报
  s = s.replace(/\s*[-_|—–]\s*(人民网|新华网|央视网|中国新闻网|中新网|新京报|界面新闻|南方都市报|红星新闻|澎湃新闻|中国新闻周刊).*$/i, '');
  s = s.replace(/^【.*?】\s*/, '');
  return s.trim();
}

/* 正文清洗：去责任编辑行、去重复段落、去短噪音段 */
function cleanBody(raw) {
  const seen = new Set();
  const out = [];
  for (const line of raw.split(/\n+/)) {
    let s = line.replace(/\s+/g, ' ').trim();
    if (!s) continue;
    if (/^(责任编辑|责编|编辑|来源|原标题|本文来源|扫码|下载|返回顶部|分享到|相关阅读|上一篇|下一篇)[:：]?/.test(s)) continue;
    if (/版权所有|未经授权|违法和不良信息|互联网新闻信息服务许可证/.test(s)) continue;
    if (s.length < 12) continue;
    if (seen.has(s)) continue;
    seen.add(s); out.push(s);
  }
  return out.join('\n');
}

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
async function fetchHtml(url, timeout = 15000, retry = 1) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeout);
  try {
    const r = await fetch(url, { signal: c.signal, headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    let buf = Buffer.from(await r.arrayBuffer());
    const head = buf.subarray(0, 3000).toString('latin1');
    if (/charset=["']?(gb2312|gbk|gb18030)/i.test(head)) {
      try { buf = Buffer.from(new TextDecoder('gb18030').decode(buf), 'utf8'); } catch {}
    }
    return buf.toString('utf8');
  } catch (e) {
    clearTimeout(t);
    if (retry > 0) { await new Promise(r => setTimeout(r, 900)); return fetchHtml(url, timeout, retry - 1); }
    return null;
  } finally { clearTimeout(t); }
}

/* 依据域名选正文容器，再退回通用 <p> 拼接 */
function blockText($, $el) {
  const ps = $el.find('p, h2, h3, blockquote, li')
    .map((i, e) => $(e).text().replace(/\s+/g, ' ').trim())
    .get().filter(s => s.length > 15);
  if (ps.length >= 2) return ps.join('\n');
  return $el.text().replace(/\s+/g, ' ').trim();
}
function extractBody($, url) {
  let el = null;
  try {
    if (/ithome\.com/.test(url)) el = $('#paragraph, .post_content, .content');
    else if (/36kr\.com/.test(url)) el = $('.article-content, article, .content-detail, .articleDetailContent');
    else if (/sspai\.com/.test(url)) el = $('.article-content, article, .content');
    else if (/huxiu\.com/.test(url)) el = $('.article-content-wrap, .article__content, article');
    else if (/juejin\.cn/.test(url)) el = $('.markdown-body, article');
    else if (/jiqizhixin\.com|qbitai\.com/.test(url)) el = $('.article-content, article, .rich_media_content, .content');
    else if (/yicai\.com/.test(url)) el = $('#to_content, .article-content, .content');
    else if (/wallstreetcn\.com/.test(url)) el = $('.article__content__, article, .content');
    else if (/thepaper\.cn/.test(url)) el = $('.index_centent_wrap, #article-content, .news_txt, .newsdetail-content');
    else if (/chinanews\.com\.cn/.test(url)) el = $('.left_zw, #cont_1_1_2, .content');
    else if (/people\.com\.cn/.test(url)) el = $('.rm_txt_con, #rwb_zw, .content');
    else if (/bjnews\.com\.cn/.test(url)) el = $('.article, article, .content');
    else if (/cdsb\.com/.test(url)) el = $('article, .article, .content');
    else if (/oeeee\.com/.test(url)) el = $('.content, article, .article');
    else if (/jiemian\.com/.test(url)) el = $('.article-content, .content, article');
    else if (/ifanr\.com/.test(url)) el = $('.article-content, .entry-content, article');
    else if (/infzm\.com/.test(url)) el = $('.article-content, article, .content');
    else if (/toutiao\.com/.test(url)) el = $('.article-content, article');
    else if (/qq\.com/.test(url)) el = $('.content-article, #ArticleContent, article');
    else if (/github\.com/.test(url)) el = $('article, .markdown-body');
    if (el && el.length) {
      const txt = blockText($, el.first());
      if (txt.length >= MIN_BODY) return txt.slice(0, BODY_MAX);
    }
  } catch {}
  const ps = $('p').map((i, e) => $(e).text().replace(/\s+/g, ' ').trim()).get().filter(s => s.length > 18);
  return ps.join('\n').slice(0, BODY_MAX);
}

/* 从文章页提取元信息：标题 / 封面 / 发布时间 */
const BAD_IMG = /(logo|icon|avatar|qrcode|share|copyright|arrow|mask|blank|placeholder|head\.jpg|fileftp\/20(1\d|2[0-5])\/)/i;
function extractMeta($, html, url, opts = {}) {
  let title = cleanTitle($('meta[property="og:title"]').attr('content')
    || $('meta[property="twitter:title"]').attr('content')
    || $('h1').first().text());
  // og:title 缺失（人民网等）时用 <title>
  if (!title || title.length < 6) title = cleanTitle($('title').text());
  let img = $('meta[property="og:image"]').attr('content') || $('meta[itemprop="image"]').attr('content') || '';
  if (img && BAD_IMG.test(img)) img = '';
  // 无 og:image 时取正文/文章页首图（中新网、周刊、第一财经、量子位等）
  if (!img) {
    const scopes = [$('article img, .article img, .article-content img, .detail img'),
      $('.left_zw img, #cont_1_1_2 img, .post_body img, .rm_txt_con img'),
      $('.content img'), $('img')];
    for (const scope of scopes) {
      if (img || !scope.length) continue;
      scope.each((i, e) => {
        if (img) return;
        const s = $(e).attr('src') || $(e).attr('data-src') || $(e).attr('data-original') || '';
        if (!s || !/\.(jpe?g|png|webp)/i.test(s)) return;
        if (BAD_IMG.test(s)) return;
        const w = parseInt($(e).attr('width') || '0', 10);
        if (w && w < 200) return;
        img = s;
      });
    }
  }
  if (img && img.startsWith('//')) img = 'https:' + img;
  else if (img && img.startsWith('/')) { try { img = new URL(url).origin + img; } catch {} }
  // https 页面里的 http 图片会被浏览器按混合内容拦截（人民网图床不支持 https），直接不用
  if (/^http:\/\//i.test(img)) img = '';
  if (img && BAD_IMG.test(img)) img = '';
  let time = $('meta[property="article:published_time"]').attr('content')
    || $('meta[itemprop="datePublished"]').attr('content')
    || $('meta[name="publishdate"], meta[name="pubdate"], meta[name="date"]').attr('content') || '';
  if (!time) {
    const m = html.match(/(20\d{2}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    if (m) time = `${m[1]} ${m[2]}`;
  }
  return { title: title.trim(), img: (img || '').trim(), time: (time || '').trim() };
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

/* 旧闻过滤：超过 MAX_AGE_DAYS 的丢弃；时间解析不出时保留 */
function tooOld(time) {
  if (!time) return false;
  const d = new Date(String(time).replace(' ', 'T'));
  if (isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() > MAX_AGE_DAYS * 86400000;
}

async function main() {
  const jobs = [];

  /* ① 直抓源站列表页拿文章链接（支持多个列表页回退） */
  console.log('[fetch-articles] ① 直抓源站列表页…');
  for (const s of DIRECT_SOURCES) {
    const lists = Array.isArray(s.list) ? s.list : [s.list];
    let links = [];
    for (const listUrl of lists) {
      const html = await fetchHtml(listUrl);
      if (!html) { console.log(`  ${s.name}: ${listUrl} 抓取失败`); continue; }
      const origin = new URL(listUrl).origin;
      const found = new Set();
      for (const m of html.matchAll(s.pat)) {
        let link = m[0];
        if (!/^https?:/.test(link)) link = origin + (link.startsWith('/') ? '' : '/') + link;
        found.add(link);
      }
      links = [...found].slice(0, s.per || PER_SOURCE);
      console.log(`  ${s.name}: ${links.length} 篇文章链接（${listUrl}）`);
      if (links.length >= 6) break;
    }
    links.forEach(l => jobs.push({ name: s.name, channel: s.channel, color: s.color, link: l, titleFrom: s.titleFrom }));
  }

  /* ② iTab 榜单补充 JS 渲染站点的文章链接 */
  console.log('[fetch-articles] ② iTab 榜单补充文章链接…');
  for (const s of ITAB_SOURCES) {
    const json = await getJSON(`${API}/api/top/list?lang=cn&id=${encodeURIComponent(s.id)}&size=${PER_SOURCE}`);
    const data = json?.code === 200 && Array.isArray(json.data) ? json.data : [];
    let n = 0;
    for (const row of data) {
      const link = row.link || '';
      if (!/^https?:/.test(link)) continue;
      // 搜索页/话题页无单一正文，跳过
      if (/\/(search|weibo\?|s\?wd=|topic_innerflow)/.test(link) || /s\.weibo\.com|baidu\.com\/s\?/.test(link)) continue;
      jobs.push({ name: s.name, channel: s.channel, color: s.color, link, titleHint: row.title });
      n++;
    }
    console.log(`  ${s.name}: ${n} 篇文章链接`);
  }

  // 去重（按链接）
  const seen = new Map();
  for (const j of jobs) if (!seen.has(j.link)) seen.set(j.link, j);
  const list = [...seen.values()];
  console.log(`[fetch-articles] 待抓正文 ${list.length} 篇（并发 ${CONCURRENCY}）`);

  /* ③ 逐篇抓取文章页：标题 / 封面 / 时间 / 正文；抓不到正文或太旧的直接丢弃 */
  const results = await mapLimit(list, CONCURRENCY, async (job) => {
    const html = await fetchHtml(job.link);
    if (!html) return null;
    const $ = cheerio.load(html);
    $('script,style,nav,footer,header,aside,noscript,iframe,form').remove();
    const meta = extractMeta($, html, job.link, { titleFrom: job.titleFrom });
    const body = cleanBody(extractBody($, job.link));
    if (body.length < MIN_BODY) return null;          // 只有标题 / 正文是导航渣 → 丢弃
    if (tooOld(meta.time)) return null;                // 旧闻 → 丢弃
    const title = (meta.title || job.titleHint || '').trim();
    if (title.length < 6) return null;
    return { ...job, title, img: meta.img, time: meta.time, body };
  });

  /* ④ 生成 JSON：按 link 索引；标题也建索引，供热榜标题反查 */
  const map = {};
  const byTitle = {};
  let okCount = 0;
  const chans = { life: 0, hot: 0, ent: 0, finance: 0, tech: 0 };
  for (const r of results) {
    if (!r || !r.title) continue;
    okCount++;
    chans[r.channel] = (chans[r.channel] || 0) + 1;
    map[r.link] = {
      title: r.title, source: r.name, channel: r.channel,
      body: r.body.slice(0, BODY_MAX),
      img: r.img || '', time: r.time || '', updatedAt: Date.now()
    };
    byTitle[r.title] = r.link;
  }
  const payload = { generatedAt: Date.now(), count: okCount, channels: chans, byTitle, articles: map };
  writeFileSync(OUT, JSON.stringify(payload), 'utf8');
  console.log(`[fetch-articles] 完成：${okCount}/${list.length} 篇有正文 → ${OUT}`);
  console.log(`  频道分布: ${JSON.stringify(chans)}`);
}
main().catch(e => { console.error('[fetch-articles] 失败:', e); process.exit(1); });
