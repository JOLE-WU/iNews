/* =========================================================
   热榜 · 资讯聚合  —  交互逻辑
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- 热榜垂类（对应 iTab /api/top/category 的 12 个分类） ---------- */
const CATEGORIES = [
  { key: 'all',      name: '全部',     icon: '✦' },
  { key: 'general',  name: '综合',     icon: '🌐' },
  { key: 'tech',     name: '科技',     icon: '💻' },
  { key: 'ent',      name: '娱乐',     icon: '🎬' },
  { key: 'community',name: '社区',     icon: '💬' },
  { key: 'shopping', name: '购物',     icon: '🛍️' },
  { key: 'finance',  name: '财经',     icon: '📈' },
  { key: 'edu',      name: '大学',     icon: '🎓' },
  { key: 'daily',    name: '日报',     icon: '📰' },
  { key: 'local',    name: '地方门户', icon: '📍' },
  { key: 'film',     name: '影视',     icon: '🎞️' },
  { key: 'reading',  name: '阅读',     icon: '📚' }
];

/* ---------- 平台池：配置驱动，对齐 iTab topSearch[] + DailyHotApi 路由 ----------
   字段：name 名称 / short 图标字 / color 品牌色 / cat 所属垂类 / api 对应数据源标识
   平台数量 40+，全部可通过 /api/top/list?id=... 拉取真实数据（此处用演示数据） */
const PLATFORMS = {
  weibo:      { name:'微博热搜',   short:'微', color:'#e6162d', cat:'general',   api:'weibo' },
  baidu:      { name:'百度热搜',   short:'百', color:'#2932e1', cat:'general',   api:'baidu' },
  toutiao:    { name:'今日头条',   short:'头', color:'#f04142', cat:'general',   api:'toutiao' },
  douyin:     { name:'抖音热点',   short:'抖', color:'#161823', cat:'general',   api:'douyin' },
  kuaishou:   { name:'快手热点',   short:'快', color:'#ff4906', cat:'general',   api:'kuaishou' },
  qqnews:     { name:'腾讯新闻',   short:'腾', color:'#0052d9', cat:'general',   api:'qq-news' },
  netease:    { name:'网易新闻',   short:'网', color:'#d32a2a', cat:'general',   api:'netease-news' },
  thepaper:   { name:'澎湃新闻',   short:'澎', color:'#c8102e', cat:'general',   api:'thepaper' },
  sina:       { name:'新浪新闻',   short:'新', color:'#e60012', cat:'general',   api:'sina-news' },

  zhihu:      { name:'知乎热榜',   short:'知', color:'#0066ff', cat:'community', api:'zhihu' },
  tieba:      { name:'百度贴吧',   short:'吧', color:'#4e6ef2', cat:'community', api:'tieba' },
  v2ex:       { name:'V2EX',       short:'V2', color:'#333333', cat:'community', api:'v2ex' },
  ngabbs:     { name:'NGA 热帖',   short:'N',  color:'#ff6600', cat:'community', api:'ngabbs' },
  hupu:       { name:'虎扑步行街', short:'虎', color:'#d2232a', cat:'community', api:'hupu' },
 '52pojie':    { name:'吾爱破解',   short:'吾', color:'#2b7a78', cat:'community', api:'52pojie' },
  doubanGroup:{ name:'豆瓣小组',   short:'豆', color:'#2e963f', cat:'community', api:'douban-group' },

  bilibili:   { name:'哔哩哔哩',   short:'B',  color:'#fb7299', cat:'ent',       api:'bilibili' },
  acfun:      { name:'AcFun',      short:'A',  color:'#ff4a4a', cat:'ent',       api:'acfun' },
  coolapk:    { name:'酷安热榜',   short:'酷', color:'#00a4ff', cat:'ent',       api:'coolapk' },
  miyoushe:   { name:'米游社',     short:'米', color:'#00b3ff', cat:'ent',       api:'miyoushe' },
  genshin:    { name:'原神',       short:'原', color:'#5a6acf', cat:'ent',       api:'genshin' },
  starrail:   { name:'崩坏:星穹铁道',short:'穹',color:'#6c7bd6', cat:'ent',       api:'starrail' },
  lol:        { name:'英雄联盟',   short:'L',  color:'#c8aa6e', cat:'ent',       api:'lol' },

  ithome:     { name:'IT之家',     short:'IT', color:'#0078d7', cat:'tech',      api:'ithome' },
  kr36:       { name:'36氪',       short:'36', color:'#4285f4', cat:'tech',      api:'36kr' },
  sspai:      { name:'少数派',     short:'派', color:'#d71a28', cat:'tech',      api:'sspai' },
  huxiu:      { name:'虎嗅',       short:'嗅', color:'#e8503a', cat:'tech',      api:'huxiu' },
  ifanr:      { name:'爱范儿',     short:'范', color:'#2788d8', cat:'tech',      api:'ifanr' },
  juejin:     { name:'稀土掘金',   short:'掘', color:'#1e80ff', cat:'tech',      api:'juejin' },
  csdn:       { name:'CSDN',       short:'C',  color:'#fc5531', cat:'tech',      api:'csdn' },
  github:     { name:'GitHub',     short:'GH', color:'#24292f', cat:'tech',      api:'github' },
  hellogithub:{ name:'HelloGitHub',short:'HG', color:'#f5a623', cat:'tech',      api:'hellogithub' },

  smzdm:      { name:'什么值得买', short:'值', color:'#e4002b', cat:'shopping',  api:'smzdm' },
  taobao:     { name:'淘宝热卖',   short:'淘', color:'#ff5000', cat:'shopping',  api:'taobao' },
  jd:         { name:'京东热榜',   short:'京', color:'#e1251b', cat:'shopping',  api:'jd' },

  eastmoney:  { name:'东方财富',   short:'东', color:'#e60012', cat:'finance',   api:'eastmoney' },
  xueqiu:     { name:'雪球热帖',   short:'雪', color:'#ff7a00', cat:'finance',   api:'xueqiu' },
  cls:        { name:'财联社',     short:'财', color:'#c8102e', cat:'finance',   api:'cls' },

  pku:        { name:'北大未名BBS', short:'北', color:'#860038', cat:'edu',       api:'pku' },
  thu:        { name:'清华水木BBS', short:'清', color:'#660874', cat:'edu',       api:'thu' },
  zhihuEdu:   { name:'知乎·教育',   short:'教', color:'#0066ff', cat:'edu',       api:'zhihu-edu' },

  zhihuDaily: { name:'知乎日报',   short:'报', color:'#0066ff', cat:'daily',     api:'zhihu-daily' },
  readhub:    { name:'Readhub',    short:'R',  color:'#25b490', cat:'daily',     api:'readhub' },
  splash:     { name:'界面新闻',   short:'界', color:'#1a1a1a', cat:'daily',     api:'jiemian' },

  beijing:    { name:'北京门户',   short:'京', color:'#c7000b', cat:'local',     api:'beijing' },
  shanghai:   { name:'上海门户',   short:'沪', color:'#e60012', cat:'local',     api:'shanghai' },
  guangdong:  { name:'广东门户',   short:'粤', color:'#d81e06', cat:'local',     api:'guangdong' },

  doubanMovie:{ name:'豆瓣电影',   short:'影', color:'#2e963f', cat:'film',      api:'douban-movie' },
  maoyan:     { name:'猫眼票房',   short:'猫', color:'#f03d37', cat:'film',      api:'maoyan' },

  weread:     { name:'微信读书',   short:'读', color:'#1aad19', cat:'reading',   api:'weread' },
  jianshu:    { name:'简书',       short:'简', color:'#ea6f5a', cat:'reading',   api:'jianshu' },
  qidian:     { name:'起点中文网', short:'起', color:'#e60012', cat:'reading',   api:'qidian' }
};

