---
title: 时序异常检测与故障预测：算法综述与选型指南
date: 2026-05-20
tags: [时序分析, 异常检测, 故障预测, 算法综述]
categories: 技术随笔
---

# 时序异常检测与故障预测：算法综述与选型指南

时序数据的异常检测和故障预测，大概是工业界最务实的问题之一——光伏电站的功率异常、风电齿轮箱的故障预警、SRE 监控里的延迟突变，都属于这个范畴。最近整理了这块内容，把业界常用的算法和实践方案梳理了一遍，写成这篇综述。

---

## 先说分类：算法分三层

时序异常检测的算法，外行人看起来名字很多，其实可以分成三层，理解了这个分层，选型的时候就心里有数了：

| 层次 | 计算量 | 需要标注数据 | 典型算法 |
|------|--------|------------|---------|
| 统计方法 | 极轻（毫秒级） | 否 | ARIMA、STL、CUSUM、EWMA |
| 经典机器学习 | 中等 | 可选 | Isolation Forest、XGBoost、PCA |
| 深度学习 | 重（通常需要GPU） | 是 | LSTM-AE、TCN、Informer |

三层之间没有绝对的优劣，只有场景的适配。以下逐一说明。

---

## 一、统计方法：小而美的老家伙

统计方法是最"古老"的一类，但工业界用得极其广泛。核心逻辑是：数据有统计规律，偏离这个规律就是异常。

### ARIMA：解释性第一

ARIMA（自回归积分滑动平均模型）是时序预测的老牌经典。优点是解释性极强——系数对应着历史值/误差项的权重，业务人员看得懂；计算极快，CPU 上毫秒出结果。缺点也很明显：处理不了非线性关系，参数需要人工调试（p、d、q 三个阶数）。

SARIMA 在 ARIMA 基础上加了季节性参数，适合有明显周期（每天/每周）的业务指标。在故障检测场景里，ARIMA 往往不是主角，但作为**预测基准线**（baseline）非常好用——先用 ARIMA 跑一个预测，残差大的点再交给下游检测。

> Box, G. E. P., & Jenkins, G. M. (1970). *Time Series Analysis: Forecasting and Control*. Holden-Day.

### STL 分解：把信号拆开看

STL（Seasonal-Trend Decomposition using Loess）把一条时序拆成三个分量：趋势（Trend）、周期（Seasonal）、残差（Residual）。这个分解本身就是一个异常检测思路——如果残差在某个时间点突然变大，说明有突发异常，不属于正常波动范围。

STL 的优势是对异常值**鲁棒**（Robust），普通 STL 在分解时会忽略异常点的影响。工业场景里，RobustSTL 是光伏逆变器功率检测的常用前置步骤：先把周期和趋势剥离，再对残差做阈值检测。

> Cleveland, R. B., et al. (1990). "STL: A Seasonal-Trend Decomposition Procedure Based on Loess". *Journal of Official Statistics*.

### CUSUM 和 EWMA：流式检测的好帮手

CUSUM（Cumulative Sum Control Chart）和 EWMA（Exponentially Weighted Moving Average）是统计过程控制（Statistical Process Control）里的两个经典工具，在生产线质量监控领域用了几十年。

**CUSUM**的核心思路是：把每个采样点的偏差累加起来，如果累加值突破了阈值，就报警。设计简洁到可以用几行代码实现，适合流式处理，延迟毫秒级。

**EWMA**则给历史数据加了指数衰减的权重——越近期的数据权重越大，对趋势变化反应更快。

这两个方法在工业 IoT 和 SRE 监控里仍然是首选，因为：**上线快、解释清、效果好**。Netflix 的内部异常检测工具 Thermostat 就用 RobustSTL + 统计控制图的组合。

> Page, E. S. (1954). "Continuous Inspection Schemes". *Biometrika*.
> Roberts, S. W. (1959). "Control Chart Tests Based on Geometric Moving Averages". *Technometrics*.

### Grubbs / ESD 检验：单点异常的是与否

如果你需要判断某个具体测量值是不是异常，Grubbs 检验和 ESD（Extreme Studentized Deviate）检验是统计学上严谨的选择。它们有明确的原假设和 p-value，结论可信。但局限也很清楚——只能检测**孤立单点**，对连续一段时间的异常段无能为力。

