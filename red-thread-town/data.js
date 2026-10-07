/* 红线小镇 · 数据：地点、26 位居民、兴趣、台词库。所有人物和地点都是虚构的。 */

// ---------- 城市网格 ----------
const ROAD_X = [80, 560, 1040, 1520, 2000];
const ROAD_Y = [80, 500, 920, 1340];
const WORLD_W = 2080, WORLD_H = 1420;

// 地点。b = 街区 [列, 行]；rect 是相对街区左上角的坐标（街区内部 420×360）；door 是门朝向哪条路。
// kind: building 建筑（可以进去） / area 开放区域（公园、游乐园）
const LOC_DEFS = [
  // 枫叶街住宅
  { id: 'fy1', name: '枫叶街1号', type: 'house', b: [0, 0], rect: [30, 36, 150, 110], door: 'N', color: '#e8a87c', roof: '#b5523b' },
  { id: 'fy2', name: '枫叶街2号', type: 'house', b: [0, 0], rect: [240, 36, 150, 110], door: 'N', color: '#f3d9a4', roof: '#4d7c8a' },
  { id: 'fy3', name: '枫叶街3号', type: 'house', b: [0, 0], rect: [30, 214, 150, 110], door: 'S', color: '#c9e4ca', roof: '#7b5e57' },
  { id: 'fy4', name: '枫叶街4号', type: 'house', b: [0, 0], rect: [240, 214, 150, 110], door: 'S', color: '#f6c6d0', roof: '#6b4f8c' },
  // 星辰科技 + 便利店
  { id: 'office', name: '星辰科技大厦', type: 'office', b: [1, 0], rect: [30, 40, 220, 284], door: 'S', color: '#9fb8cc', roof: '#56708a', emoji: '🏢' },
  { id: 'shop', name: '24h便利店', type: 'shop', b: [1, 0], rect: [290, 190, 115, 134], door: 'S', color: '#e9f1f7', roof: '#3fa36b', emoji: '🏪' },
  // 医院 + 艺术学院
  { id: 'hospital', name: '仁心医院', type: 'hospital', b: [2, 0], rect: [20, 60, 230, 264], door: 'S', color: '#f2f4f5', roof: '#c94c4c', emoji: '🏥' },
  { id: 'school', name: '向日葵艺术学院', type: 'school', b: [2, 0], rect: [280, 90, 125, 234], door: 'S', color: '#ffe08a', roof: '#d9822b', emoji: '🎨' },
  // 云顶公寓 + 健身房
  { id: 'apt1', name: '云顶公寓', type: 'apartment', b: [3, 0], rect: [30, 40, 180, 284], door: 'S', color: '#c7b8e0', roof: '#5c4b7d', emoji: '🏬' },
  { id: 'gym', name: '铁馆健身房', type: 'gym', b: [3, 0], rect: [250, 130, 150, 120], door: 'S', color: '#ffb36b', roof: '#333', emoji: '🏋️' },
  // 中央公园
  { id: 'park', name: '中央公园', type: 'park', kind: 'area', b: [0, 1], rect: [0, 0, 420, 360], door: 'E', emoji: '🌳' },
  // 咖啡馆 + 书店
  { id: 'cafe', name: '拾光咖啡馆', type: 'cafe', b: [1, 1], rect: [30, 120, 190, 130], door: 'S', color: '#d7b98e', roof: '#6d4c41', emoji: '☕' },
  { id: 'books', name: '半页书店', type: 'books', b: [1, 1], rect: [250, 70, 150, 120], door: 'N', color: '#cfe3d4', roof: '#2e6b4f', emoji: '📚' },
  // 商场影城 + 火锅
  { id: 'mall', name: '星光影城', type: 'mall', b: [2, 1], rect: [20, 20, 250, 190], door: 'S', color: '#f7d4e4', roof: '#a23e72', emoji: '🎬' },
  { id: 'hotpot', name: '老王火锅', type: 'hotpot', b: [2, 1], rect: [300, 130, 110, 120], door: 'S', color: '#ffcf9e', roof: '#c0392b', emoji: '🍲' },
  // 海景公寓 + 设计工作室
  { id: 'apt2', name: '海景公寓', type: 'apartment', b: [3, 1], rect: [30, 40, 180, 284], door: 'S', color: '#b8dfe6', roof: '#2d6a7a', emoji: '🏬' },
  { id: 'studio', name: '蓝猫设计工作室', type: 'studio', b: [3, 1], rect: [250, 150, 150, 130], door: 'S', color: '#a7c7f2', roof: '#2f4f8f', emoji: '🐱' },
  // 梧桐巷住宅
  { id: 'wt1', name: '梧桐巷1号', type: 'house', b: [0, 2], rect: [30, 36, 150, 110], door: 'N', color: '#d4e6b5', roof: '#8a5a44' },
  { id: 'wt2', name: '梧桐巷2号', type: 'house', b: [0, 2], rect: [240, 36, 150, 110], door: 'N', color: '#f7e1b5', roof: '#3d6e9e' },
  { id: 'wt3', name: '梧桐巷3号', type: 'house', b: [0, 2], rect: [30, 214, 150, 110], door: 'S', color: '#e3c8f0', roof: '#a14d4d' },
  { id: 'wt4', name: '梧桐巷4号', type: 'house', b: [0, 2], rect: [240, 214, 150, 110], door: 'S', color: '#ffd8b1', roof: '#4a7d4a' },
  // 酒吧 + 花店
  { id: 'bar', name: '夜猫子酒吧', type: 'bar', b: [1, 2], rect: [30, 110, 200, 160], door: 'S', color: '#4a3b5c', roof: '#1f1830', emoji: '🍸' },
  { id: 'flower', name: '妙妙花店', type: 'flower', b: [1, 2], rect: [270, 60, 130, 110], door: 'N', color: '#fde2e4', roof: '#e07a9b', emoji: '💐' },
  // 游乐园
  { id: 'fun', name: '欢乐游乐园', type: 'fun', kind: 'area', b: [2, 2], rect: [0, 0, 420, 360], door: 'N', emoji: '🎡' },
  // 超市 + 消防站
  { id: 'market', name: '好邻居超市', type: 'market', b: [3, 2], rect: [30, 60, 210, 160], door: 'N', color: '#e6f4d7', roof: '#4c9a2a', emoji: '🛒' },
  { id: 'fire', name: '消防站', type: 'fire', b: [3, 2], rect: [270, 170, 130, 154], door: 'S', color: '#f5c2c2', roof: '#b71c1c', emoji: '🚒' },
];

