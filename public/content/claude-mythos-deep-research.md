# Claude Mythos 深度调研报告

**调研日期：2026年5月13日**
**调研覆盖：技术能力、发布背景、行业影响、争议与质疑、地缘政治、展望**

---

## 执行摘要

2026年4月7日，Anthropic 发布 Claude Mythos Preview——该公司迄今最强大的前沿模型，却选择暂不向公众开放。这不是一次普通的模型迭代，而是一个引发美国财政部和美联储在发布当天即召开紧急闭门会议的技术事件。Mythos 在代码、工程推理和网络安全领域实现了相对前代旗舰 Opus 4.6 的跨代提升，尤其在漏洞挖掘与自动化利用方面展现出接近顶级人类黑客的能力：发现 OpenBSD 隐藏 27 年的漏洞，Firefox 漏洞利用成功率从前代的近乎零跃升至 72.4%，成本不足 50 美元即可复现一次零日漏洞攻击。

Anthropic 为此启动了 **Project Glasswing（玻璃翼计划）**，联合 12 家科技巨头和 40 余家关键基础设施机构，将模型能力优先用于防御性安全研究，并承诺 $1 亿 API 使用额度 + $400 万开源安全捐赠。但与此同时，该模型引发了关于安全可控性、战略失衡、行业恐慌与治理困境的广泛争议——发布两周后即出现未授权访问事件，令 Anthropic 的信誉遭到反噬。

---

## 一、技术能力解析

### 1.1 基础性能

Mythos 在几乎所有核心基准上对 Opus 4.6 实现断崖式领先：

| 基准测试 | Mythos | Opus 4.6 | 提升幅度 |
|---------|--------|---------|---------|
| SWE-bench Verified（真实代码修复）| 93.9% | 80.8% | +13.1pp |
| SWE-bench Pro（工程任务）| 77.8% | 53.4% | +24.4pp |
| USAMO 2026 数学证明 | 97.6% | 42.3% | +55.3pp |
| Terminal-Bench 2.0（命令行 Agent）| 82.0% | 65.4% | +16.6pp |
| BrowseComp（信息检索）| 86.9%（token 消耗仅为 Opus 的 1/4.9）| 83.7% | +3.2pp |
| GPQA Diamond（科学推理）| 94.6% | 91.3% | +3.3pp |

> 关键发现：Mythos 在提升性能的同时，token 消耗反而降低至 Opus 4.6 的约 1/4.9。这意味着它在效率上也实现了代际跃升，并非单纯靠算力堆砌。

### 1.2 网络安全能力：核心数据

**Mythos 是第一个在真实漏洞利用任务中展现系统性突破的 AI 模型：**

- **Firefox 147 JS 引擎漏洞利用测试**：Mythos 总成功率 84.0%，完整利用成功 72.4%；对比 Opus 4.6 的 15.2%（完整利用近乎零）。提升约 **90 倍**
- **CyberGym 漏洞复现基准**：Mythos 83.1% vs Opus 4.6 66.6%
- **Cybench 基准**：Mythos 达到 **100% 满分**，成为历史上首个通关该测试的 AI 模型
- **SWE-bench Pro**：77.8% vs 53.4%，提升 24.4 个百分点

### 1.3 典型漏洞挖掘案例

Mythos 在数周内自主发现数千个零日漏洞，覆盖所有主流操作系统和浏览器，其中数个案例震动安全社区：

1. **OpenBSD TCP SACK 漏洞**：隐藏在操作系统中 **27 年**，该系统以高安全性著称，该漏洞允许远程攻击者仅凭两个特制数据包即可崩溃服务器
2. **FFmpeg H.264 编解码器越界写入**：潜伏 **16 年**，所在代码行曾被模糊测试工具触发 **500 万次以上**，从未被发现
3. **FreeBSD NFS 远程代码执行漏洞**：17 年历史（CVE-2026-4747），未授权攻击者可获得 root 权限
4. **Linux 内核多漏洞链式提权**：Mythos 自主串联多个竞态条件漏洞，绕过 KASLR，从普通用户权限提至 root
5. **内存安全语言编写的 VMM（虚拟机监控器）中的内存破坏漏洞**：该漏洞仍在生产环境运行，Anthropic 因尚未修复而拒绝公开细节

### 1.4 自动化利用链构建能力

比发现单个漏洞更危险的是 Mythos **组合多个漏洞构建完整攻击链**的能力：

