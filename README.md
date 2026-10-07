# play_claude_cloud

一些小项目，每个项目一个文件夹。

## book-of-answers：每日答案之书

水墨风的答案之书。心里默想一件事，按住圆圈冥想三息，月亮从山后升起，答案会一笔一画写在纸上。每天打开还有一句「今日之页」。

## six-realms：夜当铺 · 六道轮回

一家夜里开门的当铺。报上生辰、答九句真心话，推磨定来世，换一张当契；还能查前三世卷宗。生辰只在本机推算，不会上传。

## phonograph：留声机是怎么发声的

3D 的手摇留声机，可以拖动旋转、一键拆开。七步导览顺着声音走一遍：动力（摇柄、发条、齿轮、调速器）只管让唱片匀速转；声音那一路从唱片沟槽到唱针、针杆、振膜，再经唱臂和喇叭变成空气的疏密波。右下角的四条波形显示同一个波形一路传下去，点任意零件能看说明，还能打开一段模拟老唱片音色的声音。

## zuoyou-hubo：Two Hands（左右互搏，英文版）

金庸《射雕英雄传》里老顽童的入门功夫：左手画圆，右手画方。整个页面是英文的，画面是一台折叠屏手机，轻触后像功夫秘籍一样展开：左页有水墨师父示范「一手画圆、一手画方」，右页讲故事并开始练习。打开摄像头后，书页上能看到你的脸和手，用食指在空中画；也可以两根手指直接在屏幕上画。练功时手机下方一直有师父在打太极。练三十息后手机合上，外屏显示称号（最高是 The Grandmaster）、几成修为和还要几年成为大侠。摄像头画面只在本机处理，不上传。

## 素材与许可证

- 水墨图标来自 [InkView](https://github.com/qybaihe/inkview)，MIT 许可证，见 `book-of-answers/assets/LICENSE-InkView.txt`
- 笔顺动画使用 [Hanzi Writer](https://github.com/chanind/hanzi-writer)（MIT），笔画数据来自 hanzi-writer-data（Arphic Public License），见 `book-of-answers/assets/CREDITS-strokes.txt`
- 夜当铺内嵌的字体（马善政、志莽行书、思源宋体）均为 SIL Open Font License，见 `six-realms/LICENSE-fonts.txt`；农历计算使用 [lunar-javascript](https://github.com/6tail/lunar-javascript)（MIT）
- 3D 渲染使用 [three.js](https://threejs.org/)（MIT），从 CDN 加载；留声机的声音是一首公版童谣旋律，用 Web Audio 实时合成
- 左右互搏的手势识别使用 [MediaPipe](https://github.com/google-ai-edge/mediapipe)（Apache License 2.0）的手部模型，文件放在 `zuoyou-hubo/vendor/`，许可证见 `zuoyou-hubo/vendor/LICENSE-mediapipe.txt`；页面内嵌的字体（Cormorant Garamond、EB Garamond、Caveat Brush、马善政楷书）均为 SIL Open Font License，见 `zuoyou-hubo/LICENSE-fonts.txt`