// 约会地点（会被兴趣决定）
const VENUES = {
  cafe: { verb: '喝咖啡' }, mall: { verb: '看电影' }, gym: { verb: '一起健身' }, books: { verb: '逛书店' },
  hotpot: { verb: '吃火锅' }, bar: { verb: '喝一杯' }, park: { verb: '散步' }, fun: { verb: '坐摩天轮' },
};

const INTERESTS = {
  咖啡: { venue: 'cafe', lines: ['我一天不喝三杯咖啡就活不下去。', '最近在学手冲，烫了三次手。'] },
  电影: { venue: 'mall', lines: ['我上周看了一部电影，哭掉一整包纸。', '我能背出一部老电影的全部台词。'] },
  健身: { venue: 'gym', lines: ['我今天练腿，现在走路都在抖。', '我的目标是单手举起一个冰箱。'] },
  读书: { venue: 'books', lines: ['我在读一本八百页的小说，读到第三页了。', '书店老板说我是他见过最安静的客人。'] },
  美食: { venue: 'hotpot', lines: ['我知道全城最好吃的火锅在哪。', '我的人生目标是吃遍这条街。'] },
  音乐: { venue: 'bar', lines: ['我最近在练吉他，邻居已经敲了两次门。', '我手机里三千首歌，全是同一个乐队的。'] },
  游戏: { venue: 'mall', lines: ['我昨晚打游戏打到三点，连输十把。', '我是某款游戏的全服第七十八名！'] },
  猫: { venue: 'cafe', lines: ['我家猫今天把我的耳机线咬断了。', '我的猫比我还挑食。'] },
  狗: { venue: 'park', lines: ['我梦想养一只会接飞盘的狗。', '路上看到狗我就走不动道。'] },
  旅行: { venue: 'fun', lines: ['我去年一个人去沙漠看星星。', '我的行李箱比我的衣柜还满。'] },
  画画: { venue: 'park', lines: ['我画了幅自画像，朋友说像一颗土豆。', '我想把这座小镇画下来。'] },
  跳舞: { venue: 'bar', lines: ['我跳广场舞比阿姨们还熟练。', '音乐一响我的脚就不听使唤。'] },
  钓鱼: { venue: 'park', lines: ['我在湖边坐了一天，钓到一只拖鞋。', '钓鱼就是和自己聊天。'] },
  股票: { venue: 'cafe', lines: ['我昨天又亏了一顿火锅钱。', '我看K线比看人准。'] },
  摄影: { venue: 'fun', lines: ['我拍了一万张照片，满意的只有三张。', '来，我给你拍一张，保证好看！'] },
  星座: { venue: 'cafe', lines: ['我出门前算过了，今天水逆。', '你是什么星座？我先确认一下。'] },
  动漫: { venue: 'mall', lines: ['我追的番今天更新了！', '我房间里有两百个手办。'] },
  养花: { venue: 'park', lines: ['我阳台的多肉又死了一盆。', '花是会听人说话的。'] },
  购物: { venue: 'mall', lines: ['我的衣柜已经关不上了。', '我一看到「打折」两个字就心跳加速。'] },
  下棋: { venue: 'park', lines: ['我在公园下棋三十年，没输过——除了昨天。', '人生就像一盘棋。'] },
};

const TEMPER_NAME = { warm: '温柔', tsun: '傲娇', chatty: '话痨', shy: '害羞', romantic: '浪漫', nerd: '理性', wild: '放飞', grumpy: '暴躁' };
// 外向程度：决定谁更爱打电话
const EXTRO = { warm: .6, tsun: .35, chatty: .95, shy: .15, romantic: .7, nerd: .3, wild: .9, grumpy: .4 };
// 性格相性（对称）
const TEMPER_MATCH = {
  'tsun-warm': .5, 'chatty-shy': .45, 'nerd-nerd': .4, 'grumpy-grumpy': -.6, 'shy-wild': -.35, 'romantic-romantic': .5,
  'nerd-romantic': -.4, 'chatty-grumpy': -.45, 'tsun-tsun': -.5, 'wild-wild': .4, 'grumpy-warm': .35, 'chatty-chatty': .2,
  'nerd-wild': -.3, 'romantic-shy': .3, 'tsun-grumpy': -.3, 'chatty-nerd': -.2, 'romantic-warm': .3, 'shy-shy': -.2,
  'grumpy-shy': -.25, 'tsun-chatty': .15, 'tsun-nerd': .25, 'wild-warm': .2, 'romantic-wild': .25,
};

