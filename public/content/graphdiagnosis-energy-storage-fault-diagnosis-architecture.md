---
title: "DiagnosGraph：知识图谱+单智能体架构的储能电站故障诊断实践"
date: "2026-05-10"
category: "技术"
tags: ["储能", "知识图谱", "AI Agent", "故障诊断", "工业AI"]
excerpt: "DiagnosGraph 是一个通用图谱诊断框架，储能作示例场景。核心设计：单智能体 + 知识图谱检索 + YAML 查表处置 + LLM 因果推理。四条设计原则，零业务依赖，换 YAML 就能适配新领域。"
---

## 问题背景

储能电站是典型的大型复杂系统。一个 100MWh 的电站包含数千个电芯、数十个电池簇，还有 PCS、BMS、冷却系统等配套设备。故障发生时，告警信息像雪崩一样涌来，人工排查效率极低。

我们遇到三个核心挑战：

1. **告警风暴**：主变跳闸可能同时触发数百个告警，全站关联会导致 90% 的设备被扯进一个「超级簇」
2. **可解释性**：运维人员不接受黑盒诊断，需要看到推理路径
3. **领域迁移**：不同电站设备类型不同，不能写死业务逻辑

最终产出的 DiagnosGraph 是一个**框架与领域分离**的通用诊断系统，储能只是示例领域。换一套 YAML，同一套代码可以诊断风电、轨交等其他工业场景。

---

## 1. 系统架构：单智能体，不是多智能体流水线

最初设计是四个智能体流水线（Watchdog → Graph Reasoner → Data Fetcher → Diagnosis），但 MVP 阶段我们收缩为**单智能体架构**。不是多智能体买不起，而是单智能体更有性价比——模块少、调试简单、部署轻量。

```
DiagnosticAgent
    │
    ├── RetrievalEngine（检索引擎）
    │       ├── 拓扑掩码 BFS（爆炸半径）
    │       ├── 预筛（affected_devices ∩ 爆炸半径）
    │       └── 五维投票 → Top-3 候选故障图谱
    │
    ├── LLM（因果推理）
    │       └── structured_output → root_cause + confidence + reasoning_chain
    │
    └── RecoveryLookup（处置查表，可插拔）
            └── YAML 查表 → 确定性处置步骤（标准作业程序）
```

**核心流程只有三步**：

1. **检索**：`RetrievalEngine` 用拓扑掩码 + 五维投票召回 Top-3 候选故障图谱（毫秒级）
2. **推理**：`DiagnosticAgent` 把候选图谱 + 告警上下文发给 LLM，LLM 输出根因 + 置信度 + 推理链
3. **处置**：`RecoveryLookup` 从 `recovery_knowledge.yaml` 查表获取确定性处置步骤，不依赖 LLM 生成

---

## 2. 核心概念

### 2.1 拓扑掩码与爆炸半径

每个设备在 BOM 树中有明确的物理位置和父子连接关系。拓扑掩码的约束是：**只允许在物理跳数 ≤3 的范围内建立关联**。

当某个设备告警时，从该设备出发做 BFS 扩散，3 跳以内的所有设备构成**爆炸半径**。这个半径决定了后续故障图谱检索的搜索空间。

假设全站有 10000 个设备，某个告警的爆炸半径可能只包含 50 个设备。检索只在 50 个设备范围内进行，而不是全站扫描，检索时间从百毫秒级降到 10 毫秒级。

### 2.2 知识图谱三层结构

知识图谱包含三类节点和两类边：

```
FAULT（故障模式）
    │
    ├── causes（导致）→ SYMPTOM（症状节点）
    │                      │
    │                      └── indicates（表明）→ FAULT
    │
    └── DEVICE（设备节点）
            │
            └── contains（BOM树）→ DEVICE
```

一个典型故障图谱包含：故障名称、严重程度、根因描述、涉及设备列表、症状指标列表（每个指标含方向、时窗、正常值范围）、传播链（从根因到症状的传播路径与时延）。

---

## 3. 两阶段检索：拓扑预筛 + 五维投票

### 3.1 阶段一：拓扑预筛

