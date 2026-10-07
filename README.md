# play_claude_cloud

一些小项目，每个项目一个文件夹。

## book-of-answers：每日答案之书

水墨风的答案之书。心里默想一件事，按住圆圈冥想三息，月亮从山后升起，答案会一笔一画写在纸上。每天打开还有一句「今日之页」。

## six-realms：夜当铺 · 六道轮回

一家夜里开门的当铺。报上生辰、答九句真心话，推磨定来世，换一张当契；还能查前三世卷宗。生辰只在本机推算，不会上传。

## phonograph：留声机是怎么发声的

3D 的手摇留声机，可以拖动旋转、一键拆开。七步导览顺着声音走一遍：动力（摇柄、发条、齿轮、调速器）只管让唱片匀速转；声音那一路从唱片沟槽到唱针、针杆、振膜，再经唱臂和喇叭变成空气的疏密波。右下角的四条波形显示同一个波形一路传下去，点任意零件能看说明，还能打开一段模拟老唱片音色的声音。

## watch：拆开一只陀飞轮表

3D 的复杂功能腕表：月相、指针日历、陀飞轮。可以拖动旋转、双指缩放，七章导览一路拆开讲：十层爆炸图、走时轮系的齿数比（80/10 × 75/10 = 60）、擒纵的慢放、陀飞轮为什么要转圈、日历和月相怎么每天推一格（59 齿两个月亮，29.5 天一轮）。指针走的是真实时间，月相是今晚真实的月亮。

## zuoyou-hubo：Two Hands（左右互搏，英文版）

金庸《射雕英雄传》里老顽童的入门功夫：左手画圆，右手画方。整个页面是英文的，画面是一台折叠屏手机，轻触后像功夫秘籍一样展开，先播三幕水墨小动画讲故事（山洞里困了十五年、两手一圆一方、练成后一人当两人用），再到开始页，左页有师父示范「一手画圆、一手画方」。打开摄像头后，书页上能看到你的脸和手，用食指在空中画；也可以两根手指直接在屏幕上画。练功时手机下方一直有师父在打太极。手机正中有大号倒计时，练满 30 秒后手机合上，外屏显示称号（最高是 The Grandmaster）、几成修为和还要几年成为大侠。摄像头画面只在本机处理，不上传。

## lingjing：灵境

以手机为窗的中式科幻 AR。摄像头画面保持原样，上面叠一层全息世界：一条半透明的青龙衔着龙珠绕着你游，十几盏灯笼浮在半空，脚下是一座缓缓转动的太极八卦阵盘，周围还悬着几块全息信息面板。转动手机，这些东西都留在原处（用手机的方向感应）；点屏幕能在空中放灯笼、符箓和青莲，点「召龙」青龙会游到你眼前。电脑上用鼠标拖动环顾。画面只在本机显示，不上传。

## 素材与许可证

- 水墨图标来自 [InkView](https://github.com/qybaihe/inkview)，MIT 许可证，见 `book-of-answers/assets/LICENSE-InkView.txt`
- 笔顺动画使用 [Hanzi Writer](https://github.com/chanind/hanzi-writer)（MIT），笔画数据来自 hanzi-writer-data（Arphic Public License），见 `book-of-answers/assets/CREDITS-strokes.txt`
- 夜当铺内嵌的字体（马善政、志莽行书、思源宋体）均为 SIL Open Font License，见 `six-realms/LICENSE-fonts.txt`；农历计算使用 [lunar-javascript](https://github.com/6tail/lunar-javascript)（MIT）
- 3D 渲染使用 [three.js](https://threejs.org/)（MIT），从 CDN 加载；留声机的声音是一首公版童谣旋律，用 Web Audio 实时合成
- 左右互搏的手势识别使用 [MediaPipe](https://github.com/google-ai-edge/mediapipe)（Apache License 2.0）的手部模型，文件放在 `zuoyou-hubo/vendor/`，许可证见 `zuoyou-hubo/vendor/LICENSE-mediapipe.txt`；页面内嵌的字体（Cormorant Garamond、EB Garamond、Caveat Brush、马善政楷书）均为 SIL Open Font License，见 `zuoyou-hubo/LICENSE-fonts.txt`
- 机械表内嵌的字体（思源宋体、IBM Plex Mono）均为 SIL Open Font License，见 `watch/LICENSE-fonts.txt`
- 灵境的 3D 渲染使用 [three.js](https://threejs.org/)（MIT），文件放在 `lingjing/vendor/`，许可证见 `lingjing/vendor/LICENSE-three.txt`；内嵌字体见 `lingjing/LICENSE-fonts.txt`