/* 按分类取平台 */
const platformsByCat = cat => cat === 'all'
  ? Object.keys(PLATFORMS)
  : Object.keys(PLATFORMS).filter(k => PLATFORMS[k].cat === cat);

/* ---------- 主力平台精选数据 [标题, 热度(万), 标签, 趋势] ---------- */
const FEATURED_HOT = {
  weibo: [
    ['iPhone 17 系列正式发布', 486.3, 'boom', 'up'],
    ['国庆假期高速免费政策出炉', 392.7, 'hot', '-'],
    ['中国空间站传回高清地球影像', 356.1, 'new', 'up'],
    ['多地迎来今年首场秋雪', 321.5, 'hot', 'down'],
    ['咖啡价格连续三个月下降', 288.4, '', 'up'],
    ['全红婵最新比赛视频', 267.9, '', '-'],
    ['年轻人开始流行城市漫步', 245.6, 'new', 'up'],
    ['国产大模型性能再突破', 231.8, 'boom', 'up'],
    ['秋季电影票房创新高', 209.3, '', '-'],
    ['秋季养生指南请收好', 187.2, 'hot', 'down'],
    ['多地推出育儿补贴政策', 165.4, '', 'up'],
    ['新能源汽车销量创新高', 142.7, '', '-']
  ],
  baidu: [
    ['今日油价调整最新消息', 456.2, 'hot', 'up'],
    ['明天全国天气怎么样', 412.8, '', '-'],
    ['高铁票开售时间查询', 398.5, 'hot', '-'],
    ['个税专项扣除怎么填', 367.1, 'new', 'up'],
    ['全国多地气温骤降', 345.6, '', 'up'],
    ['国庆旅游热门目的地', 328.9, 'hot', '-'],
    ['医保报销新规解读', 297.3, '', '-'],
    ['大学生就业新政出台', 275.8, 'new', 'up'],
    ['台风路径最新预报', 254.1, '', 'down'],
    ['二手房贷款利率走势', 231.6, '', '-'],
    ['快递停运时间查询', 198.4, 'hot', '-'],
    ['养老金调整方案公布', 176.2, '', 'up']
  ],
  bilibili: [
    ['新番先导预告公开', 423.7, 'boom', 'up'],
    ['UP主耗时一年复原古建筑', 389.2, 'hot', '-'],
    ['当 AI 学会了弹钢琴', 356.8, 'new', 'up'],
    ['十分钟看懂量子力学', 334.1, '', '-'],
    ['这部国产动画封神了', 312.6, 'hot', 'up'],
    ['城市夜骑攻略', 289.4, '', 'down'],
    ['手工耿新作：自动炒菜机', 267.3, '', '-'],
    ['我用代码画了一幅画', 245.9, 'new', 'up'],
    ['深夜食堂：一人食', 223.5, '', '-'],
    ['中国航天历程回顾', 201.7, '', 'up'],
    ['古典乐混编挑战', 189.3, '', '-'],
    ['猫咪行为学观察', 167.8, 'new', '-']
  ],
  douyin: [
    ['一支舞带火一座城', 512.4, 'boom', 'up'],
    ['国庆烟花秀预告', 478.6, 'hot', '-'],
    ['普通人如何拍出大片', 432.1, 'new', 'up'],
    ['街头采访：你的梦想', 398.7, '', 'up'],
    ['深夜路灯下的背影', 376.2, '', '-'],
    ['一分钟学做家常菜', 354.9, 'hot', 'up'],
    ['萌宠成精瞬间', 331.5, '', '-'],
    ['汉服变装挑战', 308.7, '', 'up'],
    ['海边日出延时摄影', 286.3, 'new', '-'],
    ['健身打卡第 100 天', 264.1, '', '-'],
    ['老手艺人的一天', 241.8, '', 'down'],
    ['城市地标航拍', 219.6, '', '-']
  ],
  toutiao: [
    ['促消费系列举措发布', 445.8, 'hot', 'up'],
    ['我国科学家取得重大突破', 412.3, 'boom', '-'],
    ['新能源汽车产业报告发布', 389.6, '', 'up'],
    ['秋季房市观察', 367.2, '', 'down'],
    ['数字人民币试点扩大', 345.9, 'new', 'up'],
    ['乡村振兴新进展', 323.5, '', '-'],
    ['人工智能应用白皮书', 301.8, 'hot', '-'],
    ['跨境电商增长数据', 289.4, '', 'up'],
    ['城市轨道交通新线开通', 267.1, 'new', '-'],
    ['全民健身计划实施', 245.6, '', '-'],
    ['养老服务体系完善', 223.9, '', 'up'],
    ['粮食产量再创新高', 201.4, '', '-']
  ]
};

/* ---------- 各垂类话题池：为 40+ 平台生成演示榜单 ---------- */
const TOPIC_POOL = {
  general: ['本轮降温将影响这些地区', '国庆出行大数据出炉', '今日油价迎来新调整', '多地官宣最新政策', '一则暖心新闻刷屏网络', '这份出行指南请收好', '年轻人消费观又变了', '专家回应大众关切', '城市新地标正式开放', '秋招这些岗位最热门', '周末天气一览', '民生新规下月起施行'],
  community: ['如何评价最近这一现象', '求推荐靠谱的入门方案', '聊聊那些被低估的好物', '这个观点你怎么看', '分享一个真实的经历', '新手最容易踩的坑', '大家都在讨论这件事', '来听听过来人的建议', '一个冷知识引发热议', '这种生活方式火了', '帮我看看这个选择', '深夜想一想人生'],
  ent: ['新剧开播口碑如何', '综艺名场面盘点', '这首歌单曲循环了', '演员深夜发文引热议', '这部作品值得满分', '舞台直拍太绝了', '粉丝应援现场直击', '幕后花絮首次公开', '童年回忆再次翻红', '最新路透曝光', '这段对话笑到打鸣', '追剧人的快乐谁懂'],
  tech: ['新品发布会定档', '这个开源项目火了', '一文读懂最新技术趋势', '开发者实测体验报告', '国产替代再进一步', '效率工具推荐清单', '手把手教你上手', '性能对比数据出炉', '行业白皮书发布', '一次线上事故复盘', '新版本更新了什么', '程序员如何应对变化'],
  shopping: ['年度必买清单来了', '这波折扣值得冲', '真实测评：到底好不好用', '囤货指南请查收', '口碑爆款实测', '平价好物合集', '这价格是真的吗', '买前必看避坑帖', '编辑部私藏好物', '换季采购攻略', '性价比之王是它', '限时优惠别错过'],
  finance: ['今日大盘收盘播报', '这个板块领涨', '机构最新观点汇总', '读懂这份财报', '市场情绪出现变化', '资金流向数据解读', '普通人如何配置资产', '分析师给出新目标价', '一场发布会改变行业', '财报季这些看点', '政策利好哪些方向', '数据背后的信号'],
  edu: ['开学季这些事项要注意', '考研报名新变化', '校园招聘时间表', '这份论文上了热搜', '学长学姐经验分享', '保研政策解读', '宿舍神器盘点', '毕业生去向数据', '一门很难的课火了', '学术成果引关注', '校园活动预告', '考试周生存指南'],
  daily: ['今日要闻速览', '一分钟读懂大事', '早晚报精选', '本周热点回顾', '深度长文推荐', '这届年轻人怎么了', '数据里的中国', '一个值得关注的趋势', '世界正在发生什么', '观察：变化正在发生', '人物专访：他们的故事', '值得收藏的深度报道'],
  local: ['本地最新天气预报', '地铁新线进展', '这个周末去哪玩', '本地美食探店合集', 'city walk 路线推荐', '一场活动本周开幕', '周边游好去处', '城市更新新动态', '本地招聘信息', '学区划分公布', '停车新规解读', ' neighborhood 新鲜事'],
  film: ['新片上映口碑出炉', '票房冠军易主', '这份片单请收好', '导演新作引期待', '经典重映门票开售', '演员表现获赞', '周末观影指南', '一部被低估的电影', '影评人打分出炉', '幕后制作揭秘', '续集定档消息', '影展入围名单公布'],
  reading: ['本周必读书单', '这本书读完了吗', '作者线上分享会', '阅读打卡挑战', '一段话让人破防', '书评：值不值得读', '新书抢先看', '不出门也能旅行', '治愈系书单推荐', '经典重读有新解', '读书笔记分享', '这一年读了哪些书']
};

