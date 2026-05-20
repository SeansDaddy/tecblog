import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Menu, X, ChevronRight, Hash, Archive, Clock, Search, ExternalLink, ArrowLeft, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Post {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  tags: string[];
  slug: string;
}

// --- Posts Data ---

const POSTS: Post[] = [
    {
    id: '30',
    title: '时序异常检测与故障预测：算法综述与选型指南',
    date: '2026-05-20',
    excerpt: '从统计方法（ARIMA/STL/CUSUM）到经典机器学习（Isolation Forest/XGBoost），再到深度学习（LSTM-AE/TCN/Informer），以及工业界 SRE 监控、IoT 故障预测、新能源异常检测的组合实践。',
    category: 'AI Agent',
    tags: ['时序分析', '异常检测', '故障预测', '算法综述', '机器学习', '深度学习'],
    slug: 'time-series-anomaly-detection',
  },
    {
    id: '29',
    title: '用 HeyGen HyperFrames 做 HTML 视频：渲染管线实战复盘',
    date: '2026-05-18',
    excerpt: 'HyperFrames 是 HeyGen 开源的 HTML 视频合成框架——用 Web 技术做视频，无需视频软件。',
    category: 'AI工具',
    tags: ['HyperFrames', 'HTML视频', 'GSAP', 'ffmpeg', 'Playwright'],
    slug: 'heygen-hyperframes-video-production-pipeline',
  },
    {
    id: '28',
    title: 'SQLCipher 数据库密钥的内存扫描攻防：技术原理与安全编码实践',
    date: '2026-05-15',
    excerpt: '深入分析一种从进程堆内存中提取 SQLCipher 数据库密钥的攻击技术——固定格式字符串扫描加 Salt 匹配，并从安全编码角度提出消除字面量、KDF 派生、硬件安全模块等多层次防御方案。',
    category: '安全',
    tags: ['安全研究', 'SQLCipher', '内存安全', 'Rust', '隐私保护'],
    slug: 'sqlcipher-memory-key-extraction-defense',
  },
    {
    id: '25',
    title: '开源框架适配事件：各角色合理运作框架',
    date: '2026-05-13',
    excerpt: '当大型平台方、框架官方、个人贡献者、外包服务商围绕一个开源框架适配项目同场博弈时，信息不对称加上缺乏前置沟通机制，几乎必然导致信任崩塌。本文从真实事件中抽离出通用框架，为四类角色提供可操作的行为准则。',
    category: 'Thoughts',
    tags: ['开源', '社区运营', '商业合作', '生态治理', '方法论'],
    slug: 'open-source-framework-adaptation-collaboration-guide',
  },
  {
    id: '26',
    title: 'Claude Mythos 深度调研：Anthropic 最强模型与网络安全攻防转折点',
    date: '2026-05-13',
    excerpt: 'Anthropic 最强通用模型 Mythos 在漏洞挖掘与自动化利用方面触及网络安全史上前所未有的临界点——发现 OpenBSD 隐藏 27 年的漏洞，Firefox 漏洞利用成功率从前代近乎零跃升至 72.4%，单次成本不足 50 美元。本文从技术能力、发布背景、Project Glasswing 联盟、行业冲击、争议与启示六个维度，深度解析这个震动华尔街和华盛顿的 AI 事件。',
    category: 'AI工具',
    tags: ['Anthropic', 'Claude', 'Mythos', '网络安全', 'AI Agent', '深度调研'],
    slug: 'claude-mythos-deep-research',
  },
  {
    id: '24',
    title: '前端运行后端技术：原理与实践调研',
    date: '2026-05-12',
    excerpt: '浏览器里跑 Python、跑 Linux、甚至跑 ESP32 固件——这些听起来像天方夜谭，但已经有成熟的技术方案在生产环境使用。从 WebAssembly 运行时到二进制翻译，从嵌入式固件 mock 到远程终端架构，调研了三条技术路径和各自的代表项目。',
    category: 'Frontend',
    tags: ['WebAssembly', '前端技术', '后端模拟', '嵌入式仿真', 'Pyodide', 'WebVM'],
    slug: 'frontend-backend-emulation-technologies',
  },
    {
    id: '23',
    title: 'DiagnosGraph：知识图谱+单智能体架构的储能电站故障诊断实践',
    date: '2026-05-10',
    excerpt: 'DiagnosGraph 是一个通用图谱诊断框架，储能作示例场景。核心设计：单智能体 + 知识图谱检索 + YAML 查表处置 + LLM 因果推理。四条设计原则，零业务依赖，换 YAML 就能适配新领域。',
    category: 'AI Agent',
    tags: ['储能', '知识图谱', 'AI Agent', '故障诊断', '工业AI'],
    slug: 'graphdiagnosis-energy-storage-fault-diagnosis-architecture',
  },
    {
    id: '22',
    title: 'Hermes 的 Skill 机制：从原理到执行',
    date: '2026-05-09',
    excerpt: 'Skill 不是插件，不是二进制，不是运行时加载的模块——它是一个被精心组织的 Markdown 文件，通过上下文注入的方式，让 LLM 在需要时"学会"一项技能。理解这一点，才能理解为什么 Skill 的描述质量如此重要。',
    category: 'AI Agent',
    tags: ['AI Agent', 'Hermes', 'Skill', '架构', 'Function Calling'],
    slug: 'skill-mechanism-deep-dive-2026',
  },
  {
    id: '21',
    title: 'Skill 评价这件事：我们到底在评什么',
    date: '2026-05-09',
    excerpt: 'Skill 评价有两个完全独立的维度：触发精度和输出质量。混淆它们是 Skill 开发中最常见的错误。SkillsBench 的数据告诉我们，精简的 Skill 效果是庞杂文档的 4 倍，但 16 个任务甚至出现了负向增益——这个数字比任何结论都值得警惕。',
    category: 'AI Agent',
    tags: ['AI Agent', 'Skill开发', 'Evals', 'SkillsBench', '方法论'],
    slug: 'skill-evaluation-deep-dive-2026',
  },
  {
    id: '20',
    title: 'Hermes 子 Agent 的 Docker 镜像：从哪里来，是否需要重复安装',
    date: '2026-05-09',
    excerpt: '通过源码追溯子 agent 执行环境，澄清 Docker 镜像来源、容器生命周期，以及依赖是否需要重复安装。',
    category: 'AI Agent',
    tags: ['AI Agent', 'Hermes', 'Docker', '沙箱', '源码解读'],
    slug: 'hermes-subagent-docker-image-lifecycle',
  },
  {
    id: '19',
    title: '子 Agent 沙箱隔离引发的正确性验证失败：一次源码级别的根因追溯',
    date: '2026-05-08',
    excerpt: '用子 agent 做 Skill 的正确性验证失败，根因是 Docker capabilities 过滤而非 seccomp syscall 过滤。直到看源码才确认了这一点。',
    category: 'AI Agent',
    tags: ['AI Agent', 'Hermes', 'Docker', '沙箱', '经验复盘'],
    slug: 'skill-harness-sandbox-capability-lessons',
  },
  {
    id: '18',
    title: 'Skill 好不好，不只看输出：触发精度才是那个被漏掉的维度',
    date: '2026-05-07',
    excerpt: '读了两篇 mager.co 的文章，关于 AI Skill 的评估，终于把「触发精度」和「输出质量」这两个维度区分清楚了。记录一下核心收获，以及对我们自己 Skill 开发的借鉴。',
    category: 'AI Agent',
    tags: ['AI Agent', 'Skill开发', 'Evals', 'promptfoo', '方法论'],
    slug: 'ai-skill-trigger-and-output-quality-evals',
  },
  {
    id: '17',
    title: '两个让我后悔的笔记习惯：Mem0 搜索失败和知识库无来源',
    date: '2026-05-07',
    excerpt: '经验从失败中来，写下来是为了以后不重蹈覆辙。最近有两个笔记使用习惯翻了车，教训很具体。',
    category: 'Thoughts',
    tags: ['笔记', 'Mem0', '知识管理', 'AI工具', '方法论'],
    slug: 'mem0-search-and-knowledge-source',
  },
  {
    id: '16',
    title: 'Google 官方出品：5 种 Agent Skill 设计模式',
    date: '2026-05-06',
    excerpt: 'Format 问题已经解决了，真正的挑战在内容设计。Google 总结了 5 种 SKILL.md 内部工作流的组织方式：Tool Wrapper、Generator、Reviewer、Inversion、Pipeline。',
    category: 'AI Agent',
    tags: ['AI Agent', 'SKILL.md', '设计模式', 'Google', '方法论'],
    slug: 'google-agent-skill-design-patterns',
  },
  {
    id: '15',
    title: '零成本搭一个国内可访问的网站：阿里云域名 + Cloudflare Workers + GitHub',
    date: '2026-05-05',
    excerpt: '阿里云域名做 DNS 解析，Cloudflare Workers 托管前端文件，GitHub 管代码 push 即部署。这套组合零服务器、零备案、国内访问速度也不错。顺便记录几个踩过的坑。',
    category: '基础设施',
    tags: ['Cloudflare', '域名', 'Workers', '部署'],
    slug: 'cloudflare-workers-aliyun-domain-setup',
  },
  {
    id: '14',
    title: '我们是怎么把「写 Skill」这件事流程化的',
    date: '2026-05-04',
    excerpt: '从两个真实案例出发，沉淀出一套可复用的 Skill 生成方法论。核心是 SDD 六阶段流程和八个质量维度，每一个阶段都有明确的输入、输出和检查点。',
    category: 'AI Agent',
    tags: ['AI Agent', 'Skill开发', 'SDD', '方法论'],
    slug: 'sdd-skill-framework-from-practice',
  },
  {
    id: '13',
    title: 'HiClaw 架构与 Skill 隔离方案：一次企业级 Agent 编排系统的深度分析',
    date: '2026-04-29',
    excerpt: '深入分析 HiClaw 的 Manager-Workers 架构与三层 Skill 隔离机制：容器级隔离、MinIO 共享存储、DockerAPIProxy + SecurityValidator。以及与 Hermes subagent 机制的核心区别对比。',
    category: 'AI Agent',
    tags: ['AI Agent', 'HiClaw', '架构设计', '安全'],
    slug: 'hiclaw-skill-isolation-architecture',
  },
  {
    id: '12',
    title: 'delegate_task vs tmux：Hermes 子 Agent 两种实现方式',
    date: '2026-04-29',
    excerpt: '深入解析 Hermes Agent 中子 Agent 的两种实现机制：官方推荐的 delegate_task（线程池方案）和来自 skill 的 tmux 变通方案，以及 research-agent 作为实际应用案例。',
    category: 'AI Agent',
    tags: ['AI Agent', 'Hermes', '架构设计'],
    slug: 'hermes-subagent-delegate-vs-tmux',
  },
  {
    id: '11',
    title: 'Hermes 的 Memory 优化',
    date: '2026-04-28',
    excerpt: 'Memory 越来越乱怎么办？通过一次深度讨论，重新定义了 Memory 的职责边界：只存"能改变服务行为的信息"，并落地了 @标签 + [情境]→[行为] 的双格式规范。记录这次设计过程和后续优化方向。',
    category: 'AI Agent',
    tags: ['AI Agent', 'Memory', '架构设计'],
    slug: 'memory-optimization-v1',
  },
  {
    id: '10',
    title: '配色灵感收藏：20 组好看的色彩搭配',
    date: '2026-04-27',
    excerpt: '9 组三色配色 + 11 组双色撞色，含色值和适用场景。奶杏暖调、克莱因蓝、爱马仕橙、蒂芙尼蓝……配色其实不需要记太多套路，记住「背景要浅、主色要稳、强调要亮」这个规律就够了。',
    category: 'Design',
    tags: ['Design', '配色', '色彩', '视觉设计'],
    slug: 'color-palette-inspiration',
  },
  {
    id: '9',
    title: '从 Token 到 Agent：AI 底层核心概念串烧',
    date: '2026-04-27',
    excerpt: 'LLM 为什么是文字接龙游戏？Token 为什么不是词？Context 和 Context Window 是什么关系？Agent 和 Agent Skill 有什么区别？一文梳理清楚 AI 圈最核心的 9 个概念。',
    category: 'AI',
    tags: ['AI', 'LLM', 'Agent', '概念解释'],
    slug: 'ai-llm-concepts-deep-dive',
  },
  {
    id: '8',
    title: 'Android WebView 应用开发：网页快速变身 App',
    date: '2026-04-27',
    excerpt: '用 Android Studio + WebView 组件加载网页，快速构建 Android App。适合已有后端 API 或移动端网页的场景，无需深入学习 Android 原生 UI 开发。',
    category: 'Tools',
    tags: ['Android', 'WebView', '移动开发', 'App打包'],
    slug: 'android-webview-app-development',
  },
  {
    id: '7',
    title: 'Hermes Agent 定时任务与会话隔离：一个被很多人忽略的坑',
    date: '2026-04-26',
    excerpt: '定时任务（cron）怎么知道今天干了什么？本文揭示了 Hermes cron session 与主会话完全隔离的架构设计，以及为什么「随时记录」是唯一的正确解法。',
    category: 'AI Agent',
    tags: ['AI Agent', 'Hermes', '架构设计', '最佳实践'],
    slug: 'hermes-cron-session-isolation',
  },
  {
    id: '5',
    title: '我把一个 AI Agent 用进了日常工作',
    date: '2026-04-25',
    excerpt: '用了快两个月 Hermes Agent 之后的一些真实感受。不是教程，不保证正确，纯粹个人记录。',
    category: 'Thoughts',
    tags: ['AI', 'Agent', '随笔'],
    slug: 'hermes-agent-one-month-review',
  },
  {
    id: '6',
    title: '抖音视频内容提取：Whisper 语音识别实战指南',
    date: '2026-04-25',
    excerpt: '抖音和视频号均为封闭平台，无官方 API。本文介绍最推荐的合规方案：视频下载 + Whisper 语音识别，可提取任意视频的口播内容，准确率 95%+。',
    category: 'AI工具',
    tags: ['AI工具', '音视频', 'Whisper', '内容提取'],
    slug: 'douyin-video-transcribe-whisper',
  },
  {
    id: '3',
    title: '智能体 Skill 开发与执行治理规范',
    date: '2026-04-25',
    excerpt: '本文为 LLM Agent 体系下的 Skill 开发与执行建立了一套完整的治理标准，涵盖资源限制、接口契约、日志审计、可用性设计、安全性设计等关键维度。',
    category: '规范标准',
    tags: ['AI Agent', '规范标准', '治理框架'],
    slug: 'skill-development-governance-v2',
  },
  {
    id: '2',
    title: 'WSS 长连接与 Webhook 回调：技术对比与选型指南',
    date: '2026-04-25',
    excerpt: '在构建与第三方平台对接的系统时，消息推送方式的选择是关键架构决策之一。本文对比 WebSocket 长连接（WSS）和 Webhook 回调两种主流模式，帮你根据实际场景做出合理选择。',
    category: '架构设计',
    tags: ['WebSocket', 'Webhook', '系统集成'],
    slug: 'wss-vs-webhook-comparison',
  },
  {
    id: '27',
    title: 'Kata 沙箱安全风险深度分析',
    date: '2026-05-14',
    excerpt: '深度剖析 Kata Containers 沙箱在多租户场景下的安全风险，从侧信道攻击、VM 逃逸、凭证管理等维度给出完整风险矩阵和防护建议。',
    category: '安全',
    tags: ['安全', '容器', 'Kata Containers', '云原生'],
    slug: 'kata-sandbox-security-risks',
  },
  {
    id: '1',
    title: 'Hermes Agent 子 Agent 架构与 API Key 配置',
    date: '2026-04-22',
    excerpt: '深入解析 Hermes Agent 中子 Agent 的启动机制、API Key 的三条获取路径（直接 base_url、provider 名称、继承父 Agent），以及 profile 配置的常见陷阱和最佳实践。',
    category: 'AI Agent',
    tags: ['AI', 'Agent', 'Python'],
    slug: 'hermes-agent-subagent',
  },
];