// ---------- 26 位居民 ----------
// look: skin 肤色, hair {s 发型, c 发色}, hat {t, c}, top {t, c, c2}, bottom {t, c}, shoes, acc[], h 身高, w 胖瘦
// work: {loc, start, end, mode: inside/spot/roam/drive/wander/patrol, label, pose, days: 'wk' 只工作日 / 'all'}
// go: 出行方式 walk/bike/taxi/car
const PEOPLE = [
  { id: 'A', name: '安小柚', age: 23, job: '咖啡师', temper: 'chatty', likes: ['咖啡', '猫', '画画'], home: 'wt1', go: 'walk',
    work: { loc: 'cafe', start: 7.5, end: 15.5, mode: 'spot', spot: 'counter', label: '做咖啡', pose: 'stand', days: 'all' }, wake: 6.6, sleep: 23,
    look: { skin: '#ffe0c7', hair: { s: 'pigtails', c: '#ff8fb1' }, top: { t: 'apron', c: '#fff4e6', c2: '#8d5b3a' }, bottom: { t: 'skirt', c: '#3d405b' }, shoes: '#8d5b3a', acc: [], h: .92, w: .95 },
    thoughts: ['今天的拉花像一只鸡…算了，就说是天鹅。', '店里那只猫又躲到柜台下面了。', '奶泡奶泡奶泡奶泡～', '有人点了十二杯冰美式！'] },
  { id: 'B', name: '白大川', age: 34, job: '程序员', temper: 'nerd', likes: ['游戏', '动漫', '美食'], home: 'apt1', go: 'taxi',
    work: { loc: 'office', start: 9.5, end: 19.5, mode: 'inside', label: '写代码', days: 'wk' }, wake: 8.3, sleep: 1.5,
    look: { skin: '#f1c27d', hair: { s: 'messy', c: '#2b2b2b' }, top: { t: 'hoodie', c: '#5c6b7a' }, bottom: { t: 'pants', c: '#2e3440' }, shoes: '#e5e5e5', acc: ['glasses', 'backpack'], h: 1.02, w: 1.1 },
    thoughts: ['这个 bug 昨天还不在的。', '在我电脑上是好的啊……', '今天要不要点黄焖鸡……', '需求又改了。'] },
  { id: 'C', name: '陈一刀', age: 41, job: '火锅店主厨', temper: 'grumpy', likes: ['美食', '钓鱼', '股票'], home: 'fy1', go: 'car', car: '#2f6fb0',
    work: { loc: 'hotpot', start: 10, end: 21.5, mode: 'inside', label: '炒火锅底料', days: 'all' }, wake: 7, sleep: 23.5,
    look: { skin: '#e0ac69', hair: { s: 'short', c: '#1a1a1a' }, hat: { t: 'chef', c: '#ffffff' }, top: { t: 'tee', c: '#ffffff', c2: '#c0392b' }, bottom: { t: 'pants', c: '#333' }, shoes: '#222', acc: ['mustache'], h: 1.0, w: 1.35 },
    thoughts: ['牛油要多放。', '谁又把我的刀拿走了！', '今天的毛肚不够新鲜，不卖！', '股票绿得像青菜。'] },
  { id: 'D', name: '杜美丽', age: 29, job: '医生', temper: 'tsun', likes: ['读书', '健身', '旅行'], home: 'apt2', go: 'car', car: '#ffffff',
    work: { loc: 'hospital', start: 8, end: 18, mode: 'inside', label: '看门诊', days: 'wk' }, wake: 6.8, sleep: 23,
    look: { skin: '#ffdbac', hair: { s: 'bun', c: '#4a2c1a' }, top: { t: 'labcoat', c: '#ffffff', c2: '#7fb3d5' }, bottom: { t: 'pants', c: '#7fb3d5' }, shoes: '#fff', acc: ['glasses'], h: 1.0, w: .9 },
    thoughts: ['下一位病人。', '我才不累呢。', '值班室的咖啡是刷锅水吧。', '谁又在走廊里跑！'] },
  { id: 'E', name: '鄂大爷', age: 68, job: '退休老人', temper: 'warm', likes: ['下棋', '钓鱼', '养花'], home: 'fy2', go: 'walk',
    work: { loc: 'park', start: 6.5, end: 11, mode: 'wander', label: '打太极', pose: 'taichi', days: 'all' }, wake: 5.5, sleep: 21.5,
    look: { skin: '#e8b98a', hair: { s: 'bald', c: '#dddddd' }, top: { t: 'tang', c: '#c0392b', c2: '#f1c40f' }, bottom: { t: 'pants', c: '#222' }, shoes: '#111', acc: ['beard', 'cane'], h: .9, w: 1.0 },
    thoughts: ['年轻人啊，要早睡。', '这盘棋我让你一个车。', '今天的太阳真好。', '我年轻的时候……'] },
  { id: 'F', name: '范闪闪', age: 25, job: '网红主播', temper: 'wild', likes: ['摄影', '旅行', '跳舞'], home: 'apt1', go: 'taxi',
    work: { loc: 'fun', start: 13, end: 18, mode: 'wander', label: '直播打卡', pose: 'selfie', days: 'all' }, wake: 10.5, sleep: 2,
    look: { skin: '#fce1d4', hair: { s: 'long', c: '#f7d774' }, top: { t: 'crop', c: '#ff4fa3' }, bottom: { t: 'shorts', c: '#5ad1e6' }, shoes: '#fff', acc: ['sunglasses', 'handbag'], h: 1.04, w: .85 },
    thoughts: ['家人们点点关注！', '这个角度显脸小～', '今天也要闪闪发光！', '三二一，上链接！'] },
  { id: 'G', name: '葛铁柱', age: 30, job: '健身教练', temper: 'warm', likes: ['健身', '美食', '狗'], home: 'apt2', go: 'walk',
    work: { loc: 'gym', start: 9, end: 17, mode: 'spot', spot: 'yard', label: '带学员练习', pose: 'pushup', days: 'all' }, wake: 6, sleep: 22.5,
    look: { skin: '#c68642', hair: { s: 'mohawk', c: '#111' }, top: { t: 'tank', c: '#ffcc00' }, bottom: { t: 'shorts', c: '#222' }, shoes: '#ff5722', acc: ['earring'], h: 1.12, w: 1.3 },
    thoughts: ['再来一组！', '蛋白质，蛋白质！', '今天练胸还是练背呢？', '腿日不能逃！'] },
  { id: 'H', name: '何悄悄', age: 22, job: '书店店员', temper: 'shy', likes: ['读书', '猫', '星座'], home: 'wt2', go: 'bike',
    work: { loc: 'books', start: 10, end: 19, mode: 'inside', label: '整理书架', days: 'all' }, wake: 7.8, sleep: 23.5,
    look: { skin: '#fff0e1', hair: { s: 'long', c: '#111' }, hat: { t: 'beret', c: '#a83250' }, top: { t: 'cardigan', c: '#e9c46a', c2: '#fff' }, bottom: { t: 'skirt', c: '#264653' }, shoes: '#6d4c41', acc: ['glasses'], h: .9, w: .85 },
    thoughts: ['（小声）欢迎光临……', '今天不要和人说话了吧。', '这本书的结局我猜到了。', '天蝎座今天宜独处。'] },
  { id: 'I', name: '伊万', age: 36, job: '外卖骑手', temper: 'chatty', likes: ['游戏', '美食', '狗'], home: 'wt3', go: 'bike',
    work: { loc: 'city', start: 10.5, end: 21, mode: 'roam', label: '送外卖', days: 'all' }, wake: 9, sleep: 0.5,
    look: { skin: '#f3d2b3', hair: { s: 'short', c: '#c97d3a' }, hat: { t: 'helmet', c: '#ffd400' }, top: { t: 'jacket', c: '#ffd400', c2: '#222' }, bottom: { t: 'pants', c: '#333' }, shoes: '#222', acc: ['box', 'beard'], h: 1.06, w: 1.05 },
    thoughts: ['您的外卖到了！', '还有三分钟就超时了！', '电梯又坏了……', '五星好评谢谢！'] },
  { id: 'J', name: '江小鹿', age: 20, job: '艺术学院学生', temper: 'romantic', likes: ['动漫', '跳舞', '星座'], home: 'apt1', go: 'walk',
    work: { loc: 'school', start: 8.5, end: 16, mode: 'inside', label: '上课', days: 'wk' }, wake: 7.3, sleep: 0.5,
    look: { skin: '#ffe5d0', hair: { s: 'ponytail', c: '#7b3f00' }, hat: { t: 'bunny', c: '#ffffff' }, top: { t: 'sailor', c: '#ffffff', c2: '#1d3557' }, bottom: { t: 'skirt', c: '#1d3557' }, shoes: '#111', acc: ['blush'], h: .88, w: .85 },
    thoughts: ['如果命运有红线就好了……', '今天的晚霞像少女漫画。', '期末作业还没画完！', '月亮好圆～'] },
  { id: 'K', name: '柯警官', age: 45, job: '交通警察', temper: 'grumpy', likes: ['钓鱼', '读书', '狗'], home: 'fy3', go: 'walk',
    work: { loc: 'corner', start: 7, end: 17, mode: 'patrol', label: '路口指挥交通', pose: 'wave', days: 'all' }, wake: 5.8, sleep: 22,
    look: { skin: '#d9a066', hair: { s: 'short', c: '#333' }, hat: { t: 'police', c: '#1f3a93' }, top: { t: 'uniform', c: '#2c4f8c', c2: '#f1c40f' }, bottom: { t: 'pants', c: '#1f2d4d' }, shoes: '#111', acc: ['mustache', 'sunglasses'], h: 1.05, w: 1.1 },
    thoughts: ['那辆车！停下！', '过马路看灯！', '哔——哔——', '今天又没人闯红灯，好寂寞。'] },
  { id: 'L', name: '林妙妙', age: 31, job: '花店老板', temper: 'romantic', likes: ['养花', '摄影', '咖啡'], home: 'wt4', go: 'walk',
    work: { loc: 'flower', start: 9, end: 18, mode: 'spot', spot: 'front', label: '包花束', pose: 'stand', days: 'all' }, wake: 7, sleep: 23,
    look: { skin: '#f5d0b0', hair: { s: 'wavy', c: '#8b5a2b' }, hat: { t: 'straw', c: '#e9c46a' }, top: { t: 'dress', c: '#f4a6c1', c2: '#fff' }, bottom: { t: 'none' }, shoes: '#fff', acc: [], h: .98, w: .95 },
    thoughts: ['玫瑰今天开得真好。', '每束花都有一个故事。', '有人买了九十九朵！是要求婚吗！', '向日葵要多晒晒。'] },
  { id: 'M', name: '马克', age: 27, job: '街头歌手', temper: 'romantic', likes: ['音乐', '旅行', '咖啡'], home: 'apt2', go: 'bike',
    work: { loc: 'park', start: 15, end: 20, mode: 'spot', spot: 'stage', label: '弹吉他卖唱', pose: 'guitar', days: 'all' }, wake: 10, sleep: 2,
    look: { skin: '#f0c8a0', hair: { s: 'long', c: '#3b2414' }, hat: { t: 'beanie', c: '#e76f51' }, top: { t: 'jacket', c: '#222', c2: '#555' }, bottom: { t: 'pants', c: '#3a5a80' }, shoes: '#6d4c41', acc: ['guitar'], h: 1.02, w: .9 },
    thoughts: ['♪ 啦啦啦～', '今天收到三块五毛钱。', '这首歌是写给未来的那个人的。', '弦又断了。'] },
  { id: 'N', name: '牛二', age: 39, job: '出租车司机', temper: 'chatty', likes: ['股票', '钓鱼', '美食'], home: 'wt3', go: 'car', taxi: true,
    work: { loc: 'road', start: 7, end: 19, mode: 'drive', label: '开出租', days: 'all' }, wake: 6, sleep: 22.5,
    look: { skin: '#e0ac69', hair: { s: 'short', c: '#222' }, hat: { t: 'cap', c: '#2a9d8f' }, top: { t: 'vest', c: '#e9c46a', c2: '#ffffff' }, bottom: { t: 'pants', c: '#4a4a4a' }, shoes: '#222', acc: [], h: .98, w: 1.3 },
    thoughts: ['师傅我跟你说……哦我就是师傅。', '这条路又堵了。', '去哪儿？上车！', '今天跑了二十单！'] },
  { id: 'O', name: '欧若拉', age: 26, job: '舞蹈老师', temper: 'wild', likes: ['跳舞', '音乐', '健身'], home: 'apt1', go: 'taxi',
    work: { loc: 'school', start: 13, end: 20, mode: 'inside', label: '教街舞', days: 'all' }, wake: 9.5, sleep: 1.5,
    look: { skin: '#8d5524', hair: { s: 'afro', c: '#9b5de5' }, top: { t: 'crop', c: '#00f5d4' }, bottom: { t: 'pants', c: '#222', }, shoes: '#fee440', acc: ['earring', 'headphones'], h: 1.06, w: .9 },
    thoughts: ['五六七八！', '节奏在我血液里！', '今天的音乐不够炸。', '这个动作我能转十圈。'] },
  { id: 'P', name: '潘自在', age: 33, job: '自由职业 · 天体爱好者', temper: 'wild', likes: ['健身', '旅行', '摄影'], home: 'fy4', go: 'walk',
    work: { loc: 'city', start: 9, end: 12, mode: 'roam', label: '光着身子晨跑', pose: 'run', days: 'all' }, wake: 7.5, sleep: 23,
    look: { skin: '#f2c49b', hair: { s: 'curly', c: '#d4a017' }, top: { t: 'none' }, bottom: { t: 'briefs', c: '#ff3b3b' }, shoes: '#fff', acc: ['beard'], h: 1.0, w: 1.0 },
    thoughts: ['衣服是对灵魂的束缚！', '风吹过的感觉真好！', '警官我真的没有冒犯谁！', '自由！'] },
  { id: 'Q', name: '秦千金', age: 24, job: '富家千金', temper: 'tsun', likes: ['购物', '旅行', '狗'], home: 'apt2', go: 'car', car: '#e63946', dog: '#fff',
    work: { loc: 'mall', start: 13, end: 17, mode: 'spot', spot: 'plaza', label: '逛街刷卡', pose: 'stand', days: 'all' }, wake: 11, sleep: 1,
    look: { skin: '#fff1e6', hair: { s: 'wavy', c: '#f4d58d' }, hat: { t: 'tiara', c: '#ffd700' }, top: { t: 'dress', c: '#ffafcc', c2: '#ffffff' }, bottom: { t: 'none' }, shoes: '#ff006e', acc: ['handbag', 'sunglasses'], h: .96, w: .85 },
    thoughts: ['这家店我包了。', '本小姐才不坐公交。', '小白，不许乱叫！', '好无聊，买个包吧。'] },
  { id: 'R', name: '荣大壮', age: 29, job: '消防员', temper: 'warm', likes: ['健身', '狗', '游戏'], home: 'apt1', go: 'walk',
    work: { loc: 'fire', start: 8, end: 20, mode: 'inside', label: '值班待命', days: 'all' }, wake: 6.5, sleep: 23,
    look: { skin: '#d8a47f', hair: { s: 'short', c: '#5a3825' }, hat: { t: 'fireman', c: '#d62828' }, top: { t: 'uniform', c: '#3d3d3d', c2: '#ffd60a' }, bottom: { t: 'pants', c: '#3d3d3d' }, shoes: '#111', acc: [], h: 1.12, w: 1.2 },
    thoughts: ['今天也平安无事就好。', '这根杆子我滑了一万次。', '谁家的猫又上树了？', '队长做的饭真难吃。'] },
  { id: 'S', name: '苏总', age: 47, job: '公司高管', temper: 'nerd', likes: ['股票', '旅行', '读书'], home: 'apt2', go: 'car', car: '#1b1b1b',
    work: { loc: 'office', start: 8.5, end: 20, mode: 'inside', label: '开会', days: 'wk' }, wake: 6, sleep: 0,
    look: { skin: '#f1c27d', hair: { s: 'slick', c: '#555' }, top: { t: 'suit', c: '#1d2d44', c2: '#c1121f' }, bottom: { t: 'pants', c: '#1d2d44' }, shoes: '#000', acc: ['briefcase'], h: 1.04, w: 1.05 },
    thoughts: ['这个季度的数据不对。', '对齐一下颗粒度。', '我们要拥抱变化。', '会议改到明早七点。'] },
  { id: 'T', name: '唐小糖', age: 28, job: '冰淇淋摊主', temper: 'warm', likes: ['美食', '猫', '动漫'], home: 'fy2', go: 'bike',
    work: { loc: 'fun', start: 11, end: 20, mode: 'spot', spot: 'icecream', label: '卖冰淇淋', pose: 'stand', days: 'all' }, wake: 8, sleep: 23,
    look: { skin: '#ffe0bd', hair: { s: 'curly', c: '#ff7f50' }, hat: { t: 'catears', c: '#ff7f50' }, top: { t: 'stripe', c: '#ffffff', c2: '#ff6b9a' }, bottom: { t: 'overalls', c: '#4ea8de' }, shoes: '#fff', acc: ['blush'], h: .9, w: 1.0 },
    thoughts: ['草莓味卖完了！', '要加彩虹糖吗？', '外公今天又去下棋了。', '冰淇淋拯救世界！'] },
  { id: 'U', name: '乌拉拉', age: 35, job: '超市收银员', temper: 'chatty', likes: ['星座', '美食', '跳舞'], home: 'wt1', go: 'walk',
    work: { loc: 'market', start: 8, end: 17, mode: 'inside', label: '收银', days: 'all' }, wake: 6.5, sleep: 22.5,
    look: { skin: '#e8beac', hair: { s: 'perm', c: '#7f1d1d' }, top: { t: 'apron', c: '#a7c957', c2: '#386641' }, bottom: { t: 'pants', c: '#6c584c' }, shoes: '#333', acc: ['earring', 'glasses'], h: .94, w: 1.15 },
    thoughts: ['会员卡有吗？', '鸡蛋今天特价！', '晚上广场舞要换新曲子。', '我跟你说个八卦……'] },
  { id: 'V', name: '温文', age: 32, job: '插画师', temper: 'shy', likes: ['画画', '咖啡', '电影'], home: 'apt2', go: 'walk',
    work: { loc: 'studio', start: 10, end: 18, mode: 'inside', label: '画插画', days: 'wk' }, wake: 9, sleep: 1.5,
    look: { skin: '#f6d5b8', hair: { s: 'bob', c: '#264653' }, hat: { t: 'beret', c: '#222' }, top: { t: 'tee', c: '#f4f1de', c2: '#81b29a' }, bottom: { t: 'pants', c: '#81b29a' }, shoes: '#3d405b', acc: ['scarf', 'beard'], h: .98, w: .85 },
    thoughts: ['甲方说要五彩斑斓的黑。', '这个蓝色不对……', '要不今天就画天空吧。', '（盯着窗外发呆）'] },
  { id: 'W', name: '王小二', age: 26, job: '商场保安', temper: 'shy', likes: ['电影', '游戏', '美食'], home: 'apt1', go: 'walk',
    work: { loc: 'mall', start: 12, end: 22, mode: 'spot', spot: 'door', label: '站岗', pose: 'stand', days: 'all' }, wake: 9.5, sleep: 1,
    look: { skin: '#f1c27d', hair: { s: 'short', c: '#000' }, hat: { t: 'cap', c: '#14213d' }, top: { t: 'uniform', c: '#14213d', c2: '#fca311' }, bottom: { t: 'pants', c: '#14213d' }, shoes: '#000', acc: [], h: 1.08, w: .95 },
    thoughts: ['请出示…啊不用了，您请进。', '站了六个小时了，腿好酸。', '今天的电影票卖光了。', '那个光着的人又跑过去了……'] },
  { id: 'X', name: '夏冰', age: 30, job: '护士', temper: 'warm', likes: ['电影', '猫', '旅行'], home: 'apt1', go: 'taxi',
    work: { loc: 'hospital', start: 12, end: 22, mode: 'inside', label: '值夜班', days: 'all' }, wake: 9.5, sleep: 2,
    look: { skin: '#ffe0c7', hair: { s: 'bob', c: '#2d2d2d' }, hat: { t: 'nurse', c: '#ffffff' }, top: { t: 'dress', c: '#ffffff', c2: '#ff8fab' }, bottom: { t: 'none' }, shoes: '#fff', acc: [], h: .96, w: .9 },
    thoughts: ['今天要量三十个人的血压。', '病人说我笑起来像天使。', '夜班的星星特别亮。', '下班要睡十二个小时！'] },
  { id: 'Y', name: '叶飘飘', age: 27, job: '程序员', temper: 'nerd', likes: ['游戏', '动漫', '音乐'], home: 'apt2', go: 'bike',
    work: { loc: 'office', start: 10, end: 19, mode: 'inside', label: '修 bug', days: 'wk' }, wake: 8.5, sleep: 1.5,
    look: { skin: '#fbe3cf', hair: { s: 'bob', c: '#7b2cbf' }, top: { t: 'hoodie', c: '#2b2d42' }, bottom: { t: 'shorts', c: '#8d99ae' }, shoes: '#ef233c', acc: ['headphones', 'glasses'], h: .92, w: .9 },
    thoughts: ['这个需求写不了。', '为什么能跑？不敢动。', '下班打一把游戏。', 'git push --force……开玩笑的。'] },
  { id: 'Z', name: '朱大胡', age: 38, job: '酒保', temper: 'grumpy', likes: ['音乐', '电影', '钓鱼'], home: 'apt1', go: 'walk',
    work: { loc: 'bar', start: 17, end: 23.8, mode: 'inside', label: '调酒', days: 'all' }, wake: 11, sleep: 3,
    look: { skin: '#c68642', hair: { s: 'bald', c: '#333' }, top: { t: 'vest', c: '#222', c2: '#ffffff' }, bottom: { t: 'pants', c: '#3e2723' }, shoes: '#111', acc: ['bigbeard', 'tattoo', 'earring'], h: 1.1, w: 1.25 },
    thoughts: ['老样子？', '这杯叫「失恋」，免费。', '别在我这儿哭。', '摇摇摇摇……'] },
];