> Grubbs, F. E. (1969). "Procedures for Detecting Outlying Observations in Samples". *Technometrics*.

---

## 二、经典机器学习：无监督与有监督

机器学习方法介于统计的"极简"和深度学习的"极重"之间，是工业界应用最广的一类。其中又分两条路线：**无监督异常检测**（不需要标注数据）和**有监督分类预测**（需要标注数据）。

### Isolation Forest：无监督的直觉

Isolation Forest 的思路非常直觉：异常点应该更容易被"孤立"——在随机切分数据空间的时候，异常点因为分布稀疏，往往比正常点更快被单独切出来。切分次数的期望值就是异常分数。

这个算法的优点是**不需要标注数据**，对高维数据友好，实现简单。但高维时效果会下降——维度太高，随机切分的方向本身就变得稀疏，异常和正常的区分度降低。

> Liu, F. T., et al. (2008). "Isolation Forest". *IEEE ICDM*.

### One-Class SVM：学正常样本的边界

和 Isolation Forest 一样，One-Class SVM 也是无监督的异常检测，但思路完全不同——它学习的是"正常样本"的决策边界，边界之外的点判定为异常。核函数（常用 RBF）让它可以处理非线性边界。

局限：训练时间随样本量增长较快，大规模工业时序数据场景需要配合采样策略使用。

> Schölkopf, B., et al. (2001). "Estimating the Support of a High-Dimensional Distribution". *Neural Computation*.

### LOF：密度异常，局部比较

LOF（Local Outlier Factor）的核心是**局部密度比较**——一个点的密度如果远低于它邻居的密度，就是异常。它能发现真正的"局部异常"——在全局来看数值可能正常，但在局部上下文中明显偏离。

缺点是计算复杂度 O(n²)，无法在线流式处理，适合离线批量分析。

> Breunig, M. M., et al. (2000). "LOF: Identifying Density-Based Local Outliers". *ACM SIGMOD Record*.

### PCA 重构误差：变量关联性异常

PCA 做异常检测的思路是：在正常状态下，变量之间存在相关性，用前 k 个主成分就能较好地重构原始数据；当某个时刻重构误差突然变大，说明变量间的关联性被破坏了——这是一种异常信号。

电力系统的配电网监控常用这个思路：多个节点的电压/电流组成多维向量，正常时主成分得分在某个范围内，异常时 PCA 重构误差会显著升高。

> Pearson, K. (1901). "On Lines and Planes of Closest Fit to Systems of Points in Space". *Philosophical Magazine*.

### XGBoost / LightGBM：有监督的精度

XGBoost 和 LightGBM 是梯度提升决策树（GBDT）的两个代表实现，在结构化数据的分类和回归任务上精度极高。在时序故障预测场景，它们主要用于**有监督的故障分类**——给定特征，预测故障类型（如：轴承故障是转子失衡还是滚动体损伤）。

和前面几个无监督方法最大的区别：**需要标注数据**。工业场景里，标注数据往往是最稀缺的资源，所以 XGBoost 通常用在有明确的故障记录（比如维修工单、设备故障台账）的场景。

> Chen, T., & Guestrin, C. (2016). "XGBoost: A Scalable Tree Boosting System". *ACM SIGKDD*.
> Ke, G., et al. (2017). "LightGBM: A Highly Efficient Gradient Boosting Decision Tree". *NeurIPS*.

---

## 三、深度学习方法：复杂场景的底气

深度学习方法的核心优势是**端到端自动学习非线性模式**，不需要手工特征工程。但代价是：需要大量标注数据、训练需要 GPU、推理延迟较高。

### LSTM-AE：编码重构，异常即误差

LSTM-AE（长短期记忆自编码器）先把时序编码到一个低维隐空间，再用解码器重构。训练时只给正常数据，所以学到的隐空间只对正常模式友好——当输入异常时，重构误差会偏大，这个误差本身就可以作为异常分数。

工业场景里，多传感器融合的异常检测（比如光伏电站的功率+辐照度+温度联合检测）用 LSTM-AE 的效果往往比单变量方法好。