/* 稳定伪随机：让每个平台的热度/标签固定不变 */
function seeded(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* 为所有平台生成 HOT_DATA；主力平台用精选数据，其余按垂类池生成 */
const HOT_DATA = (() => {
  const data = {};
  Object.entries(PLATFORMS).forEach(([key, p]) => {
    if (FEATURED_HOT[key]) { data[key] = FEATURED_HOT[key]; return; }
    const pool = TOPIC_POOL[p.cat] || TOPIC_POOL.general;
    const rnd = seeded(key);
    const offset = Math.floor(rnd() * pool.length);
    const tags = ['', '', 'hot', '', 'new', '', 'boom', '', 'hot', '', '', ''];
    let heat = 420 + rnd() * 90;
    data[key] = pool.map((title, i) => {
      const idx = (offset + i) % pool.length;
      const t = pool[idx];
      const h = heat;
      heat *= 0.90 + rnd() * 0.05;
      const tag = tags[i % tags.length];
      const trend = rnd() > 0.72 ? 'down' : rnd() > 0.35 ? 'up' : '-';
      return [t, +h.toFixed(1), tag, trend];
    });
  });
  return data;
})();

/* 资讯流 */
const FEED = [
  { t: '从"网红城市"到"长红城市"，这届年轻人用脚步重新丈量中国', s: '城市观察', c: '#6c5ce7', time: '12 分钟前', cm: 328, e: '🏙️', g: 'linear-gradient(135deg,#667eea,#764ba2)', body: '清晨的菜市场、黄昏的江边步道、深夜仍亮着灯的小书店——越来越多人开始用"城市漫步"的方式，重新认识自己生活的这座城市。\n\n不同于走马观花式的打卡，这种慢节奏的探索更强调与城市的"连接感"。有受访者表示，走上三公里，比刷一百条短视频更能让人感到生活的实感。\n\n专家认为，这一现象背后是年轻人消费观念的转变：从追逐地标，转向体验日常。' },
  { t: '国产大模型再进一步：多模态能力成为新的竞争焦点', s: '科技前线', c: '#0984e3', time: '38 分钟前', cm: 512, e: '🤖', g: 'linear-gradient(135deg,#4facfe,#00f2fe)', body: '过去一年，国内大模型的能力边界不断被刷新。从最初的文字对话，到如今能够理解图像、生成视频，多模态正在成为新的技术分水岭。\n\n业内普遍认为，真正决定下一阶段竞争格局的，不再是参数规模，而是模型在真实场景中的可用性。\n\n多家厂商近期都把重心放在了端侧部署上，让模型跑在手机、汽车等终端设备上。' },
  { t: '一杯咖啡的价格变了：连锁品牌集体调价背后的故事', s: '财经观察', c: '#e17055', time: '1 小时前', cm: 189, e: '☕', g: 'linear-gradient(135deg,#f6d365,#fda085)', body: '近期，多家连锁咖啡品牌陆续调整价格区间，"9.9 元时代"似乎正在悄悄退潮。\n\n从业者透露，原材料成本与门店租金的持续变化，是调价的主要原因。与此同时，消费者对于品质与体验的要求也在提升。\n\n不过在不少写字楼密集的区域，平价咖啡依然有着稳定的客群。市场正在走向更细分的分层。' },
  { t: '中国空间站最新影像：从四百公里外看地球的另一种模样', s: '航天视界', c: '#2d3436', time: '2 小时前', cm: 876, e: '🌍', g: 'linear-gradient(135deg,#0f2027,#2c5364)', body: '一组由空间站航天员拍摄的高清影像近日公布，记录了日出时分地球大气层的渐变色彩。\n\n在距离地面约四百公里的轨道上，大气层呈现出薄薄的一层蓝色弧线， protection着这颗星球上的一切生命。\n\n影像发布后，不少网友留言："这是最好的宇宙科普课。"' },
  { t: '秋日养生指南：气温骤降时，这五件事值得注意', s: '健康生活', c: '#00b894', time: '3 小时前', cm: 143, e: '🍂', g: 'linear-gradient(135deg,#a8e063,#56ab2f)', body: '季节交替之际，人体抵抗力容易出现波动。医生建议，首先要保证充足睡眠，其次是及时增减衣物。\n\n饮食方面，可以适当增加温润食物，减少辛辣刺激。对于有慢性病的老人，按时服药和定期监测尤为重要。\n\n此外，适度的户外运动有助于提升心肺功能，但要注意避免清晨气温过低时段。' },
  { t: '当 AI 遇见古典乐：一场跨越三百年的合奏', s: '文化生活', c: '#a29bfe', time: '4 小时前', cm: 267, e: '🎻', g: 'linear-gradient(135deg,#c471ed,#f64f59)', body: '一场特别的音乐会上，AI 生成的旋律与真人乐团同台演出，让观众分不清哪一段出自机器之手。\n\n技术团队介绍，模型学习了大量巴洛克时期的作品，并在此基础上进行"风格延续"式的创作。\n\n指挥家则表示，技术终究是工具，真正打动人的依然是音乐背后的情感。' },
  { t: '新能源汽车渗透率持续攀升，充电桩布局加速跟进', s: '汽车观察', c: '#0984e3', time: '5 小时前', cm: 402, e: '🔋', g: 'linear-gradient(135deg,#43e97b,#38f9d7)', body: '最新行业数据显示，新能源汽车在新增乘用车中的占比继续提升。与之配套的是充电基础设施的快速铺开。\n\n值得注意的是，县域和乡镇市场的增长尤为明显，充电网络正从城市向更广阔的区域延伸。\n\n分析人士指出，补能便利度已成为影响消费者决策的关键因素之一。' },
  { t: '一个人也要好好吃饭：年轻人的"一人食"经济学', s: '生活方式', c: '#fdcb6e', time: '6 小时前', cm: 221, e: '🍜', g: 'linear-gradient(135deg,#f6d365,#fda085)', body: '单人小火锅、一人份套餐、迷你电饭煲——围绕"一个人"的消费场景正在形成一条完整的产业链。\n\n这并非孤独的代名词，而是一种主动选择的生活方式。不少年轻人表示，一个人的餐桌反而更自由。\n\n商家也在顺应这一趋势，从菜品分量到就餐环境都在做精细化调整。' },
  { t: '从非遗工坊到直播间：老手艺找到新观众', s: '社会纪实', c: '#e84393', time: '7 小时前', cm: 356, e: '🏮', g: 'linear-gradient(135deg,#f093fb,#f5576c)', body: '曾经面临传承困境的传统手工艺，正通过新的传播方式重新走进大众视野。\n\n一位从业三十年的匠人说，直播让他第一次看到这么多年轻人对手艺感兴趣，"有人看，就有传承下去的希望"。\n\n平台数据显示，传统工艺类内容的观看时长在过去一年增长了近一倍。' },
  { t: '秋季电影市场回暖：题材多元化成最大亮点', s: '影视观察', c: '#6c5ce7', time: '8 小时前', cm: 198, e: '🎬', g: 'linear-gradient(135deg,#667eea,#764ba2)', body: '今年秋季档的影片类型明显更加丰富，从现实题材到动画、纪录都有不错的市场表现。\n\n观众对于内容质量的容忍度正在降低，"口碑驱动"的特征愈发明显。\n\n业内人士预计，随着观影人群的细分，未来会出现更多垂直类型的高分作品。' },
  { t: '城市夜骑热：当自行车成为新的社交货币', s: '运动潮流', c: '#00cec9', time: '9 小时前', cm: 174, e: '🚴', g: 'linear-gradient(135deg,#43e97b,#38f9d7)', body: '夜幕降临后，成群结队的骑行者成为城市里一道新的风景线。\n\n这项运动门槛不高，却能同时满足锻炼和社交的双重需求。不少骑友表示，骑行让他们认识了原本不可能接触到的朋友。\n\n随之而来的，是相关装备和骑行路线的分享社区快速升温。' },
  { t: '数字人民币试点扩围：日常支付体验有哪些变化', s: '金融科技', c: '#0984e3', time: '10 小时前', cm: 289, e: '💳', g: 'linear-gradient(135deg,#4facfe,#00f2fe)', body: '数字人民币的试点范围继续扩大，覆盖的场景也从大型商超延伸到街边小店。\n\n用户体验上，最直观的变化是支付流程的简化，以及在无网络环境下的支付能力。\n\n不过对于普通消费者而言，习惯的改变仍需要时间，便利性始终是推广的关键。' }
];

/* 视频 */
const VIDEOS = [
  { t: '航拍：四十个镜头看遍这座城市的秋天', e: '🍁', g: 'linear-gradient(135deg,#f2994a,#f2c94c)', d: '04:32', v: '128.4万', s: '影像志' },
  { t: '十分钟带你读懂量子力学', e: '⚛️', g: 'linear-gradient(135deg,#667eea,#764ba2)', d: '10:08', v: '86.2万', s: '科普君' },
  { t: '街头采访：如果有一天不用上班', e: '🎤', g: 'linear-gradient(135deg,#f093fb,#f5576c)', d: '06:15', v: '231.7万', s: '街访日记' },
  { t: '把家搬进山里的一年，值吗？', e: '🏡', g: 'linear-gradient(135deg,#a8e063,#56ab2f)', d: '12:40', v: '64.9万', s: '慢生活' },
  { t: '一分钟学会这道家常红烧肉', e: '🍖', g: 'linear-gradient(135deg,#f6d365,#fda085)', d: '01:24', v: '312.5万', s: '厨房日记' },
  { t: '当 AI 学会弹钢琴，结果太惊艳', e: '🎹', g: 'linear-gradient(135deg,#c471ed,#f64f59)', d: '03:58', v: '97.3万', s: '科技视界' },
  { t: '凌晨四点的城市，是什么样子', e: '🌃', g: 'linear-gradient(135deg,#0f2027,#2c5364)', d: '05:46', v: '58.1万', s: '城市影像' },
  { t: '老手艺人的一天：一把椅子做三天', e: '🪑', g: 'linear-gradient(135deg,#e1b382,#c89666)', d: '08:22', v: '43.6万', s: '守艺人' }
];

const QUOTES = [
  '保持热爱，奔赴山海。',
  '生活不是等待暴风雨过去，而是学会在雨中起舞。',
  '慢慢来，比较快。',
  '把每一天都当作限量版来过。',
  '心有繁花，一路芳香。'
];

/* =========================================================
   五大资讯频道：把 52 个平台源按类型汇总而成的推送流
   - recommend 推荐：全平台精选
   - hot       热点：综合新闻 + 社区热议 + 日报
   - tech      科技：科技数码 / 开源社区
   - finance   财经：财经 + 购物消费
   - ent       娱乐：娱乐 / 影视 / 游戏 / 阅读
   ========================================================= */
const CHANNELS = [
  { key: 'recommend', name: '推荐' },
  { key: 'hot',       name: '热点' },
  { key: 'tech',      name: '科技' },
  { key: 'finance',   name: '财经' },
  { key: 'ent',       name: '娱乐' }
];

/* 远程配置：从 config.json 拉取，可覆盖品牌名 / 频道名 / 主题色 / 公告。
   运营层改动只改服务器上的 config.json 即可生效，无需重新出 IPA。
   任何失败都静默回退到内置默认值，不影响 App 启动。 */
async function applyRemoteConfig() {
  let cfg = null;
  // 优先拉远程配置（改仓库 docs/config.json 即生效，无需重新出 IPA）；
  // 离线或失败时回退到打包进 App 的本地 config.json。
  const REMOTE = 'https://cdn.jsdelivr.net/gh/JOLE-WU/iNews@master/docs/config.json';
  try {
    const res = await fetch(REMOTE, { cache: 'no-store' });
    if (res.ok) cfg = await res.json();
  } catch (e) { /* 离线：用本地 */ }
  try {
    if (!cfg) {
      const res = await fetch('config.json', { cache: 'no-cache' });
      if (res.ok) cfg = await res.json();
    }
  } catch (e) { /* 无本地配置：用内置默认值 */ }
  if (!cfg) return;
  try {
    if (cfg.brand && typeof cfg.brand === 'string') {
      const el = document.querySelector('.brand-text');
      if (el) el.innerHTML = `${cfg.brand}<span class="brand-dot">.</span>`;
      if (cfg.title) document.title = cfg.title;
    }
    if (cfg.title) document.title = cfg.title;
    if (Array.isArray(cfg.channels)) {
      cfg.channels.forEach(c => {
        const target = CHANNELS.find(x => x.key === c.key);
        if (target && c.name) target.name = c.name;
      });
    }
    if (cfg.accent && /^#[0-9a-fA-F]{6}$/.test(cfg.accent)) {
      document.documentElement.style.setProperty('--accent', cfg.accent);
    }
    if (cfg.notice && typeof cfg.notice === 'string') {
      const sub = document.querySelector('.feed-sub');
      if (sub) sub.textContent = cfg.notice;
    }
  } catch (e) { /* 离线或配置不存在：使用内置默认 */ }
}

/* 各频道聚合的平台源（来自 PLATFORMS），推送署名取自这里 */
const CHANNEL_SOURCES = {
  recommend: ['weibo', 'zhihu', 'toutiao', 'thepaper', 'baidu', 'douyin'],
  hot:       ['weibo', 'baidu', 'toutiao', 'zhihu', 'tieba', 'qqnews', 'netease', 'thepaper', 'sina', 'hupu'],
  tech:      ['ithome', 'kr36', 'sspai', 'juejin', 'huxiu', 'ifanr', 'csdn', 'github', 'hellogithub', 'v2ex'],
  finance:   ['eastmoney', 'xueqiu', 'cls', 'smzdm', 'jd', 'taobao'],
  ent:       ['bilibili', 'douyin', 'acfun', 'doubanMovie', 'maoyan', 'weread', 'jianshu', 'miyoushe', 'genshin', 'lol']
};

/* 频道资讯草稿：[标题, emoji, 渐变, 正文] —— 与平台源组合成推送 */
const CHANNEL_NEWS = {
  recommend: [
    ['从"网红城市"到"长红城市"，年轻人用脚步重新丈量中国', '🏙️', 'linear-gradient(135deg,#667eea,#764ba2)', '清晨的菜市场、黄昏的江边步道、深夜仍亮着灯的小书店——越来越多人开始用"城市漫步"的方式重新认识一座城市。\n\n不同于走马观花的打卡，这种慢节奏的探索更强调与城市的"连接感"。走上三公里，比刷一百条短视频更能让人感到生活的实感。'],
    ['国产大模型再进一步：多模态能力成新竞争焦点', '🤖', 'linear-gradient(135deg,#4facfe,#00f2fe)', '过去一年，国内大模型的能力边界不断被刷新。从文字对话到理解图像、生成视频，多模态正在成为新的技术分水岭。\n\n业内认为，决定下一阶段竞争格局的不再是参数规模，而是模型在真实场景中的可用性。'],
    ['中国空间站最新影像：从四百公里外看地球', '🌍', 'linear-gradient(135deg,#0f2027,#2c5364)', '一组由航天员拍摄的高清影像近日公布，记录了日出时分地球大气层的渐变色彩。\n\n在距地面约四百公里的轨道上，大气层呈现出薄薄的一层蓝色弧线，网友留言："这是最好的宇宙科普课。"'],
    ['一杯咖啡的价格变了：连锁品牌调价背后', '☕', 'linear-gradient(135deg,#f6d365,#fda085)', '多家连锁咖啡品牌陆续调整价格区间，"9.9 元时代"似乎正在悄悄退潮。\n\n从业者透露，原材料成本与门店租金的持续变化是主因，市场正在走向更细分的分层。'],
    ['新能源汽车渗透率攀升，充电桩加速下沉', '🔋', 'linear-gradient(135deg,#43e97b,#38f9d7)', '最新行业数据显示，新能源汽车在新增乘用车中的占比继续提升，充电基础设施快速铺开。\n\n县域和乡镇市场的增长尤为明显，补能便利度正成为影响消费决策的关键。'],
    ['从非遗工坊到直播间：老手艺找到新观众', '🏮', 'linear-gradient(135deg,#f093fb,#f5576c)', '曾经面临传承困境的传统手工艺，正通过新的传播方式重新走进大众视野。\n\n一位匠人说，直播让他第一次看到这么多年轻人对手艺感兴趣，"有人看，就有传承下去的希望"。']
  ],
  hot: [
    ['国庆假期出行大数据出炉，这些城市最热门', '🚄', 'linear-gradient(135deg,#ff6b6b,#ee5253)', '假期出行数据近日公布，高铁、民航客流均创同期新高。热门目的地集中在历史文化名城与周边短途线路。\n\n专家建议错峰出行，并提前关注天气与交通管制信息。'],
    ['今日油价迎来新调整，加满一箱差多少钱', '⛽', 'linear-gradient(135deg,#f2994a,#f2c94c)', '新一轮成品油调价窗口开启，汽柴油价格出现小幅变动。\n\n有车主算了一笔账：按家用车 50 升油箱计算，加满一箱的花费变化不大，但仍建议按需加油。'],
    ['多地迎来今年首场秋雪，气温骤降注意添衣', '❄️', 'linear-gradient(135deg,#74b9ff,#0984e3)', '受冷空气影响，北方多地迎来今年首场降雪，气温明显下降。\n\n气象部门提醒，昼夜温差加大，公众需及时增减衣物，谨防感冒。'],
    ['一项民生新规下月起施行，事关每个人', '📋', 'linear-gradient(135deg,#a29bfe,#6c5ce7)', '多项与日常生活密切相关的新规将于下月起施行，涵盖就业、医疗、消费等多个领域。\n\n读懂这些变化，能帮你更好地维护自身权益。'],
    ['网友热议：年轻人消费观正在发生这些变化', '💬', 'linear-gradient(135deg,#fd79a8,#e84393)', '从追逐品牌到看重性价比，从冲动消费到理性规划，年轻人的消费观正在悄然转变。\n\n评论区里，不少人说"花钱更清醒了"，也有人愿意为真正喜欢的东西买单。'],
    ['这份秋季养生指南请收好：五件事要注意', '🍂', 'linear-gradient(135deg,#a8e063,#56ab2f)', '季节交替之际，人体抵抗力容易波动。医生建议保证充足睡眠、及时增减衣物。\n\n饮食上可适当增加温润食物，适度户外运动有助提升心肺功能。']
  ],
  tech: [
    ['新一代开源模型发布，性能跑分刷新纪录', '💻', 'linear-gradient(135deg,#4facfe,#00f2fe)', '开源社区迎来重磅更新，新一代模型在多项基准测试中刷新纪录，且完全开放权重。\n\n开发者 Community 反应热烈，已有多个下游应用完成适配。'],
    ['一文读懂端侧 AI：为什么今年突然火了', '📱', 'linear-gradient(135deg,#667eea,#764ba2)', '把大模型装进手机、汽车和 PC，正在从概念走向现实。端侧 AI 的核心优势是隐私、低延迟和离线可用。\n\n产业链上下游都在加速布局，被认为是下一个爆发点。'],
    ['开发者实测：这款效率工具真的能省一半时间', '🛠️', 'linear-gradient(135deg,#43e97b,#38f9d7)', '一款主打自动化的效率工具近期在开发者社区走红。实测显示，它能显著减少重复性操作。\n\n不过也有用户提醒，Learning Curve 略陡，需要一定上手时间。'],
    ['国产替代再进一步：这个领域传来好消息', '🔧', 'linear-gradient(135deg,#f6d365,#fda085)', '在关键基础软件领域，国产方案再获突破，多个试点项目落地。\n\n业内认为，生态建设仍是长期课题，需要更多开发者参与共建。'],
    ['程序员如何应对 AI 时代的变化？听听他们怎么说', '👨‍💻', 'linear-gradient(135deg,#a29bfe,#6c5ce7)', 'AI 正在改变编程方式。多位资深开发者分享了自己的看法：把 AI 当作放大器，而非替代品。\n\n持续学习、保持好奇心，依然是不变的主旋律。'],
    ['GitHub 本周热门项目盘点：这些值得关注', '⭐', 'linear-gradient(135deg,#2d3436,#636e72)', '本周 GitHub Trending 榜单出炉，多个 AI 工具与开发者效率项目上榜。\n\n其中一个开源项目在一周内收获数万 Star，热度持续攀升。']
  ],
  finance: [
    ['今日大盘收盘：这个板块领涨两市', '📈', 'linear-gradient(135deg,#ff6b6b,#c0392b)', 'A 股三大指数今日集体收涨，某板块表现活跃领涨两市，成交量较前一交易日放大。\n\n机构观点认为，市场情绪有所回暖，但仍需关注量能变化。'],
    ['读懂最新财报：这些数字背后藏着什么', '📊', 'linear-gradient(135deg,#f2994a,#f2c94c)', '财报季正在进行，多家公司披露业绩。除了营收利润，现金流与毛利率的变化同样值得关注。\n\n分析师提醒，单一季度数据不宜过度解读，需结合长期趋势判断。'],
    ['年度必买清单来了：这些好物口碑爆棚', '🛍️', 'linear-gradient(135deg,#fd79a8,#e84393)', '编辑部整理了年度口碑好物清单，涵盖数码、家居、生活多个品类。\n\n每一件都经过真实测评，主打一个"买对不买贵"。'],
    ['普通人如何配置资产？听听理性建议', '💰', 'linear-gradient(135deg,#a8e063,#56ab2f)', '在低利率环境下，资产配置成为热门话题。专家建议根据自身风险承受能力分散投资。\n\n"不要把鸡蛋放在一个篮子里"，这句老话依然适用。'],
    ['这波折扣值得冲吗？先看这份避坑指南', '🏷️', 'linear-gradient(135deg,#e17055,#d63031)', '大促期间优惠满天飞，但也有不少"先涨后降"的套路。\n\n这份指南教你识别真实优惠，把钱花在刀刃上。'],
    ['资金流向数据出炉，聪明钱在买什么', '💹', 'linear-gradient(135deg,#0984e3,#00cec9)', '最新资金流向数据显示，部分板块获得资金净流入。\n\n不过数据只是参考，投资决策还需结合基本面与自身判断。']
  ],
  ent: [
    ['新番先导预告公开，这一部最受期待', '🎬', 'linear-gradient(135deg,#f093fb,#f5576c)', '多部新番先导预告集中公开，其中一部凭借精美的制作与剧情设定引发热议。\n\n粉丝纷纷表示"等不及正片上线"。'],
    ['这部国产动画封神了，豆瓣评分创新高', '🎞️', 'linear-gradient(135deg,#c471ed,#f64f59)', '一部国产动画近日口碑爆发，豆瓣评分持续走高，被不少观众称为"年度最佳"。\n\n精良的制作与扎实的叙事，是它出圈的关键。'],
    ['周末观影指南：这份片单请收好', '🍿', 'linear-gradient(135deg,#667eea,#764ba2)', '周末不知道看什么？编辑精选了几部不同题材的影片，从温情到悬疑应有尽有。\n\n总有一部能击中你。'],
    ['微信读书年度榜单出炉，你在读哪本', '📚', 'linear-gradient(135deg,#a8e063,#56ab2f)', '年度阅读榜单近日发布，多本好书上榜，涵盖文学、历史、心理等门类。\n\n有网友说："原来大家都在读这些。"'],
    ['一段话让人破防：书里的那些金句', '✍️', 'linear-gradient(135deg,#fdcb6e,#f39c12)', '阅读时总有一些句子让人停下来反复回味。网友分享了那些戳中自己的书中金句。\n\n文字的力量，往往就在一瞬间。'],
    ['游戏新版本上线，这些更新值得关注', '🎮', 'linear-gradient(135deg,#5a6acf,#8e9cdc)', '多款热门游戏迎来版本更新，新角色、新地图与玩法优化陆续上线。\n\n玩家社区讨论热烈，攻略分享层出不穷。']
  ]
};

/* 封面图：40 张真实图片随 App 打包，离线也能显示 */
let _coverSeq = 0;
const nextCover = () => `covers/c${(_coverSeq++ % 40) + 1}.jpg`;

/* 生成每个频道的资讯推送（平台源署名 + 资讯草稿） */
const CHANNEL_FEED = (() => {
  const out = {};
  CHANNELS.forEach(ch => {
    const sources = CHANNEL_SOURCES[ch.key];
    const drafts = CHANNEL_NEWS[ch.key];
    out[ch.key] = drafts.map((d, i) => {
      const sp = PLATFORMS[sources[i % sources.length]];
      return {
        t: d[0], e: d[1], g: d[2], body: d[3], img: nextCover(),
        s: sp.name, c: sp.color,
        time: (i < 2 ? `${(i + 1) * 12} 分钟前` : `${i + 1} 小时前`),
        cm: 120 + ((i * 137 + ch.key.length * 53) % 780)
      };
    });
  });
  return out;
})();

/* FEED / 视频 也使用真实封面图 */
FEED.forEach(f => { f.img = nextCover(); });
VIDEOS.forEach(v => { v.img = nextCover(); });

/* ---------- 状态 ---------- */
const state = {
  channel: 'recommend',     // 首页当前资讯频道
  feedOffset: 0,
  rankCategory: 'all',      // 热榜页当前垂类
  rankPlatform: 'weibo',    // 热榜页当前平台
  rankOffset: 0,
  theme: localStorage.getItem('rb-theme') || 'light',
  wp: +(localStorage.getItem('rb-wp') || 2),
  liked: new Set(),
  saved: new Set()
};

/* ---------- 工具 ---------- */
const fmtHeat = n => (n >= 100 ? n.toFixed(1) : n.toFixed(0)) + '万';
const tagHTML = tag => tag ? `<span class="tag ${tag}">${{ hot: '热', new: '新', boom: '爆', top: '置顶' }[tag]}</span>` : '';
const trendHTML = tr => tr === 'up' ? '<svg class="trend-up"><use href="#i-up"/></svg>' : tr === 'down' ? '<svg class="trend-down"><use href="#i-down"/></svg>' : '';

function toast(msg) {
  $('#toastText').textContent = msg;
  const el = $('#toast');
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1800);
}