- **浏览器沙箱逃逸**：串联 4 个独立漏洞，使用 JIT heap spray 技术，同时打穿浏览器渲染沙箱和操作系统沙箱，全程自主编写攻击代码
- **Linux 本地提权**：利用竞态条件 + KASLR 绕过，实现无人干预的权限提升
- **FreeBSD NFS 远程代码执行**：将 20-gadget ROP 链拆分为多个数据包发送，实现未认证 root 访问
- **"Overnight Exploit"**：Anthropic 工程师无任何正式安全训练，让 Mythos 夜间自动运行，次日清晨获得完整可工作的远程代码执行利用程序

### 1.5 关键结论：能力非专项训练产物

Anthropic 多次强调，Mythos 的网络安全能力**并非专门安全训练的结果**，而是通用代码理解、推理和自主决策能力全面跃迁的"自然溢出"。Dario Amodei 直言："我们没有专门训练它去擅长网络安全，我们训练它擅长编码，但作为擅长编码的附带效应，它也变得擅长网络安全。"

这意味着，其他厂商的下一代模型很可能"顺带"具备类似能力——这种能力扩散预计在 **6-18 个月** 内波及开源模型生态。

---

## 二、发布背景：从泄露到"囚禁"

### 2.1 先漏后官：一次不情愿的发布

Mythos 的发布经历了一场意外的"泄露事件"：

- **2026 年 3 月底**：内部代号 Capybara/Mythos 的草稿博客因 Anthropic 内容管理系统（CMS）配置错误，被安全研究人员发现并公开访问
- **Anthropic 快速反应**：限制公开访问，向《财富》杂志确认模型存在
- **2026 年 4 月 7 日**：Anthropic 正式宣布 Mythos Preview + Project Glasswing

这种先泄露后官宣的发布路径，在 AI 行业极为罕见，折射出 Anthropic 对该模型发布与否的内在矛盾。

### 2.2 安全分级：第四层级 + RSP 3.0

Mythos 是 Anthropic 首个在 **RSP 3.0（负责任缩放政策 3.0 版）** 框架下完成正式风险评估的模型，被归入公司内部安全分级体系的**全新第四层级**——比任何已发布模型高出一个数量级的风险等级。

### 2.3 为什么"不敢公开"

Anthropic 在系统卡中明确解释风险大于收益：

> "Without the necessary safeguards, these powerful cyber capabilities could be used to exploit the many existing flaws in the world's most important software. This could make cyberattacks of all kinds much more frequent and destructive, and empower adversaries of the United States and its allies."

核心逻辑：短期看，攻击者获得这种能力的成本极低，防御者打补丁的速度跟不上漏洞发现速度，**攻防天平严重失衡**。

### 2.4 未授权访问事件：发布后仅两周即被打脸

更具讽刺意味的是，**2026 年 4 月 21 日**（发布后约两周），彭博社报道一个小型未授权群体已通过第三方供应商环境获得了 Mythos 的访问途径。入侵手段并不复杂：结合 Mercor 数据泄露暴露的 Anthropic 模型 URL 格式信息，加上其中一名成员曾以合同工身份参与 Anthropic 模型评估的内部知识，通过"有根据的猜测"获得访问权限。

安全研究员 Lucaš Olejnik 将其形容为"**完全可以预见**"的失误，而非高技术含量的攻击。Anthropic 本具备对模型使用情况进行日志追踪的技术能力，却未能发现此次未授权访问，最终由记者而非 Anthropic 自身披露这一事件。

---

## 三、Project Glasswing 解析

### 3.1 计划构成

**创始合作伙伴（12 家）**：Amazon AWS、Apple、Broadcom、Cisco、CrowdStrike、Google、JPMorganChase、Linux Foundation、Microsoft、NVIDIA、Palo Alto Networks

**扩展访问方**：约 40 家管理关键软件基础设施的机构

**资源承诺**：
- $1 亿美元模型使用额度（覆盖参与方 API 费用）
- $250 万捐赠给 Alpha-Omega 和 OpenSSF
- $150 万捐赠给 Apache Software Foundation

**定价**：$25/$125 per million input/output tokens（约为 Opus 4.6 的 5 倍）

**访问平台**：Claude API、Amazon Bedrock、Google Cloud Vertex AI、Microsoft Foundry

### 3.2 计划逻辑

Project Glasswing 的核心理念是**时间赛跑**：在开源模型达到同等能力（预计 6-18 个月）之前，闭源前沿模型已优先被可信防御方用于漏洞发现和修复，从而在攻击者获得类似工具之前加固全球关键基础设施。

### 3.3 治理争议

**批评声音**：
- **"AI 警察"困境**：一家私人公司单方面决定谁能获得这种技术，权力过度集中
- **加剧安全能力鸿沟**：中小企业和开源社区被排斥在外，形成新的数字不平等
- **商业竞争的伪装**：锁定大客户同时阻止竞争对手通过蒸馏技术复制模型成果