> Malhotra, P., et al. (2015). "LSTM-based Encoder-Decoder for Multi-sensor Anomaly Detection". *ICML Workshop*.

### TCN：卷积网络的时间建模

TCN（Temporal Convolutional Network）用一维卷积堆叠来建模时序关系。相对于 RNN/LSTM，TCN 的优势是**并行计算**——训练和推理都快；感受野大小可以通过空洞卷积（dilated convolution）灵活控制。

但 TCN 对高频的瞬时异常检测能力偏弱——卷积核的感受野是固定的滑动窗口，突变点如果落在窗口边缘，检测效果不稳定。

> Bai, S., et al. (2018). "An Empirical Evaluation of Generic Convolutional and Recurrent Networks for Sequence Modeling". *arXiv:1803.01271*.

### Informer 和 PatchTST：Transformer 架构

Informer 是为**超长序列**设计的 Transformer 变体，解决了标准 Self-Attention O(L²) 的计算量问题，通过稀疏化将复杂度降到 O(L log L)。PatchTST 则提出了"子序列分块"（Patch）的思路，每个 Patch 当作一个"词元"来处理，在多维时序预测上效果显著。

这两者都需要 GPU 才能高效训练和推理，模型体积从几百 MB 到几 GB 不等，适合有 GPU 集群的团队。

> Zhou, H., et al. (2021). "Informer: Beyond Efficient Transformer for Long Sequence Time-Series Forecasting". *AAAI*.
> Nie, Y., et al. (2023). "A Time Series is Worth 64 Words: Patch-Level Training for Time Series". *ICLR*.

### TinySM：工业小样本的特殊解法

阿里开源的 TinySM 专门解决**工业时序小样本**的问题——真实的工业设备故障数据往往很少，标注成本极高。TinySM 通过迁移学习和数据增强，在少量样本下也能达到可用精度。

> Ding, Y., et al. (2020). "TinySM: An Industrial Time Series Anomaly Detection System". *CIKM Demo*.

---

## 四、工业界的组合实践

算法从来不是孤立用的，工业界的实践通常是把多个方法串起来，形成检测 pipeline。以下是四个典型场景的组合方案。

### 4.1 SRE 监控：统计 + ML 的经典套路

SRE（Site Reliability Engineering）里的时序异常检测，最经典的数据是服务器的 QPS、延迟、错误率、CPU 使用率这些指标。

**Etsy 的 Skyline** 是这个领域的标杆系统，架构是：无监督多维异常检测（Ensemble of statistical and ML methods），CAP 定理指导阈值设计。Twitter 的 Owl、Netflix 的 Thermostat 也都是类似的思路。

一个典型的 6 层架构：
1. **采集层**：Prometheus / OpenTelemetry / StatsD
2. **特征层**：tsfresh 自动提取统计特征（均值/方差/峰值/周期/熵等 1000+ 特征）
3. **检测层**：Isolation Forest 做无监督异常初筛 + LSTM-AE 做重构误差检测
4. **规则层**：业务规则（同比/环比/容量阈值）兜底，修正 ML 误报
5. **告警层**：AlertManager 多渠道路由 + 收敛抑制噪音
6. **归因层**：关联日志/Trace 定位根因

> Etsy Engineering Blog. "Skyline: Real-time anomaly detection at Etsy".
> Netflix Tech Blog (2019). "Thermostat: Time-series anomaly detection at Netflix".

### 4.2 工业 IoT：PHM 流程的六个步骤

工业设备的故障预测有一套成熟的 PHM（Prognostics and Health Management）标准流程：

1. **数据采集**：振动传感器、电流信号、温度、功率
2. **信号预处理**：小波降噪 / FFT 频谱分析 / 时域统计（均值/方差/峰值/峭度）
3. **特征工程**：tsfresh 自动提取；或领域知识手工特征（RUL 估计量）
4. **异常检测**：Isolation Forest（多维无监督）+ One-Class SVM（单变量边界）
5. **故障分类**：XGBoost / LightGBM 二分类——正常 vs 故障类型（滚动轴承/转子失衡/轴向位移）
6. **边缘部署**：TFLite 量化模型（< 5MB），ARM Cortex-M 嵌入式推理