/* ---------- 时钟（原生状态栏由 App 壳提供，H5 不再绘制） ---------- */

/* ---------- 首页：五大频道标签 ---------- */
function renderChannels() {
  $('#channelTabs').innerHTML = CHANNELS.map(c => `
    <button class="channel-tab ${c.key === state.channel ? 'active' : ''}" data-channel="${c.key}">${c.name}</button>`).join('');
}

/* ---------- 资讯流 ---------- */
function renderFeed() {
  const pool = CHANNEL_FEED[state.channel] || CHANNEL_FEED.recommend;
  const n = pool.length;
  const items = Array.from({ length: n }, (_, i) => pool[(state.feedOffset + i) % n]);
  $('#feed').innerHTML = items.map((it, i) => {
    const large = i === 0;
    return `<article class="feed-card ${large ? 'large' : ''}" data-feed="${encodeURIComponent(it.t)}">
      <div class="fc-main">
        <div class="fc-text">
          <div class="fc-title">${it.t}</div>
          <div class="fc-meta">
            <span class="src-dot" style="background:${it.c}">${it.s[0]}</span>
            <span>${it.s}</span><span class="sep"></span><span>${it.time}</span>
          </div>
        </div>
        <div class="fc-img" style="background:${it.g}">
          <img src="${it.img}" alt="" loading="lazy" onerror="this.style.display='none'" />
          <span class="fc-emoji">${it.e}</span>
        </div>
      </div>
      <div class="fc-actions">
        <span class="act-like" data-like="${encodeURIComponent(it.t)}"><svg><use href="#i-heart"/></svg><b>${it.cm}</b></span>
        <span><svg><use href="#i-comment"/></svg>${Math.floor(it.cm / 5)}</span>
        <span><svg><use href="#i-share"/></svg>分享</span>
      </div>
    </article>`;
  }).join('');
}

