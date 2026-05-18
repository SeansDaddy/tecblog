---
title: 用 HeyGen HyperFrames 做 HTML 视频
date: '2026-05-18'
category: AI工具
excerpt: HyperFrames 是 HeyGen 开源的 HTML 视频合成框架——用 Web 技术做视频，无需视频软件。
---

# 用 HeyGen HyperFrames 做 HTML 视频

HyperFrames 是 HeyGen 开源的 HTML 视频合成框架。视频的源文件就是 HTML + GSAP + CSS，渲染靠浏览器，不需要 After Effects 或任何视频软件。

适合 AI Agent 介入的生产流程——改 HTML 比改视频工程文件容易得多，支持版本控制，调试成本低。

## 核心用法

**安装：**
```bash
npx hyperframes@latest
```

**渲染视频：**
```bash
npx hyperframes render index.html output.mp4
```

HTML 里每个 clip 用 `data-start` / `data-duration` 控制时间，GSAP timeline 驱动播放。HEYGEN_HF_TOKEN 环境变量需要设置，从 HeyGen 平台获取。

## 几个实际经验

1. emoji 字符在 headless Chromium 里会变成黑框，改用内嵌 SVG 替代
2. 背景音乐用 `ffmpeg -af volume=0.2` 压到 20% 再混，避免喧宾夺主
3. `npx hyperframes render` 在部分环境下可能超时，可降级到 Playwright + `window.__hf.seek()` 逐帧截图方案
4. 背景音乐来源推荐 Mixkit（`assets.mixkit.co/music/`），免费无需登录

来源：[github.com/heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)
