# 煎饼果子模拟器 · Jianbing Simulator

一款可以直接在浏览器里玩的中文街头早餐摊游戏。React + TypeScript + Vite，所有画面由 CSS、SVG 和 Canvas 绘制；无需账号、后端、付费接口或外部游戏服务。

## 本地运行

需要 Node.js 20 或更高版本。进入本目录后运行：

```bash
npm ci
npm run dev
```

打开终端显示的本地地址。正式构建：

```bash
npm run build
npm run preview
```

`dist/` 是可部署的静态文件。Vite 使用相对路径 `base: './'`，可放在 GitHub Pages 的仓库子路径下。

## 玩法

1. **摊面**：自由模式可先选原味、杂粮或紫米面糊。点「倒入面糊」，按住铁板用鼠标或手指画圈。覆盖越完整、形状越圆，评分越高。
2. **打蛋**：点鸡蛋，再在饼面按住拖动涂匀。双蛋订单需要点两次。
3. **翻面**：观察火候进度条，在绿色区间点「现在翻面」。太早夹生，太晚烧焦。
4. **刷酱、加料**：按顾客小票点食材。一次点击是一份；「加倍」点两次，「不要」则不要点。
5. **折叠**：从左边和右边的饼边分别向铁板中心拖动。
6. **装袋**：点「装袋出餐」结算。评分综合面饼、蛋液、火候、订单准确度、折叠和速度。

主线共 10 关，完成营业额目标解锁下一关。无尽模式累计三位流失顾客时结束；自由制作模式不限时。金币可在商店购买铁板、刮板和出餐升级，以及新食材和装饰。

## 存档

存档自动写入当前浏览器的 `localStorage`，含关卡、星级、金币、食材、升级、无尽纪录、音效、成就和当前对局。刷新进行中的对局后会暂停，点击继续即可。设置页可导出和导入 JSON；重置存档须经过两次确认。损坏的存档会恢复到默认状态。不同设备不会自动同步，请用 JSON 文件转移。

## 项目结构

```text
src/
  components/    铁板 Canvas、顾客 SVG
  data/          关卡、顾客、食材和订单配置
  game/          制作状态、覆盖度、评分和星级
  systems/       版本化存档、Web Audio 音效
  App.tsx        游戏流程与界面
  styles.css     响应式街头摊位视觉
tests/           浏览器实际操作脚本
.github/workflows/deploy.yml
```

## GitHub Pages 发布

本目录设计为一个**独立仓库**。将本目录内容放到新 GitHub 仓库根目录，推送至 `main` 或 `master`；在仓库 **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**。`deploy.yml` 会执行 `npm ci`、`npm run build`，并发布 `dist/`。如需在现有多项目仓库中发布，请把工作流移动到仓库根目录的 `.github/workflows/`，并给 `npm ci`、构建和上传路径加上 `jianbing-simulator/` 前缀。

## 验收

| 检查项                   | 状态与证据                                                        |
| ------------------------ | ----------------------------------------------------------------- |
| 启动、构建               | `npm run dev` 启动；`npm run build` 通过                          |
| 一份煎饼完整流程         | `tests/playthrough.mjs` 浏览器实测到出餐评分                      |
| 真实拖动摊面、涂蛋、折叠 | 浏览器鼠标路径实测；移动端触控命中实测                            |
| 火候影响评分             | 评分函数按翻面火候计算；实测在绿色区间翻面                        |
| 订单与错误配料影响满意度 | 小票要求与实际用量逐项比较，禁忌香菜额外扣分                      |
| 关卡结算、星级、解锁     | `tests/level-and-mobile.mjs` 完成第一关两单、出现星级并解锁第二关 |
| 金币累计、消费、升级     | 通关获得金币；`tests/save-and-endless.mjs` 实测消费并刷新保留     |
| 无尽模式结束与纪录       | 同上，实测三位顾客流失后结算并保存最高纪录                        |
| 自由制作                 | `tests/playthrough.mjs` 实测自由搭配与评价                        |
| 刷新、导出导入、损坏恢复 | `tests/save-and-endless.mjs` 实测                                 |
| PC 与手机                | 1440px 鼠标与 390px 触控浏览器实测                                |

浏览器脚本使用 Playwright 和本机 Chrome，执行前先运行开发服务器，然后分别运行：

```bash
node tests/playthrough.mjs
node tests/level-and-mobile.mjs
node tests/save-and-endless.mjs
```

脚本里的 Chrome 路径目前为 Windows 默认安装路径；其他系统可修改 `executablePath`。截图输出会保存到 `tests/` 且被 Git 忽略。