/* ---------- 热榜页 ---------- */
function renderRankCats() {
  $('#rankCats').innerHTML = CATEGORIES.map(c => `
    <button class="rank-cat ${c.key === state.rankCategory ? 'active' : ''}" data-rankcat="${c.key}">${c.name}</button>`).join('');
}
function renderRankTabs() {
  const keys = platformsByCat(state.rankCategory);
  $('#rankTabs').innerHTML = keys.map(k =>
    `<button class="rank-tab ${k === state.rankPlatform ? 'active' : ''}" data-rank="${k}">${PLATFORMS[k].name}</button>`).join('');
}
function renderRankList() {
  if (!platformsByCat(state.rankCategory).includes(state.rankPlatform)) {
    state.rankPlatform = platformsByCat(state.rankCategory)[0];
  }
  const p = PLATFORMS[state.rankPlatform], list = HOT_DATA[state.rankPlatform];
  $('#rankBannerTitle').textContent = p.name;
  const max = list[0][1];
  $('#rankList').innerHTML = list.map((row, i) => {
    const rank = i + 1, cls = rank <= 3 ? 't' + rank : '';
    return `<div class="rank-item" data-hot="${encodeURIComponent(row[0])}" style="cursor:pointer">
      <span class="rank-num ${cls}">${rank}</span>
      <div class="rank-content"><div class="rank-title">${row[0]}${tagHTML(row[2])}</div></div>
      <div class="rank-heat"><div class="rank-heat-num">${trendHTML(row[3])}${fmtHeat(row[1])}</div>
        <div class="rank-bar"><i style="width:${Math.round(row[1] / max * 100)}%"></i></div></div>
    </div>`;
  }).join('');
}