// 动态计算分类和归档
const getCategoryCounts = () => {
  const counts: Record<string, number> = {};
  POSTS.forEach(p => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });
  return counts;
};

const getArchiveCounts = () => {
  const counts: Record<string, number> = {};
  POSTS.forEach(p => {
    const year = p.date.split('-')[0];
    counts[year] = (counts[year] || 0) + 1;
  });
  return counts;
};

const CATEGORIES = ['基础设施', 'Design', 'AI Agent', '架构设计', '规范标准', 'AI工具', 'Backend', 'Frontend', 'Tools', 'DevOps', 'Thoughts', '安全'];
const ARCHIVES = ['2026', '2025', '2024', '2023'];

// --- Navbar ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">花</span>
              </div>
              <span className="text-xl font-semibold tracking-tight text-zinc-900">花生牛奶's blog</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">首页</Link>
            <Link to="/archives" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">归档</Link>
            <Link to="/" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">友链</Link>
            <Link to="/about" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">关于</Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-600 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-zinc-100 bg-white overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <Link to="/" className="block text-lg font-medium text-zinc-900" onClick={() => setIsOpen(false)}>首页</Link>
              <Link to="/archives" className="block text-lg font-medium text-zinc-900" onClick={() => setIsOpen(false)}>归档</Link>
              <Link to="/" className="block text-lg font-medium text-zinc-900" onClick={() => setIsOpen(false)}>友链</Link>
              <Link to="/about" className="block text-lg font-medium text-zinc-900" onClick={() => setIsOpen(false)}>关于</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Post Item ---

