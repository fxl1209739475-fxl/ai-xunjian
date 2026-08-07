# 动画丰富度扩展 V1

## 版本边界

- 稳定 ID：`semantic-motion-expansion-v1`
- 状态：独立试验版，不替换默认 `cover-poster-v2`
- 旧版冻结：`examples/封面海报-v2/`、`examples/dynamic-poster-baseline/` 均不修改
- 预览：`gallery.html`
- 渲染入口：`index.html`
- 画布：1080×1920、30fps、33 秒、无音轨
- 状态：2026-07-28 已通过渲染与双端预览验收

## 六种语义动画

| 类型 | 视觉动词 | 适用口播 |
| --- | --- | --- |
| `comic-panels` | 分格、碰撞、中心落版 | 多模块、多角色、并列能力组成一个系统 |
| `speed-tunnel` | 穿越、受阻、机会飞走 | 效率差、边际成本、时间成本、速度对比 |
| `magnet-merge` | 吸附、汇聚、放大 | 能力交叉、资源整合、多个环节形成壁垒 |
| `pressure-stack` | 堆叠、压缩、反弹 | 信息过载、需求拥堵、容量限制、系统瓶颈 |
| `fork-path` | 分叉、赛跑、结果落版 | 选择、取舍、A/B 路径、机会成本 |
| `ripple-feedback` | 扩散、触发、反馈回流 | 因果链、连锁反应、闭环、系统协同 |

## 防重复规则

1. 先从口播提取一个主视觉动词，再选择动画，不按题材关键词机械匹配。
2. 相邻全画幅镜头不能使用同一空间结构：分栏、中心辐射、路径、堆叠、环形至少轮换。
3. 最近五条视频已经使用过的主构图，本期最多复用一次。
4. 每条视频至少自制一个“本期专属隐喻”，本库只提供运动语法，不提供整镜复制。
5. 漫画印刷语言只作为层次增强：半色调、错版、硬边投影、分格、速度线；禁止复制任何影视角色、标志或具体镜头。

## 本地预览

```bash
npm run dev   # 仓库根目录
```

打开 `http://127.0.0.1:5178/effects/animation-richness/gallery.html`。

## HyperFrames 验收

```bash
npx hyperframes@0.6.64 lint
npx hyperframes@0.6.64 render -q standard -f 30 -o preview.mp4 --workers 1
```

每个镜头至少检查入场、机制、完成三帧；最终状态停留 0.6–1.3 秒，读懂后退场。

## 已验证结果

- `node --check animation.js`：通过
- `hyperframes lint --verbose`：`0 errors / 0 warnings`
- `preview.mp4`：H.264、yuv420p、1080×1920、30fps、33 秒
- `qc/contact-sheet.jpg`：6 个镜头 × 进入/中段/完成，共 18 帧
- `qc/final-states.jpg`：6 个镜头完成态总览
- `qc/gallery-desktop.png`：1440×1000，无横向溢出
- `qc/gallery-mobile.png`：390×844，无横向溢出