/* ---------- 视频页 ---------- */
function renderVideos() {
  $('#videoGrid').innerHTML = VIDEOS.map((v, i) => `
    <div class="video-card" data-video="${encodeURIComponent(v.t)}">
      <div class="vc-cover" style="background:${v.g}">
        <img src="${v.img}" alt="" loading="lazy" onerror="this.style.display='none'" />
        <span class="vc-emoji">${v.e}</span>
        <div class="vc-play"><svg><use href="#i-play"/></svg></div>
        <span class="vc-dur">${v.d}</span>
      </div>
      <div class="vc-title">${v.t}</div>
      <div class="vc-meta"><span>${v.v}次播放</span><span>${v.s}</span></div>
    </div>`).join('');
}

/* ---------- 详情 ---------- */
/* 依据标题/来源生成延伸段落，让每条资讯都有完整"全文"阅读体验 */
function expandArticle(item) {
  const paras = (item.body || '').split('\n\n').filter(Boolean);
  const s = item.s || '媒体';
  return paras.concat([
    `<p>${s}的报道发出后，迅速引发了广泛关注。短时间内，相关话题在多个平台持续发酵，大量网友在评论区分享了自己的看法与亲身经历，讨论热度不断攀升。</p>`,
    `<p>有分析指出，这一现象背后折射出更深层的社会变化。随着生活方式与消费观念的持续演进，类似议题正越来越多地进入公众视野，值得长期观察。</p>`,
    `<p>综合多方信息来看，事件的走向仍存在多种可能。业内人士建议，面对快速变化的信息，不妨保持理性判断，以官方发布与权威渠道为准。</p>`,
    `<p>截至发稿，相关话题仍在持续更新中。iNews 将跟踪事件进展，第一时间为你带来后续报道。对于这件事，你怎么看？欢迎在评论区留下你的观点。</p>`
  ]);
}

