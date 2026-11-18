# V2 美术规范与组件映射

## 方向

清晨街头早餐摊，以手绘水粉场景和深墨色线条统一画面。主色为奶油白 `#f5f2e9`、番茄红 `#cb4931`、蛋黄黄 `#edaa32`、墨绿 `#1d352b`、炭黑 `#202d2b`。背景保持低对比度，铁板与当前步骤是视觉中心。

## 新旧映射

| V1                          | V2                                                   | 保留的逻辑                         |
| --------------------------- | ---------------------------------------------------- | ---------------------------------- |
| 三栏 `.game-layout`         | 单幅街景、前景操作台、中央铁板、顾客站位、底部工具带 | `Run`、关卡倒计时、顾客耐心        |
| `CustomerPortrait` 几何头像 | 五位同画风全身角色，共用透明角色画页；按顾客种类切换 | `CustomerKind`、订单、情绪阈值     |
| `Griddle` 逐点圆片          | 连续轨迹面饼层、受热纹理、金属铁板和热气             | `batter`/`eggPaint` 点列与覆盖评分 |
| 简单色块配料                | Canvas 葱花环切、香菜叶、薄脆、火腿、芝麻分层绘制    | 食材用量、订单准确度               |
| 字符工具图标                | `IngredientArt` 各食材、刮板、翻铲、纸袋矢量绘制     | 原按钮、升级、食材解锁             |
| 静态操作卡片                | 顾客气泡与订单纸条、场景指示条、底部工具带           | 操作顺序、错误提示、结算           |

`game/engine.ts` 的覆盖度、评分和星级函数继续作为唯一规则来源。`systems/save.ts` 继续管理版本化存档；V2 只增加酱料轨迹与减少动态效果设置，并为旧存档补默认值。

## 场景素材

- `src/assets/street-dawn.png`：清晨街道与店铺，置于背景层。
- `src/assets/customers.png`：五位透明全身角色，依次为上班族、挑剔食客、香菜爱好者、香菜拒绝者、辣椒爱好者。
- `src/components/CounterProps.tsx`：食材容器、酱料瓶与台面前景。
- `src/components/IngredientArt.tsx`：独立 SVG 路径的食材、工具和包装图形。
- `src/components/Griddle.tsx`：铁板、面饼、蛋液、受热斑、酱料轨迹、配料与折叠的 Canvas 绘制。

场景与角色使用内置 `imagegen` 工具制作。提示词如下：

> Create a production-ready 2D hand-painted background plate for a modern indie browser cooking game set at a Chinese jianbing street breakfast stall at dawn. Wide 16:9 composition, camera from behind the vendor looking toward the customer sidewalk. Atmospheric Beijing-style street facades, bike silhouettes, soft morning haze, a dark green fabric awning across top, warm tomato-red shop signage with NO legible writing, metal and wood counter edges at bottom left/right. Crucially leave the large CENTER and LOWER CENTER clean and visually quiet for an interactive circular cooking griddle overlay, and leave a clear open area at upper-left for a standing customer character overlay. Strong unified gouache illustration art direction: rich linework, imperfect brush texture, muted cream, tomato red, egg yolk yellow, ink green, charcoal, small warm wood accents. Sophisticated independent-game environment painting, layered depth, naturally lit, no UI, no text, no characters, no cookware or food in center, no gradients-as-design, no glossy 3D.

> Production-ready character sprite lineup for a hand-painted 2D indie cooking game. FIVE distinct Chinese adult street-breakfast customers, FULL BODY standing, one per evenly spaced vertical slot, all on a genuinely transparent background with generous empty separation, no shadows outside their feet, no props crossing slot boundaries, no text. Left to right: 1 hurried young office worker in muted blue coat and tie clutching commuter bag; 2 middle-aged food critic in rust jacket with round glasses and notebook; 3 cheerful cilantro fan in olive-green cardigan and scarf; 4 expressive cilantro hater in cream jacket and red headband; 5 chili-loving older man in faded tomato-red jacket and cap. Unified sophisticated gouache illustration style with ink-charcoal contour lines, imperfect brush textures, painterly natural light from upper-left, slightly exaggerated indie-game proportions, expressive faces, dimensional clothing folds and hands. All characters must be same scale, same ground baseline, front three-quarter view, completely separated, consistent palette cream red yolk yellow ink green charcoal. Flat transparent alpha, NO checkerboard, no background, no UI, no speech bubbles, no captions.

角色动画使用整个人物的位移和旋转。当前角色画页没有独立嘴部或手臂图层，因此说话和接餐动作尚未做到逐帧肢体表演；这是后续可替换为分层角色素材的明确缺口。
