# play_claude_cloud

一些小项目，每个项目一个文件夹。

## book-of-answers：每日答案之书

水墨风的答案之书。心里默想一件事，按住圆圈冥想三息，月亮从山后升起，答案会一笔一画写在纸上。每天打开还有一句「今日之页」。

## phonograph：留声机是怎么发声的

3D 的手摇留声机，可以拖动旋转、一键拆开。七步导览顺着声音走一遍：动力（摇柄、发条、齿轮、调速器）只管让唱片匀速转；声音那一路从唱片沟槽到唱针、针杆、振膜，再经唱臂和喇叭变成空气的疏密波。右下角的四条波形显示同一个波形一路传下去，点任意零件能看说明，还能打开一段模拟老唱片音色的声音。

## 素材与许可证

- 水墨图标来自 [InkView](https://github.com/qybaihe/inkview)，MIT 许可证，见 `book-of-answers/assets/LICENSE-InkView.txt`
- 笔顺动画使用 [Hanzi Writer](https://github.com/chanind/hanzi-writer)（MIT），笔画数据来自 hanzi-writer-data（Arphic Public License），见 `book-of-answers/assets/CREDITS-strokes.txt`
- 3D 渲染使用 [three.js](https://threejs.org/)（MIT），从 CDN 加载；留声机的声音是一首公版童谣旋律，用 Web Audio 实时合成