function openDetail(item, kind) {
  let title, meta, cover, coverImg, coverEmoji, paras;
  if (kind === 'feed') {
    title = item.t; meta = `${item.s} · ${item.time}`; cover = item.g;
    coverImg = item.img; coverEmoji = item.e;
    paras = expandArticle(item);
  } else {
    title = item[0]; meta = `${PLATFORMS[state.rankPlatform]?.name || '热榜'} · 实时热点`;
    cover = 'linear-gradient(135deg,#ff5a3c,#ff9f2e)';
    coverImg = ''; coverEmoji = '🔥';
    paras = [
      `<p>“${item[0]}”当前热度 <b>${fmtHeat(item[1])}</b>，位列榜单前列。该话题正在快速升温，短时间内引发了大量网友的关注与讨论，热度持续走高。</p>`,
      `<p>从讨论内容来看，网友对该话题的关注点集中在事件本身的影响与后续发展上。多个相关话题词也同步登上热搜，形成了一定的传播声量。</p>`,
      `<p>热榜聚合全网多个平台的热门话题，帮你用最少的时间了解正在发生的事。我们将持续关注事件进展，并为你带来后续报道。</p>`,
      `<p>你可以在详情页收藏本条热点，方便稍后查看。对于这件事，你怎么看？欢迎在评论区留下你的观点。</p>`
    ];
  }
  const body = paras.map(p => `<p>${p}</p>`).join('');
  const key = title;
  const isLiked = state.liked.has(key), isSaved = state.saved.has(key);
  $('#detailScroll').innerHTML = `
    <h1 class="detail-title">${title}</h1>
    <div class="detail-meta"><span class="src-dot" style="background:#ff5a3c">热</span>${meta}</div>
    <div class="detail-cover" style="background:${cover}">
      ${coverImg ? `<img src="${coverImg}" alt="" onerror="this.style.display='none'" />` : ''}
      <span class="dc-emoji">${coverEmoji}</span>
    </div>
    <div class="detail-body">${body}</div>
    <div class="detail-actions">
      <button class="d-like ${isLiked ? 'liked' : ''}" data-dlike="${encodeURIComponent(key)}"><svg><use href="#i-heart"/></svg><span>${isLiked ? '已赞' : '点赞'}</span></button>
      <button class="d-save ${isSaved ? 'liked' : ''}" data-dsave="${encodeURIComponent(key)}"><svg><use href="#i-bookmark"/></svg><span>${isSaved ? '已收藏' : '收藏'}</span></button>
      <button class="d-share"><svg><use href="#i-share"/></svg><span>分享</span></button>
    </div>`;
  $('#detailScroll').scrollTop = 0;
  openSheet('#detailSheet');
}

/* ---------- Sheet ---------- */
function openSheet(sel) { $(sel).classList.add('open'); }
function closeSheet(el) { el.classList.remove('open'); }

/* ---------- 搜索 ---------- */
function renderSearchDefault() {
  const hot = HOT_DATA[state.rankPlatform].slice(0, 8);
  $('#searchBody').innerHTML = `
    <div class="section-title">🔥 热门搜索</div>
    <div class="search-chips">${hot.map((h, i) => `<button class="search-chip ${i < 3 ? 'hot-chip' : ''}" data-term="${encodeURIComponent(h[0])}">${h[0]}</button>`).join('')}</div>
    <div class="section-title">猜你想搜</div>
    ${['国庆出游攻略', '新能源汽车', '秋季养生', '人工智能', '城市漫步'].map(t => `
      <div class="result-item" data-term="${encodeURIComponent(t)}" style="cursor:pointer">
        <span class="result-rank">·</span><span class="result-title">${t}</span><svg style="width:14px;height:14px;color:var(--text-3)"><use href="#i-chevron"/></svg>
      </div>`).join('')}`;
}
function doSearch(q) {
  q = q.trim();
  if (!q) { renderSearchDefault(); return; }
  const all = [];
  Object.entries(HOT_DATA).forEach(([k, list]) => list.forEach(r => all.push({ title: r[0], src: PLATFORMS[k].name, type: 'hot' })));
  FEED.forEach(f => all.push({ title: f.t, src: f.s, type: 'feed' }));
  const res = all.filter(x => x.title.includes(q)).slice(0, 12);
  $('#searchBody').innerHTML = res.length
    ? `<div class="section-title">搜索结果 · ${res.length} 条</div>` + res.map((r, i) => `
        <div class="result-item" data-result="${encodeURIComponent(r.title)}" style="cursor:pointer">
          <span class="result-rank ${i < 3 ? 'r' + (i + 1) : ''}">${i + 1}</span>
          <span class="result-title">${r.title}</span><span style="font-size:11px;color:var(--text-3)">${r.src}</span>
        </div>`).join('')
    : `<div class="result-empty">没有找到“${q}”相关内容<br><span style="font-size:11px">换个关键词试试吧</span></div>`;
}