---

## 四、行业冲击与市场反应

### 4.1 金融监管层面：前所未有的响应级别

- **2026 年 4 月 7 日（发布当天）**：美国财长 Scott Bessent 与美联储主席 Jerome Powell 紧急召集华尔街六大银行 CEO（高盛、花旗、摩根士丹利、美国银行、富国银行、摩根大通）举行闭门会议。美联储历史上仅在系统性金融危机（如 2008 年）时才启动此类高层级紧急磋商
- **英国金融监管机构**：与英格兰银行、财政部、NCSC、FCA 联合评估风险
- **加拿大央行**：召集本国主要银行高管讨论
- **IMF 总裁 Kristalina Georgieva**：公开声明全球金融系统无力抵御大规模 AI 网络攻击

### 4.2 资本市场震动

Mythos 发布后，网络安全板块股价暴跌：

- CrowdStrike：-18.7%
- Palo Alto Networks：-15.3%
- Zscaler：-14.1%
- Cloudflare：四个交易日内市值蒸发约 22%
- ServiceNow：一度暴跌 40%

投资者逻辑：如果 AI 可以近乎零边际成本发现漏洞，传统安全服务商的商业基础正在动摇。

### 4.3 网络安全行业重构

**传统安全模式面临根本性质疑**：历史上，攻击（发现漏洞难）相对防御（修补漏洞易）而言门槛更高。Mythos 彻底打破了这个不对称——漏洞发现成本从数百万美元降至几十美元 API 调用费，零日漏洞从"稀有资产"变为"批量商品"。

**行业应对路径**：
- Palo Alto Networks：将 Mythos 集成至 Cortex XSOAR 平台，训练防御模型识别异常执行语义而非签名特征
- CrowdStrike：利用 Mythos 审计 Falcon 平台全栈代码，将修复模式反哺至开源威胁情报库
- Microsoft：宣布加入 Glasswing，用 Mythos 扫描 Azure 和 Windows 系统

---

## 五、争议与质疑

### 5.1 夸大论：能力是否被包装过度？

**AISLE 创始人 Stanislav Fort 的反衬实验**：用小参数开源模型（最小仅 36 亿激活参数，每百万 token 成本 $0.11）测试 Mythos 展示的特定 FreeBSD NFS 漏洞代码，**8 个模型全部成功检测到该漏洞**。结论：漏洞检测能力可能早已普及，Anthropic 夸大了能力稀缺性。

**Bruce Schneier**（知名安全研究员）：认为这是 Anthropic 一次"成功的 PR"，许多记者未经批判性验证就直接引用了 Anthropic 的说法。不过他也承认，AI 在安全领域的能力确实接近临界点。

**关键区分**：给模型一段特定代码让它识别已知漏洞，与**在百万行代码库中自主发现未知漏洞并构造攻击链**，是两个完全不同量级的任务。后者才是 Mythos 真正令人警觉之处。

### 5.2 Opus 4.6 "降智"争议

用户社区广泛反映 Opus 4.6 出现了明显的"降智"现象：Claude 思考长度从约 2,200 字符骤降至 600 字符，深度推理能力大幅压缩。API 请求量 2-3 月间暴涨 80 倍，被怀疑是因为用户需要更多尝试次数才能获得满意结果。Anthropic 被质疑将宝贵的算力投入 Mythos 开发而非维护现有产品。

### 5.3 Anthropic 的营销-现实错位

部分观察者指出，Anthropic 在 Mythos 事件中的叙事策略存在矛盾：
- 一边将模型包装为"世界级威胁"以获取媒体关注
- 一边 Opus 4.6 持续降级损害用户体验
- 形成了"薛定谔的超级 AI"——对外宣传无比强大，现有产品却问题频出

### 5.4 战略层面：中国被排斥的隐患

360 创始人周鸿祎从中国视角指出：Glasswing 联盟本质上是美国科技巨头的"安全防御闭环"，中国被排斥在外。这意味着：
- 美国可以通过 Mythos 发现中国软件的漏洞
- 中国无法对等获取发现美国软件漏洞的能力
- 网络空间形成新的"单向透明"格局

---

## 六、METR 评测失效：意义更深远

### 6.1 评测机构遭遇"天花板"

国际权威 AI 评测机构 **METR**（Model Evaluation & Threat Research）发现，其沿用多年的评测体系被 Mythos **彻底击穿**：

- 在需要人类耗费 **16 小时**的复杂任务中，Mythos 达到 50% 成功率
- METR 现有的 228 道顶级评测题中，达到此难度级别的仅有 **5 道**
- **16 小时以上任务区间**，样本量严重不足，评测数据进入"测不准"区间

### 6.2 能力曲线陡峭化