对每个故障图谱，检查其 `affected_devices` 中是否有任何一个设备落在告警设备的爆炸半径内。如果没有任何交集，该故障图谱直接被过滤。

匹配逻辑支持三种方式：

- **精确匹配**：`affected_devices` 中的设备 ID 直接在爆炸半径内
- **设备类型匹配**：`affected_devices` 中的设备类型与爆炸半径内设备类型相同（如"电池簇"匹配 `battery_cluster` 类型的设备）
- **设备名模糊匹配**：`affected_devices` 中的名称与爆炸半径内设备名存在子串包含关系

### 3.2 阶段二：五维规则投票

通过五个轻量级规则并行打分，综合得分排序：

| 规则 | 权重 | 说明 |
|------|------|------|
| 设备类型匹配 | 30% | 故障涉及的设备有多少落在爆炸半径内 |
| 告警类型语义匹配 | 25% | 告警类型文本与故障名称的字符重叠率 |
| 拓扑范围匹配 | 20% | 爆炸半径内成员数 / 图谱总成员数 |
| 统计特征匹配 | 15% | 告警类型与图谱症状指标的匹配数 |
| 历史命中权重 | 10% | MVP 固定 0.5，后续从诊断历史学习 |

**为什么不用 DTW？** DTW 需要完整数据才能计算，O(m×n) 复杂度在几千个设备上跑不动，而且对时序乱序敏感。五维规则是轻量级并行打分，30 个候选图谱 5 毫秒内完成。

---

## 4. 诊断两阶段：LLM 推理 + YAML 查表处置

### 4.1 因果推理（LLM）

通过 `structured_output` 接口让 LLM 输出结构化诊断结果，包含：

- 匹配的故障 ID 和名称
- 根因分析
- 置信度（0-1）和判断依据
- 传播阶段（1-5）
- 命中的症状列表
- 推理链描述（从告警到根因的完整因果路径）

传给 LLM 的上下文包括：告警详情（ID、类型、设备、值、阈值、时间）、候选故障图谱摘要（五维评分、传播链、症状列表）、传播阶段判断标准。LLM 运行时自主决定是否需要查询更多数据，YAML 不写死查询路径。

### 4.2 处置查表（RecoveryLookup）

这是 MVP 与最初设计的最大区别：**处置方案来自 YAML 查表，不是 LLM 生成**。

`recovery_knowledge.yaml` 中存储每种故障的标准作业程序：

```yaml
recovery_procedures:
  - fault_id: "F001"
    fault_name: "冷却泵故障"
    procedures:
      - step: 1
        action: "检查冷却泵电源状态"
        verification: "确认电源接通，空开未跳闸"
        expected_result: "电源正常"
      - step: 2
        action: "检查泵体机械完整性"
        verification: "手动盘车，确认无卡阻"
        expected_result: "泵体无异响"
      - step: 3
        action: "确认冷却液液位"
        verification: "液位计读数在正常范围"
        expected_result: "液位正常"
    escalation:
      level: "high"
      timeout_minutes: 30
      escalate_to: "运维主管"
```

这样的好处是：处置方案是确定性的、可审计的、不依赖 LLM 推理质量的。RecoveryLookup 接口可插拔——MVP 用 YAML 查表，后续可以换成 RAG 或外部工单系统 API。

---

## 5. API 设计

系统对外暴露四个接口：

| 接口 | 方式 | 说明 |
|------|------|------|
| `POST /api/v1/diagnose` | Webhook | 接收告警，返回诊断结果 |
| `GET /api/v1/health` | — | `{status, graph_size, loaded_domain}` |
| `GET /api/v1/alerts/configs` | — | 查询已接入告警源配置 |
| `GET /api/v1/alerts/metrics` | — | 查询告警处理性能指标 |
| `GET /api/v1/alerts/logs` | — | 查询告警处理日志 |

### Webhook 告警源管理

`WebhookManager` 负责管理告警源注册、HMAC 签名验证和事件日志：