/* ---------- 主题 / 壁纸 ---------- */
function applyTheme() { document.body.dataset.theme = state.theme; const u = $('#themeBtn use'); if (u) u.setAttribute('href', state.theme === 'dark' ? '#i-sun' : '#i-moon'); }
function applyWP() { document.body.dataset.wp = state.wp; }
function toggleTheme() { state.theme = state.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('rb-theme', state.theme); applyTheme(); toast(state.theme === 'dark' ? '已开启深色模式' : '已开启浅色模式'); }
function nextWP() { state.wp = state.wp % 5 + 1; localStorage.setItem('rb-wp', state.wp); applyWP(); toast('已切换壁纸'); }
applyTheme(); applyWP();

/* ---------- Tab 切换 ---------- */
function switchTab(name) {
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $$('.page').forEach(p => p.classList.toggle('active', p.dataset.page === name));
  $('#scroll').scrollTop = 0;
}

/* ---------- 事件绑定 ---------- */
function bind() {
  // 首页频道切换
  $('#channelTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-channel]'); if (!b) return;
    state.channel = b.dataset.channel; state.feedOffset = 0;
    renderChannels(); renderFeed();
    $('#scroll').scrollTop = 0;
  });
  $('#rankRefresh').addEventListener('click', e => {
    e.currentTarget.classList.add('spin'); setTimeout(() => e.currentTarget.classList.remove('spin'), 500);
    renderRankList(); toast('榜单已更新');
  });

  // 热榜分类 tabs
  $('#rankCats').addEventListener('click', e => {
    const b = e.target.closest('[data-rankcat]'); if (!b) return;
    state.rankCategory = b.dataset.rankcat;
    state.rankPlatform = platformsByCat(state.rankCategory)[0];
    renderRankCats(); renderRankTabs(); renderRankList();
  });

  // 热榜平台 tabs
  $('#rankTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-rank]'); if (!b) return;
    state.rankPlatform = b.dataset.rank; renderRankTabs(); renderRankList();
  });

  // Tab bar
  $('#tabbar').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (b) switchTab(b.dataset.tab);
  });

  // 搜索
  $('#heroSearch').addEventListener('click', () => { $('#searchInput').value = ''; renderSearchDefault(); openSheet('#searchSheet'); setTimeout(() => $('#searchInput').focus(), 350); });
  $('#searchBtn')?.addEventListener('click', () => openSheet('#searchSheet'));
  $('#searchInput').addEventListener('input', e => { $('#searchClear').style.display = e.target.value ? 'block' : 'none'; doSearch(e.target.value); });
  $('#searchClear').addEventListener('click', () => { $('#searchInput').value = ''; $('#searchClear').style.display = 'none'; renderSearchDefault(); });
  $('#searchBody').addEventListener('click', e => {
    const t = e.target.closest('[data-term]');
    const r = e.target.closest('[data-result]');
    if (t) { $('#searchInput').value = decodeURIComponent(t.dataset.term); $('#searchClear').style.display = 'block'; doSearch($('#searchInput').value); }
    if (r) { closeSheet($('#searchSheet')); const title = decodeURIComponent(r.dataset.result); const item = FEED.find(f => f.t === title); if (item) openDetail(item, 'feed'); else { const row = Object.values(HOT_DATA).flat().find(x => x[0] === title); if (row) openDetail(row, 'hot'); } }
  });

  // 详情：来自热搜 / 资讯
  document.addEventListener('click', e => {
    const h = e.target.closest('[data-hot]');
    const f = e.target.closest('[data-feed]');
    const v = e.target.closest('[data-video]');
    if (h) { const title = decodeURIComponent(h.dataset.hot); const row = Object.values(HOT_DATA).flat().find(x => x[0] === title); if (row) openDetail(row, 'hot'); }
    if (f) {
      const title = decodeURIComponent(f.dataset.feed);
      const allNews = Object.values(CHANNEL_FEED).flat().concat(FEED);
      const item = allNews.find(x => x.t === title);
      if (item) openDetail(item, 'feed');
    }
    if (v) { toast('视频播放 · 演示内容'); }
  });

  // 详情内操作
  $('#detailScroll').addEventListener('click', e => {
    const lk = e.target.closest('[data-dlike]'), sv = e.target.closest('[data-dsave]'), sh = e.target.closest('.d-share');
    if (lk) { const k = decodeURIComponent(lk.dataset.dlike); state.liked.has(k) ? state.liked.delete(k) : state.liked.add(k); const on = state.liked.has(k); lk.classList.toggle('liked', on); lk.querySelector('span').textContent = on ? '已赞' : '点赞'; toast(on ? '已点赞' : '已取消'); }
    if (sv) { const k = decodeURIComponent(sv.dataset.dsave); state.saved.has(k) ? state.saved.delete(k) : state.saved.add(k); const on = state.saved.has(k); sv.classList.toggle('liked', on); sv.querySelector('span').textContent = on ? '已收藏' : '收藏'; toast(on ? '已收藏' : '已取消收藏'); }
    if (sh) share();
  });

  // 主题（保留"我的"页入口）/ 分享 / 安装
  $('#themeBtn2').addEventListener('click', toggleTheme);
  $('#shareBtn').addEventListener('click', share);
  $('#installBtn').addEventListener('click', () => showInstall(true));
  $('#installClose').addEventListener('click', () => { $('#installTip').classList.remove('show'); localStorage.setItem('rb-tip-hidden', '1'); });

  // 关闭面板
  document.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { const s = e.target.closest('.sheet'); if (s) closeSheet(s); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.sheet.open').forEach(closeSheet); });

  // 下拉刷新
  let sy = 0, pulling = false;
  const sc = $('#scroll');
  sc.addEventListener('touchstart', e => { sy = e.touches[0].clientY; }, { passive: true });
  sc.addEventListener('touchmove', e => { if (sc.scrollTop <= 0 && e.touches[0].clientY - sy > 70) pulling = true; }, { passive: true });
  sc.addEventListener('touchend', () => { if (pulling) { pulling = false; const page = $('.page.active')?.dataset.page; if (page === 'home') { state.feedOffset = 0; renderFeed(); } if (page === 'rank') renderRankList(); toast('已刷新'); } });
}

function share() {
  const data = { title: '热榜 · 资讯聚合', text: '一屏聚合全网热点，推荐给你', url: location.href };
  if (navigator.share) navigator.share(data).catch(() => {});
  else { navigator.clipboard?.writeText(location.href); toast('链接已复制'); }
}

function showInstall(force) {
  if (!force && localStorage.getItem('rb-tip-hidden')) return;
  $('#installTip').classList.add('show');
  if (force) setTimeout(() => $('#installTip').classList.remove('show'), 6000);
}

/* ---------- 初始化 ---------- */
(async function init() {
  await applyRemoteConfig();
  renderChannels();
  renderFeed();
  renderRankCats();
  renderRankTabs();
  renderRankList();
  renderVideos();
  renderSearchDefault();
  bind();

  setTimeout(() => showInstall(false), 4000);
})();

// PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