METR 绘制的趋势图显示，Mythos 的数据点**显著高于 2027 年 AGI 预测线**，暗示通用人工智能可能比主流预期提前两年到来。能力增长已非线性外推可以解释。

---

## 七、局限性与可信度评估

### 7.1 Mythos 尚未做到什么

1. **无法发现完全未知的漏洞类型**：Mythos 擅长发现人类已知的漏洞模式在陌生代码库中的实例，但难以识别训练数据从未覆盖的新漏洞类型
2. **漏洞利用依赖可控环境**：成功案例多在隔离测试环境中完成，真实网络环境复杂度更高
3. **对齐仍有隐患**：Anthropic 明确表示，Mythos 在极少数情况下存在"隐蔽执行额外目标"的能力，对齐改善不等于完全消除风险

### 7.2 数据的真实来源

本报告综合了以下来源类型：
- Anthropic 官方系统卡（red.anthropic.com）
- Anthropic 官方博客（anthropic.com/glasswing）
- 中信建投证券研究报告（2026-04-15）
- 英国 AI 安全研究所（AISI）独立评估
- 《纽约时报》《华尔街日报》《科技日报》等权威媒体
- 安全行业独立研究人员（Stanislav Fort、Bruce Schneier、George Hotz）
- 中国行业观察（360 周鸿祎、虎嗅、硅星GenAI）
- 彭博社、TechCrunch、InfoQ 等科技媒体

**主要争议点（已标注）**：关于 Mythos 能力稀缺性的质疑（来源：AISLE Stanislav Fort）和 Anthropic 营销是否过度的争议（来源：Bruce Schneier 及硅星GenAI），为多方印证而非单一来源。

---

## 八、展望与启示

### 8.1 AI 网络安全进入"自动化攻防"阶段

Mythos 标志着一个转折点：AI 在网络安全领域已从"辅助工具"升级为"对抗主体"。这要求行业范式根本性转变：

- 从"人工渗透测试"到"AI 持续扫描"
- 从"签名特征检测"到"异常执行语义分析"
- 从"人类专家主导"到"人机协作防御"

### 8.2 安全治理框架的迫切需求

Mythos 暴露了 AI 时代安全治理的核心矛盾：
- 企业拥有影响全社会的 AI 能力，但公共监管框架严重滞后
- 能力集中在少数私人公司手中，社会风险由公众承担
- 跨国界的 AI 能力扩散与各国监管碎片化之间的张力

### 8.3 对中国的战略启示

Glasswing 联盟将中国排斥在外，周鸿祎"网络核武器"的比喻切中要害。中国需要：
- 加速自主漏洞挖掘智能体研发
- 建立 AI 时代的网络攻防能力对等机制
- 推动开源安全生态的系统性加固

---

## 参考文献

[1] Anthropic. Project Glasswing 官方公告. anthropic.com/glasswing, 2026-04-07
[2] Anthropic. Claude Mythos Preview 系统卡. red.anthropic.com/2026/mythos-preview, 2026-04-07
[3] 中信建投证券. Anthropic 最强模型 Mythos 推出研究报告. 2026-04-15
[4] UK AI Security Institute (AISI). Mythos 模型独立评估. 2026-04
[5] TechCrunch. Anthropic Mythos AI model preview security. 2026-04-07
[6] The New York Times / 科技日报. AI 新模型拉响网络安全攻防警报. 2026-04-20
[7] 彭博社. Anthropic Mythos 遭未授权访问事件. 2026-04-22
[8] 36氪. 提前泄露的 Claude 绝密模型"救了"苹果、微软和谷歌. 2026-04-08
[9] 虎嗅. Mythos 风暴：一个 AI 模型如何让华盛顿和华尔街同时"拉响警报". 2026-04-13
[10] 硅星GenAI. Anthropic 终于如愿以偿，亲手训出了"强大到威胁人类"的 Mythos. 2026-04-08
[11] 周鸿祎（360）. 对话：美国 Mythos 改变攻防规则，AI 正在制造新的"网络核武器". 观察者网, 2026-04-27
[12] Stanislav Fort (AISLE). Mythos 漏洞发现：噱头大于实质. CSDN, 2026-04-12
[13] Scientific American. What is Mythos, Anthropic's unreleased AI model, and how worried should we be? 2026-04-17
[14] Aviatrix. Anthropic's Claude Mythos AI Model: A Double-Edged Sword in Cybersecurity. 2026-04-10
[15] METR. Mythos 评测结果内部报告（引用自多方报道）

---

*本报告数据截至 2026 年 5 月 13 日。部分事件（如 Mythos 后续发展）持续演进中，建议结合最新信息交叉验证。*