const PostItem: React.FC<{ post: Post }> = ({ post }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="group py-8 border-b border-zinc-100 last:border-0"
  >
    <div className="flex items-center space-x-3 text-sm text-zinc-400 mb-2">
      <Clock size={14} />
      <span>{post.date}</span>
      <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
      <span className="text-zinc-500 font-medium uppercase tracking-wider text-[10px]">{post.category}</span>
    </div>
    <h2 className="text-2xl font-bold text-zinc-900 mb-3 group-hover:text-zinc-600 transition-colors cursor-pointer">
      <Link to={post.slug ? `/blog/${post.slug}` : '/'}>{post.title}</Link>
    </h2>
    <p className="text-zinc-600 leading-relaxed mb-4 line-clamp-2">
      {post.excerpt}
    </p>
    <div className="flex flex-wrap gap-2">
      {post.tags.map(tag => (
        <span key={tag} className="inline-flex items-center px-2 py-1 bg-zinc-50 text-zinc-500 text-[11px] font-medium rounded-md border border-zinc-100">
          <Hash size={10} className="mr-1" />
          {tag}
        </span>
      ))}
    </div>
  </motion.article>
);

// --- Sidebar ---

const Sidebar = () => {
  const categoryCounts = getCategoryCounts();
  const archiveCounts = getArchiveCounts();

  return (
    <aside className="space-y-10">
      {/* Profile Card */}
      <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
        <div className="w-16 h-16 bg-zinc-200 rounded-full mb-4 mx-auto overflow-hidden flex items-center justify-center text-3xl">
          🥜
        </div>
        <div className="text-center">
          <h3 className="font-bold text-zinc-900">花生牛奶</h3>
          <p className="text-sm text-zinc-500 mt-1">记录思考，分享成长</p>
        </div>
        <div className="flex justify-center space-x-4 mt-6">
          <a href="https://gitcode.com/seanacode" target="_blank" rel="noopener" className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
            <img
              src="/images/gitcode-icon.png"
              alt="GitCode"
              className="w-5 h-5"
            />
          </a>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4 flex items-center">
          <ChevronRight size={16} className="mr-1 text-zinc-400" />
          Categories
        </h3>
        <ul className="space-y-2">
          {CATEGORIES.map(cat => {
            const count = categoryCounts[cat] || 0;
            return (
              <li key={cat}>
                <a href="#" className="flex justify-between items-center text-zinc-600 hover:text-zinc-900 py-1 transition-colors group">
                  <span className="text-sm">{cat}</span>
                  {count > 0 && (
                    <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">{count}</span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Archives */}
      <div>
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4 flex items-center">
          <Archive size={16} className="mr-2 text-zinc-400" />
          Archives
        </h3>
        <ul className="space-y-2">
          {ARCHIVES.map(year => {
            const count = archiveCounts[year] || 0;
            return (
              <li key={year}>
                <a href="#" className="flex justify-between items-center text-sm text-zinc-600 hover:text-zinc-900 block py-1 transition-colors">
                  <span>{year}</span>
                  {count > 0 && (
                    <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-400">{count}</span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

// --- Footer ---

const Footer = () => (
  <footer className="border-t border-zinc-100 bg-zinc-50 py-12 mt-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-zinc-900 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">花</span>
            </div>
            <span className="text-lg font-semibold text-zinc-900">花生牛奶's blog</span>
          </div>
          <p className="text-sm text-zinc-500 max-w-sm">
            记录思考，分享成长。保持热爱，持续输出。
          </p>
        </div>
        <div className="flex flex-col md:items-end space-y-4">
          <div className="flex space-x-6">
            <Link to="/about" className="text-zinc-400 hover:text-zinc-900 transition-colors">关于</Link>
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">友链</a>
          </div>
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} 花生牛奶. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

// --- Strip frontmatter from raw markdown ---
const stripFrontmatter = (text: string): string => {
  if (text.startsWith('---')) {
    const end = text.indexOf('---', 3);
    if (end !== -1) {
      return text.slice(end + 3).trimStart();
    }
  }
  return text;
};

// --- Article Detail Page ---

const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    const found = POSTS.find(p => p.slug === slug);
    setPost(found || null);

    if (slug) {
      fetch(`/content/${slug}.md`)
        .then(r => r.text())
        .then(text => {
          setContent(stripFrontmatter(text));
          setLoading(false);
        })
        .catch(() => {
          setContent('文章加载失败');
          setLoading(false);
        });
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-400">加载中...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">文章不存在</h1>
        <Link to="/" className="text-blue-500 hover:text-blue-600">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-900 mb-8 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          返回首页
        </Link>

        {/* Article header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-3 text-sm text-zinc-400 mb-4">
            <Calendar size={14} />
            <span>{post.date}</span>
            <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
            <span className="text-zinc-500 font-medium uppercase tracking-wider text-[10px]">{post.category}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-6">
            {post.title}
          </h1>
          <div className="flex flex-wrap gap-2 mb-10">
            {post.tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-1 bg-zinc-50 text-zinc-500 text-[11px] font-medium rounded-md border border-zinc-100">
                <Hash size={10} className="mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </motion.header>

        {/* Article content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-zinc max-w-none"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({children}) => <h1 className="text-3xl font-bold text-zinc-900 mt-10 mb-4">{children}</h1>,
              h2: ({children}) => <h2 className="text-2xl font-bold text-zinc-900 mt-8 mb-3">{children}</h2>,
              h3: ({children}) => <h3 className="text-xl font-bold text-zinc-900 mt-6 mb-2">{children}</h3>,
              p: ({children}) => <p className="text-zinc-600 leading-relaxed mb-4">{children}</p>,
              ul: ({children}) => <ul className="list-disc list-inside text-zinc-600 mb-4 space-y-1">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal list-inside text-zinc-600 mb-4 space-y-1">{children}</ol>,
              li: ({children}) => <li className="text-zinc-600">{children}</li>,
              code: ({className, children}) => {
                const isInline = !className;
                if (isInline) {
                  return <code className="px-1 py-0.5 bg-zinc-100 text-zinc-800 text-sm rounded font-mono">{children}</code>;
                }
                return <code className="block p-4 bg-zinc-900 text-zinc-100 text-sm rounded-lg font-mono overflow-x-auto mb-4">{children}</code>;
              },
              pre: ({children}) => <pre className="mb-4">{children}</pre>,
              a: ({href, children}) => <a href={href} className="text-blue-500 hover:text-blue-600 underline" target="_blank" rel="noopener">{children}</a>,
              blockquote: ({children}) => <blockquote className="border-l-4 border-zinc-200 pl-4 italic text-zinc-500 mb-4">{children}</blockquote>,
              strong: ({children}) => <strong className="font-bold text-zinc-900">{children}</strong>,
              hr: () => <hr className="border-zinc-200 my-8" />,
              table: ({children}) => <table className="w-full border-collapse mb-4">{children}</table>,
              th: ({children}) => <th className="border border-zinc-200 px-3 py-2 text-left text-sm font-bold text-zinc-900 bg-zinc-50">{children}</th>,
              td: ({children}) => <td className="border border-zinc-200 px-3 py-2 text-sm text-zinc-600">{children}</td>,
            }}
          >
            {content}
          </ReactMarkdown>
        </motion.article>
      </main>
      <Footer />
    </div>
  );
};

// --- Home Page ---

const HomePage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <Navbar />
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-4">
          <header className="mb-12">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 mb-4"
            >
              最新文章
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-zinc-500"
            >
              记录思考，分享成长
            </motion.p>
          </header>

          <div className="space-y-2">
            {[...POSTS].sort((a, b) => b.date.localeCompare(a.date) || parseInt(b.id) - parseInt(a.id)).map(post => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 lg:pt-32">
          <Sidebar />
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

// --- App ---

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/archives" element={<ArchivesPage />} />
      <Route path="/blog/:slug" element={<ArticleDetail />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

// --- About Page ---

const AboutPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <Navbar />
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
      <Link
        to="/"
        className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-900 mb-8 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        返回首页
      </Link>

      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-8">
          关于
        </h1>
      </motion.header>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="prose prose-zinc max-w-none"
      >
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center text-5xl mb-6">
            🥜
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">花生牛奶</h2>
          <p className="text-zinc-500">记录思考，分享成长</p>
        </div>

        <div className="space-y-6 text-zinc-600 leading-relaxed">
          <p>
            这是一个个人技术博客，记录我在 AI Agent、系统架构、工程实践等领域的思考与探索。
          </p>
          <p>
            保持热爱，持续输出。希望这些内容能对你有所帮助。
          </p>

          <h3 className="text-xl font-bold text-zinc-900 mt-8 mb-4">技术栈</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>AI Agent / LLM 应用开发</li>
            <li>Python / Node.js / TypeScript</li>
            <li>系统架构与 DevOps</li>
            <li>自动化工具与工作流</li>
          </ul>

          <h3 className="text-xl font-bold text-zinc-900 mt-8 mb-4">联系方式</h3>
          <ul className="space-y-2">
            <li>
              <a href="https://gitcode.com/seanacode" target="_blank" rel="noopener" className="text-blue-500 hover:text-blue-600">
                GitCode：seanacode
              </a>
            </li>
          </ul>
        </div>
      </motion.article>
    </main>
    <Footer />
  </div>
);

// --- Archives Page ---

const ArchivesPage: React.FC = () => {
  // 按年份分组（年份内按日期降序）
  const grouped = POSTS.reduce<Record<string, Post[]>>((acc, post) => {
    const year = post.date.split('-')[0];
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));
  // 每年的文章也按日期降序
  years.forEach(year => {
    grouped[year].sort((a, b) => b.date.localeCompare(a.date) || parseInt(b.id) - parseInt(a.id));
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <header className="mb-12">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 mb-4"
              >
                文章归档
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-zinc-500"
              >
                共 {POSTS.length} 篇文章
              </motion.p>
            </header>

            <div className="space-y-12">
              {years.map(year => (
                <section key={year}>
                  <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center">
                    <span>{year}</span>
                    <span className="ml-3 text-sm font-normal text-zinc-400">({grouped[year].length} 篇)</span>
                  </h2>
                  <ul className="space-y-4">
                    {grouped[year].map(post => (
                      <li key={post.id} className="flex items-center group">
                        <span className="text-sm text-zinc-400 w-20 flex-shrink-0">{post.date.slice(5)}</span>
                        <Link
                          to={post.slug ? `/blog/${post.slug}` : '/'}
                          className="text-lg text-zinc-700 hover:text-zinc-900 transition-colors"
                        >
                          {post.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 lg:pt-32">
            <Sidebar />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