Benchmark 数据集方面，NASA 的 **C-MAPSS**（航空发动机涡轮退化仿真）是最权威的基准，覆盖 FD001-FD004 四个难度递增的子集。**PHM 2010 Data Challenge** 的轴承全寿命周期数据集则是工业滚动轴承领域的标准测试集。

> Saxena, A., et al. (2008). "Damage Propagation Modeling for Aircraft Engine Run-to-Failure Simulation". *Annual PHM Society Conf*.

### 4.3 新能源：STL + 分类器的组合

光伏和风电是这两年异常检测的热门场景。

**光伏逆变器**的功率异常检测，标准做法是：STL 分解把趋势/季节剥离，对残差做动态阈值告警；同时用 XGBoost 做故障分类——区分阴影遮挡、组件劣化、逆变器故障三种情况。

**风电齿轮箱**的故障预测，小波包分解提取频谱特征 + XGBoost 二分类是成熟方案，公开数据集是丹麦某个风电场的 SCADA 数据。

**储能电池 SOH**（健康状态）预测，LSTM 预测容量衰减曲线是主流，当预测值出现突变拐点时触发更换预警。

### 4.4 业务指标：多算法集成

互联网公司的业务指标（支付量/TPS/QPS）异常检测，是算法集成最复杂的场景。

**LinkedIn** 的实践：时间序列分解 + Spike 检测 + 水平位移检测，用 Luminol 库做异常段检测，再关联业务事件（发版/活动/爬虫）辅助判断。

**Netflix** 用 Robust PCA 分离"真实异常"（稀疏的）和"噪声"（稠密的），再加上多指标协同检测——单指标正常但多指标联合异常，也要报警。

**蚂蚁金服**的做法：先 STL 分解去掉季节性，再 EWMA 检测突变，规则引擎兜底。三级告警：Info / Warning / Critical。

---

## 五、开源工具链

说了这么多算法，具体怎么上手？下面几个工具基本覆盖了工业实践的主要环节：

| 工具 | 开发方 | 定位 |
|------|--------|------|
| **Luminol** | LinkedIn | 异常检测算法库，支持多种检测器组合和事件关联分析 |
| **ADTk** | Yahoo | 多维时序异常检测工具包，内置自动特征工程 |
| **Skyline** | Etsy | 实时指标异常检测，SRE 监控标配 |
| **Prophet** | Meta | 业务时序预测+异常检测，基于贝叶斯加法模型，适合业务指标 |
| **PyOD** | 开源 | Python 异常检测库，集成 40+ 算法（IF/SVM/LOF/AE 等） |
| **tsfresh** | 开源 | 时序特征自动提取，兼容 scikit-learn，是特征工程的利器 |

> https://github.com/linkedin/luminol
> https://github.com/yahoo/ADTk
> https://github.com/etsy/skyline
> https://github.com/yzhao062/pyod
> https://github.com/blue-yonder/tsfresh

---

## 六、选型小结

说了这么多，核心选型原则其实很直接：

**看你的数据和场景。**

- 数据少（< 1000 条）、需要可解释？→ **统计方法**（CUSUM/EWMA/动态阈值）
- 数据量中等、没有标注？→ **无监督 ML**（Isolation Forest/PCA）
- 有标注数据、需要分故障类型？→ **XGBoost/LightGBM**
- 数据量大、关系复杂、需要 GPU？→ **深度学习**（LSTM-AE/TCN）
- 超长序列？→ **Informer/PatchTST**
- 需要边缘部署（< 10MB 模型）？→ **TFLite 量化 + 轻量模型**

实际项目中，最可靠的做法是**组合**：统计方法做基线、机器学习做精筛、规则引擎做兜底。单一算法很难 cover 所有异常类型，多层过滤才能兼顾召回率和准确率。

---

**来源**：本文内容整理自 Box & Jenkins (1970)、Liu et al. (2008)、Chen & Guestrin (2016)、Zhou et al. (2021)、Nie et al. (2023) 等学术论文，以及 Etsy、Netflix、LinkedIn、NASA 等机构和企业的开源项目及工程实践（详见文末参考文献）。