// 业余去处：[地点, 说明, 方式]
const HOBBY_PLACES = {
  咖啡: ['cafe', '喝咖啡', 'spot'], 电影: ['mall', '看电影', 'inside'], 健身: ['gym', '撸铁', 'inside'], 读书: ['books', '看书', 'inside'],
  美食: ['hotpot', '吃火锅', 'inside'], 音乐: ['bar', '听现场', 'inside'], 游戏: ['mall', '打电玩', 'inside'], 猫: ['cafe', '撸猫', 'spot'],
  狗: ['park', '遛狗', 'wander'], 旅行: ['fun', '闲逛', 'wander'], 画画: ['park', '写生', 'wander'], 跳舞: ['park', '跳广场舞', 'wander'],
  钓鱼: ['park', '湖边钓鱼', 'wander'], 股票: ['cafe', '盯盘', 'spot'], 摄影: ['fun', '拍照', 'wander'], 星座: ['cafe', '看星座运势', 'spot'],
  动漫: ['mall', '逛手办店', 'inside'], 养花: ['flower', '买花', 'inside'], 购物: ['mall', '逛街', 'inside'], 下棋: ['park', '下棋', 'wander'],
};

// ---------- 台词库 ----------
// {a} 说话人 {b} 对方 {t} 话题 {p} 地点
const L = {
  greetFirst: {
    warm: ['你好呀，终于见面了～', '路上还顺利吗？我给你点了杯热的。'],
    tsun: ['哼，我可不是特意早到的。', '你就是{b}？……比照片上还行吧。'],
    chatty: ['哎呀你好你好！我跟你说我刚才路上看见一只狗穿裤子！', '你好！我先自我介绍一下，大概要十分钟。'],
    shy: ['那、那个……你好……', '（小声）嗨……'],
    romantic: ['今天的{p}好像特别好看，可能是因为你来了。', '你好，我觉得我们在梦里见过。'],
    nerd: ['你好。你比约定时间晚了 3 分 12 秒。', '嗨，我查过了，这家店评分 4.7。'],
    wild: ['哟！终于来了！今天必须玩个痛快！', '嘿！我们是不是在哪见过？没有？那就现在见过了！'],
    grumpy: ['来了？坐吧。', '这地方人真多，烦。'],
  },
  greetAgain: {
    warm: ['又见面啦，今天累不累？', '我想你了，嘿嘿。'],
    tsun: ['你、你怎么又约我……算了，坐吧。', '我刚好路过而已。'],
    chatty: ['你猜我今天遇到了什么！', '我有八件事要跟你说！'],
    shy: ['嗨……今天你也很好看。', '我…我今天穿了新衣服。'],
    romantic: ['每次见你都像第一次。', '我数着时间等你呢。'],
    nerd: ['这是我们第 {n} 次见面了。', '我提前十分钟到了。'],
    wild: ['宝！冲！', '今天我们搞点刺激的！'],
    grumpy: ['嗯，来了就好。', '今天工作烦死了，还好有你。'],
  },
  ask: ['{b}，你喜欢{t}吗？', '你平时会{t}吗？', '说起来，你对{t}感兴趣吗？'],
  love: {
    warm: ['喜欢！超喜欢！我们竟然一样！'], tsun: ['……还、还行吧，也就每周都弄而已。'], chatty: ['天哪！！{t}！我能聊三天三夜！'],
    shy: ['嗯！我…我也很喜欢{t}。'], romantic: ['{t}是我灵魂的一部分。'], nerd: ['是的，我对{t}有系统性的研究。'],
    wild: ['那必须的！{t}走起！'], grumpy: ['嗯，{t}还行，比人强。'],
  },
  meh: {
    warm: ['我不太懂{t}，不过你可以教我呀。'], tsun: ['{t}？无聊。'], chatty: ['{t}啊……那个……对了你吃了吗？'],
    shy: ['我…不太了解……（低头）'], romantic: ['{t}也挺好，只要和你一起。'], nerd: ['{t}缺乏逻辑，我不感兴趣。'],
    wild: ['{t}？太乖了吧！'], grumpy: ['不喜欢。下一个话题。'],
  },
  praise: {
    warm: ['你笑起来真好看。'], tsun: ['你今天……衣服还挺配的。'], chatty: ['你这身在哪买的！好好看！'],
    shy: ['你…你今天很好看。'], romantic: ['你知道吗，你眼睛里有星星。'], nerd: ['你的五官比例很接近黄金分割。'],
    wild: ['你也太好看了吧！犯规！'], grumpy: ['嗯，你今天看着顺眼。'],
  },
  praiseYes: {
    warm: ['你也是呀～'], tsun: ['哼、哼！要你说！（脸红）'], chatty: ['真的吗真的吗！再说一遍！'], shy: ['（脸红到耳根）'],
    romantic: ['那你就一直看着吧。'], nerd: ['谢谢，我会记录下来。'], wild: ['我知道！哈哈！'], grumpy: ['……少来。（偷偷笑了）'],
  },
  praiseNo: {
    warm: ['谢谢……'], tsun: ['油腻。'], chatty: ['哈哈哈哈你好会说话啊……（尬笑）'], shy: ['……（不知道说什么）'],
    romantic: ['嗯……谢谢。'], nerd: ['这个结论不严谨。'], wild: ['好土哦哈哈哈。'], grumpy: ['说正事。'],
  },
  awkward: ['……', '（沉默了十秒钟）', '今天天气……哈哈……', '服务员！再来一杯！', '（低头看手机）', '那个……你先说。'],
  byeGood: {
    warm: ['今天很开心，下次见！'], tsun: ['下次你要是再约我……我也不是不能来。'], chatty: ['我回家还要给你发语音！六十秒的那种！'],
    shy: ['今天…谢谢你。（挥手）'], romantic: ['今晚的月亮会记住我们的。'], nerd: ['今天的约会评分：9.2。'],
    wild: ['下次去更疯的地方！'], grumpy: ['路上小心。到家说一声。'],
  },
  byeBad: {
    warm: ['那……就先这样吧。'], tsun: ['我走了，别送。'], chatty: ['那个……我突然想起家里煤气没关！'], shy: ['我…先回去了。'],
    romantic: ['也许我们只是擦肩而过。'], nerd: ['我需要重新评估。'], wild: ['没意思，撤了。'], grumpy: ['走了。'],
  },
  confess: {
    warm: ['{b}，我好像……喜欢上你了。'], tsun: ['我、我才没有喜欢你！……好吧有一点。很多点。'],
    chatty: ['我想了很久怎么说，算了我直接说吧：我喜欢你！'], shy: ['我…我喜欢你！！（声音发抖）'],
    romantic: ['我想每天和你一起看日落。在一起好吗？'], nerd: ['经过长期观察，我得出结论：我喜欢你。'],
    wild: ['别磨叽了，我们在一起吧！'], grumpy: ['喂，跟我在一起。我罩你。'],
  },
  accept: {
    warm: ['我也是！'], tsun: ['笨蛋……我答应你了。'], chatty: ['啊啊啊啊！我愿意！我要告诉全世界！'], shy: ['嗯……（用力点头）'],
    romantic: ['我等这句话很久了。'], nerd: ['同意。从今天起记为纪念日。'], wild: ['早该说了！走，庆祝去！'], grumpy: ['……行吧。（耳朵红了）'],
  },
  reject: {
    warm: ['对不起……我们还是做朋友吧。'], tsun: ['想得美！'], chatty: ['啊这……我们当好朋友不好吗？'], shy: ['我…我还没准备好……'],
    romantic: ['我心里的那个人……还没出现。'], nerd: ['数据不足，暂时无法接受。'], wild: ['我还想自由几年！'], grumpy: ['不行。'],
  },
  propose: ['{b}，我们结婚吧！💍', '{b}，以后的每一天，我都想和你一起过。💍'],
  wed: ['我愿意！！', '我愿意。（哭成泪人）'],
  fightStart: ['你又迟到了！', '你为什么不回我消息？', '你上次说要陪我去{p}的！', '你是不是根本不在乎我？', '你又在打游戏！', '你怎么又乱花钱！'],
  fightBack: {
    warm: ['对不起，是我不好……'], tsun: ['你凶什么凶！'], chatty: ['你听我解释！我跟你说事情是这样的……'], shy: ['（眼眶红了）'],
    romantic: ['你变了。'], nerd: ['你的指控缺乏证据。'], wild: ['爱咋咋地！'], grumpy: ['你烦不烦！'],
  },
  breakup: {
    warm: ['对不起，我真的累了。我们分开吧。'], tsun: ['分手！我再也不想见到你了！（转身就哭了）'], chatty: ['我们……分手吧。这次我不想多说了。'],
    shy: ['我觉得…我们不合适……'], romantic: ['也许我们只是彼此人生的过客。'], nerd: ['我们的相性分数跌破了阈值。再见。'],
    wild: ['拜拜了您嘞！'], grumpy: ['够了，分手！'],
  },
  breakupReply: ['……好。', '你会后悔的！', '（哭）', '那祝你幸福。', '走就走！', '……我早就知道了。'],
  // 第一通电话的契机
  meetCute: [
    '喂？请问是{b}吗？我捡到了你的钱包……',
    '你好，我是上次在{p}帮你捡东西的那个人，你还记得吗？',
    '喂？你的快递好像送到我家门口了……',
    '您好，我好像打错了……不过你的声音挺好听的。',
    '你好，我是你楼下的邻居，你家阳台的衣服掉我这儿了。',
    '喂，是{b}吗？我们共同的朋友说……我们应该认识一下。',
    '你好！我在路边被一根红线绊倒了，线的另一头……好像是你。',
  ],
  meetReply: {
    warm: ['啊！真的谢谢你！'], tsun: ['你怎么有我电话的？……算了，谢谢。'], chatty: ['哇真的吗！你是谁呀你在哪呀你几岁呀？'],
    shy: ['啊…是、是我……谢谢……'], romantic: ['这一定是命运吧。'], nerd: ['这个概率很低。有意思。'],
    wild: ['哈哈哈什么鬼！我喜欢！'], grumpy: ['……哦。谢了。'],
  },
  invite: ['那……要不要一起去{p}{v}？我请你！', '这周有空吗？去{p}{v}吧。', '为了感谢，一起去{p}{v}吧？'],
  inviteYes: ['好呀！', '……行吧，就当还你人情。', '我看看日程……有空！', '好！不见不散！'],
  inviteNo: ['最近有点忙，改天吧。', '我考虑一下……', '这周不行，下次吧。'],
  callHi: ['在干嘛呢？', '喂～是我。', '猜猜我是谁？', '你吃饭了吗？'],
  callStatus: ['我在{s}呢。', '刚{s}，累死了。', '{s}中，有点想你。'],
  callChat: {
    warm: ['那你注意休息哦。', '晚上想吃什么？我给你带。'], tsun: ['哦。我就随便问问。', '谁、谁想你了！'], chatty: ['我跟你说个八卦！', '你知道吗今天超市鸡蛋特价！'],
    shy: ['嗯……', '我…我就是想听听你的声音。'], romantic: ['今晚月色真美。', '刚才看到一朵云，像你。'], nerd: ['我写了个程序帮你算通勤时间。', '收到。'],
    wild: ['好无聊，出来玩！', '我刚刚差点从滑板上摔下来哈哈！'], grumpy: ['嗯。挂了。', '今天又有人惹我。'],
  },
  callLove: ['想你了。', '爱你哦。', '早点睡，晚安～', '今天也很喜欢你。', '亲一个！mua～'],
  cancel: ['对不起，今晚临时要加班……改天吧。', '我今天身体不太舒服，下次好吗？'],
  stoodUp: ['{b}到底来不来啊！', '我等了一个小时了……', '算了，我走了。'],
  late: ['抱歉抱歉，路上堵车！', '你怎么才来！'],
  smallTalk: [
    ['早啊！', '早！'], ['今天好热啊。', '是啊，热死了。'], ['你也来这儿啊？', '嗯，常来。'], ['看到那个光着的人了吗？', '看到了……'],
    ['最近股市怎么样？', '别提了。'], ['这家店不错。', '我也觉得！'], ['你的帽子好看！', '嘿嘿谢谢。'], ['借个火？', '我不抽烟。'],
  ],
  // 约会里的意外事件：{x} 是路过的人
  incidents: [
    { text: '（突然下起了雨，两人挤在同一把伞下）', d: [6, 6], need: 1 },
    { text: '（{a} 不小心把饮料洒在了 {b} 身上）', d: [-2, -6] },
    { text: '（{a} 的手机响了：是老板。）', d: [-1, -5] },
    { text: '（{x} 光着身子从旁边跑了过去……）', d: [2, 2], who: 'P' },
    { text: '（{x} 路过，冲他们挤了挤眼睛）', d: [1, 1] },
    { text: '（两人同时伸手去拿最后一块点心，手碰到了）', d: [7, 7] },
    { text: '（{a} 讲了一个冷笑话，空气安静了三秒）', d: [-1, -3] },
    { text: '（{a} 抢着买单）', d: [1, 5] },
    { text: '（远处的街头歌手唱起了情歌）', d: [4, 4] },
    { text: '（{a} 打了一个特别响的喷嚏）', d: [0, -2] },
  ],
};

// 闲聊话题（按当前活动）
const CONTEXT_THOUGHTS = {
  sleep: ['Zzz……', 'Zzz…（梦话）再来一碗……', 'Zzz……'],
  taxi: ['师傅，快一点！', '这车有点晕……'],
  wait: ['出租车怎么还不来……', '🚕？'],
  walk: ['今天天气不错。', '走路也是锻炼。', '咦，这条路以前是这样的吗？'],
  rain: ['下雨了！没带伞！', '这雨下得真烦人。'],
  single: ['一个人也挺好的。', '什么时候能遇到那个人呢？'],
  heartbroken: ['我才不难过呢……', '（看着手机发呆）', '今晚想喝一杯。'],
  inlove: ['不知道 {p} 在干嘛……', '想 {p} 了。', '（傻笑）'],
};