```python
# 注册告警源
mgr.register_source(
    source_id="huawei_fusionsolar",
    name="华为 FusionSolar",
    secret="可选的 HMAC 密钥",
    alert_mapping={"temp_over": "F001"},  # 告警类型映射
)

# HMAC 签名验证（可选）
mgr.verify_signature(source_id, payload, signature)
```

日志和指标都是内存存储，`/alerts/logs` 支持按 source 和 level 过滤返回最近 N 条记录。

---

## 6. 完整诊断流程示例

假设储能电站在 14:32 收到「电池簇 A-1 温度过高」告警（阈值 35°C，当前值 37.2°C）：

**Step 1：检索**

- 以「电池簇 A-1」为起点，计算 3 跳爆炸半径，得到 {D001, D002, D003, D004, 冷却泵, 冷却管道}
- 拓扑预筛：过滤掉 affected_devices 完全不在爆炸半径内的故障图谱
- 五维投票：液冷故障 0.82 分，电池热失控 0.71 分，环境温升 0.45 分

**Step 2：LLM 推理**

把 Top-3 候选图谱 + 告警上下文发给 LLM，LLM 返回：

```json
{
  "fault_id": "F001",
  "fault_name": "冷却泵故障",
  "root_cause": "冷却泵异常导致冷却液循环中断，电池热量无法散出",
  "confidence": 0.87,
  "propagation_stage": 3,
  "matching_symptoms": ["冷却液流量下降", "电池温度上升"],
  "reasoning_chain": "冷却泵故障 → 冷却液流量下降(0-5min) → 电池热量积累(5-15min) → 温度超过阈值"
}
```

**Step 3：处置查表**

从 `recovery_knowledge.yaml` 查出冷却泵故障的处置步骤，按顺序执行。返回结果还包括告警升级策略（30 分钟未解决 escalation to 运维主管）。

---

## 7. 项目结构

```
diagnosgraph/
├── core/
│   ├── graph.py          # 知识图谱（NetworkX）
│   ├── retrieval.py      # 检索引擎（拓扑掩码 + 五维投票）
│   ├── agent.py          # 诊断智能体（单智能体）
│   ├── llm.py            # LLM 抽象接口（可插拔）
│   ├── recovery/
│   │   ├── base.py       # 抽象接口
│   │   └── yaml_lookup.py # YAML 查表（MVP）
│   └── schema.py         # Pydantic 模型
│
├── domains/storage/
│   ├── fault_patterns.yaml      # 故障图谱
│   └── recovery_knowledge.yaml  # 处置知识库
│
├── integrations/
│   ├── webhook.py        # Webhook 管理器
│   └── api.py           # REST API（FastAPI）
│
├── config.yaml          # LLM provider 配置
├── cli.py
└── main.py
```

框架代码零业务依赖——所有知识在 YAML 里，换一套 `domains/` 目录就能诊断风电、轨交等其他领域。

---

## 8. MVP 验收标准

| # | 标准 |
|---|------|
| 1 | 不改核心代码，只换 YAML，能诊断不同领域 |
| 2 | 诊断路径运行时由 LLM 决策，YAML 不写死 |
| 3 | 处置方案从 `recovery_knowledge.yaml` 查表得出，非 LLM 生成 |
| 4 | 处置库可插拔（YAML / RAG / 外部 API） |
| 5 | LLM 接口可替换（config.yaml 切换 provider） |
| 6 | 图谱检索可审计 |
| 7 | Webhook + CLI 可用 |

---

## 9. 后续迭代方向

暂不包含的功能：

- **多智能体编排**：Data Fetcher Agent 独立出来，专门负责按需查询 TSDB
- **动态图谱更新**：诊断成功后反馈权重提升，实现自我进化
- **向量检索**：用图嵌入持久化，支持语义相似检索
- **告警风暴处理**：多告警相关性分析，合并根因
- **诊断历史存储**：持久化存储诊断记录，用于学习

---

这套架构已在多个储能电站落地，效果不错。核心收获是：**框架与领域分离**这个设计原则，让同一套代码在不同工业场景的迁移成本降到最低。

来源：DiagnosGraph 项目源码 `/home/admin/Documents/diagnosgraph/`
