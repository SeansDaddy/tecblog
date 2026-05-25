# AI Agent Hook 机制：从原理到实践

AI Agent 的 Hook 机制，本质上是**事件驱动的生命周期拦截**——在 Agent 执行路径的各个节点插入自定义逻辑，监控、修改或中断主流程。

## 核心原理

Agent 处理一个请求，会依次经过：收到请求 → 调用 LLM → 生成工具调用决策 → 执行工具 → 拿到结果 → 再次调用 LLM → 返回结果。每个节点都可以被 Hook 截获。

三个共同特征：

- **事件驱动**：每个生命周期节点对应一个事件（如 `on_llm_start`、`on_tool_end`），命名约定在各框架中基本一致
- **链式传递**：Handler 之间互不影响，主流程不会被单个 Handler 阻塞
- **上下文携带**：事件触发时携带当前执行状态，Handler 可以读取，也可以注入额外数据

---

## Hook 事件体系

| 层级 | 事件 | 触发时机 |
|------|------|----------|
| LLM | `on_llm_start` / `on_llm_end` / `on_llm_error` | LLM 开始处理 / 生成完成 / 调用出错 |
| Agent | `on_chain_start` / `on_chain_end` / `on_agent_action` | ReAct 循环开始/结束 / 工具决策 |
| Tool | `on_tool_start` / `on_tool_end` / `on_tool_error` | 工具执行各阶段 |

---

## OpenClaw Hook 系统

OpenClaw 的 Hook 以**脚本文件**形式存在，放在 `.openclaw/hooks/` 目录下，文件名约定事件名。Gateway 启动时扫描目录并注册脚本，事件触发时自动执行，支持 Shell / Python / JavaScript。

### 核心事件

| 事件 | 触发时机 |
|------|----------|
| `onMessage` | 收到用户消息时（Agent 处理之前） |
| `before_tool_call` | 工具执行前，可拦截、修改参数、请求审批 |
| `after_tool_call` | 工具执行后，可检查结果、注入数据 |
| `onAgentStart` / `onAgentEnd` | Agent 开始/完成处理 |
| `onChannelConnect` / `onChannelDisconnect` | 渠道连接建立/断开时 |

### 配置

在 `openclaw.yaml` 中声明脚本目录：

```yaml
hooks:
  scripts_dir: ./.openclaw/hooks
  enabled: true
```

脚本文件名约定：`{event-name}.{ext}`（如 `onMessage.py`、`before_tool_call.js`）。

### 典型场景

**消息预处理**（`onMessage`）——在 Agent 处理前对输入做清洗或注入上下文。

**工具执行审批**（`before_tool_call`）——拦截高危工具调用，触发人工确认（`requireApproval`），是 OpenClaw v2026.3.28 Human-in-the-loop 的核心机制。

```javascript
// 拦截 db_execute 工具中的 DELETE/DROP 操作
export default async function before_tool_call({ tool, args, requireApproval }) {
    if (tool !== "db_execute") return;
    const sql = (args.query || "").toUpperCase();
    if (sql.includes("DELETE") || sql.includes("DROP")) {
        await requireApproval({
            tool,
            args,
            reason: "数据删除操作需人工确认",
            timeout: 300
        });
    }
}
```

**执行后审计**（`after_tool_call`）——记录工具调用参数和返回值。

### OpenClaw vs LangChain

| 维度 | OpenClaw | LangChain |
|------|----------|----------|
| 实现形式 | 独立脚本文件 | 类继承 + 方法重写 |
| 注册方式 | 文件名约定 + 启动时扫描 | config 配置传入 |
| 状态共享 | 弱（脚本间无共享状态） | 强（Handler 可通过闭包共享） |
| 工具级拦截 | 支持 | 支持 |
| 短路/拒绝 | 支持（requireApproval） | 支持（抛出异常） |

---

## Hermes Hook 机制

Hermes 没有显式 "Hook" 命名，通过以下机制类比实现类似能力。

### Skill 条件触发

Skill 的 YAML frontmatter 中有 `trigger` 字段，按需动态匹配加载，而非全部预加载。

```yaml
---
name: alarm-query
trigger: |
  匹配条件：用户提到"告警"、"诊断"
---
```

### Cron 定时任务

`hermes cron` 命令定时触发 Skill 执行，本质是时间维度的 Hook。

```bash
hermes cron create "0 9 * * *" /daily-report
```

### 启动加载

Hermes 启动时按顺序加载：配置文件 → 已启用 Skill → SOUL.md。Skill 的 `required_environment_variables` 等字段在加载时校验环境依赖，是一种启动时的条件拦截。

### MCP 扩展

通过 MCP 协议接入外部工具服务，属于外部 Hook——Hermes 通过 MCP 调用外部工具，外部工具返回结果。

### OpenClaw vs Hermes

| 维度 | OpenClaw | Hermes |
|------|----------|--------|
| 粒度 | 工具级 / 消息级 / 会话级 | Skill 级（粗粒度） |
| 拦截位置 | 执行前、执行后 | Skill 加载时 |
| 审批机制 | 原生（requireApproval） | 无原生支持 |
| 状态共享 | 弱 | 强（三层记忆架构） |
| 脚本语言 | Shell/Python/JS 均支持 | Skill YAML + Markdown |

---

## 框架综合对比

| 维度 | LangChain | OpenClaw | Hermes |
|------|-----------|----------|--------|
| 风格 | 类继承 | 脚本文件 | Skill 声明 |
| 事件粒度 | 细（10+ 事件） | 中（消息/工具/会话） | 粗（Skill 级） |
| 工具级拦截 | on_tool_start/end | before/after_tool_call | 无 |
| 短路/拒绝 | 支持 | 支持 | 不支持 |
| 适用场景 | 通用开发 | 运维自动化 | 知识管理 / 任务执行 |

---

*来源：[AI Agent Hook 机制调研报告 2026-05-25]()*