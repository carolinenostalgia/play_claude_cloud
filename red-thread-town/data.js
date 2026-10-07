/* Red Thread Town · data: places, 26 residents, interests and the script library. Every person and place is fictional. */

// ---------- Town grid ----------
const ROAD_X = [80, 560, 1040, 1520, 2000];
const ROAD_Y = [80, 500, 920, 1340];
const WORLD_W = 2080, WORLD_H = 1420;

// Places. b = block [column, row]; rect is relative to the block's top-left corner (each block is 420×360 inside); door = which road the door faces.
// kind: building (people can go inside) / area (open space: park, funfair)
const LOC_DEFS = [
  // Maple Street houses
  { id: 'fy1', name: "Maple St. #1", type: 'house', b: [0, 0], rect: [30, 36, 150, 110], door: 'N', color: '#e8a87c', roof: '#b5523b' },
  { id: 'fy2', name: "Maple St. #2", type: 'house', b: [0, 0], rect: [240, 36, 150, 110], door: 'N', color: '#f3d9a4', roof: '#4d7c8a' },
  { id: 'fy3', name: "Maple St. #3", type: 'house', b: [0, 0], rect: [30, 214, 150, 110], door: 'S', color: '#c9e4ca', roof: '#7b5e57' },
  { id: 'fy4', name: "Maple St. #4", type: 'house', b: [0, 0], rect: [240, 214, 150, 110], door: 'S', color: '#f6c6d0', roof: '#6b4f8c' },
  // Tech tower + convenience store
  { id: 'office', name: "Nova Tech Tower", type: 'office', b: [1, 0], rect: [30, 40, 220, 284], door: 'S', color: '#9fb8cc', roof: '#56708a', emoji: '🏢' },
  { id: 'shop', name: "24h Mart", type: 'shop', b: [1, 0], rect: [290, 190, 115, 134], door: 'S', color: '#e9f1f7', roof: '#3fa36b', emoji: '🏪' },
  // Hospital + art school
  { id: 'hospital', name: "Kindheart Hospital", type: 'hospital', b: [2, 0], rect: [20, 60, 230, 264], door: 'S', color: '#f2f4f5', roof: '#c94c4c', emoji: '🏥' },
  { id: 'school', name: "Sunflower Art School", type: 'school', b: [2, 0], rect: [280, 90, 125, 234], door: 'S', color: '#ffe08a', roof: '#d9822b', emoji: '🎨' },
  // Cloudtop Apartments + gym
  { id: 'apt1', name: "Cloudtop Apartments", type: 'apartment', b: [3, 0], rect: [30, 40, 180, 284], door: 'S', color: '#c7b8e0', roof: '#5c4b7d', emoji: '🏬' },
  { id: 'gym', name: "Iron Gym", type: 'gym', b: [3, 0], rect: [250, 130, 150, 120], door: 'S', color: '#ffb36b', roof: '#333', emoji: '🏋️' },
  // Central Park
  { id: 'park', name: "Central Park", type: 'park', kind: 'area', b: [0, 1], rect: [0, 0, 420, 360], door: 'E', emoji: '🌳' },
  // Café + bookshop
  { id: 'cafe', name: "Time Out Café", type: 'cafe', b: [1, 1], rect: [30, 120, 190, 130], door: 'S', color: '#d7b98e', roof: '#6d4c41', emoji: '☕' },
  { id: 'books', name: "Half Page Books", type: 'books', b: [1, 1], rect: [250, 70, 150, 120], door: 'N', color: '#cfe3d4', roof: '#2e6b4f', emoji: '📚' },
  // Cinema + hot pot
  { id: 'mall', name: "Starlight Cinema", type: 'mall', b: [2, 1], rect: [20, 20, 250, 190], door: 'S', color: '#f7d4e4', roof: '#a23e72', emoji: '🎬' },
  { id: 'hotpot', name: "Old Wang's Hot Pot", type: 'hotpot', b: [2, 1], rect: [300, 130, 110, 120], door: 'S', color: '#ffcf9e', roof: '#c0392b', emoji: '🍲' },
  // Seaview Apartments + design studio
  { id: 'apt2', name: "Seaview Apartments", type: 'apartment', b: [3, 1], rect: [30, 40, 180, 284], door: 'S', color: '#b8dfe6', roof: '#2d6a7a', emoji: '🏬' },
  { id: 'studio', name: "Blue Cat Studio", type: 'studio', b: [3, 1], rect: [250, 150, 150, 130], door: 'S', color: '#a7c7f2', roof: '#2f4f8f', emoji: '🐱' },
  // Willow Lane houses
  { id: 'wt1', name: "Willow Ln. #1", type: 'house', b: [0, 2], rect: [30, 36, 150, 110], door: 'N', color: '#d4e6b5', roof: '#8a5a44' },
  { id: 'wt2', name: "Willow Ln. #2", type: 'house', b: [0, 2], rect: [240, 36, 150, 110], door: 'N', color: '#f7e1b5', roof: '#3d6e9e' },
  { id: 'wt3', name: "Willow Ln. #3", type: 'house', b: [0, 2], rect: [30, 214, 150, 110], door: 'S', color: '#e3c8f0', roof: '#a14d4d' },
  { id: 'wt4', name: "Willow Ln. #4", type: 'house', b: [0, 2], rect: [240, 214, 150, 110], door: 'S', color: '#ffd8b1', roof: '#4a7d4a' },
  // Bar + flower shop
  { id: 'bar', name: "Night Owl Bar", type: 'bar', b: [1, 2], rect: [30, 110, 200, 160], door: 'S', color: '#4a3b5c', roof: '#1f1830', emoji: '🍸' },
  { id: 'flower', name: "Lily's Flowers", type: 'flower', b: [1, 2], rect: [270, 60, 130, 110], door: 'N', color: '#fde2e4', roof: '#e07a9b', emoji: '💐' },
  // Funland
  { id: 'fun', name: "Funland", type: 'fun', kind: 'area', b: [2, 2], rect: [0, 0, 420, 360], door: 'N', emoji: '🎡' },
  // Market + fire station
  { id: 'market', name: "Good Neighbor Market", type: 'market', b: [3, 2], rect: [30, 60, 210, 160], door: 'N', color: '#e6f4d7', roof: '#4c9a2a', emoji: '🛒' },
  { id: 'fire', name: "Fire Station", type: 'fire', b: [3, 2], rect: [270, 170, 130, 154], door: 'S', color: '#f5c2c2', roof: '#b71c1c', emoji: '🚒' },
];


// Date venues (picked from shared interests)
const VENUES = {
  cafe: { verb: 'grab coffee' }, mall: { verb: 'see a movie' }, gym: { verb: 'work out together' }, books: { verb: 'browse books' },
  hotpot: { verb: 'have hot pot' }, bar: { verb: 'get a drink' }, park: { verb: 'take a walk' }, fun: { verb: 'ride the Ferris wheel' },
};

const INTERESTS = {
  'coffee': { venue: 'cafe', lines: ["I can't survive without three coffees a day.", 'I just started pour-over. Burned my hand three times.'] },
  'movies': { venue: 'mall', lines: ['I saw a movie last week and cried through a whole pack of tissues.', 'I can recite an entire old movie, line by line.'] },
  'working out': { venue: 'gym', lines: ['It was leg day. I can barely walk.', 'My goal is to lift a fridge with one hand.'] },
  'books': { venue: 'books', lines: ["I'm reading an 800-page novel. I'm on page three.", "The bookshop owner says I'm the quietest customer ever."] },
  'good food': { venue: 'hotpot', lines: ['I know where the best hot pot in town is.', 'My life goal is to eat my way down this whole street.'] },
  'music': { venue: 'bar', lines: ["I'm learning guitar. The neighbors have knocked twice.", 'I have three thousand songs on my phone, all by the same band.'] },
  'video games': { venue: 'mall', lines: ['I gamed until 3 a.m. and lost ten in a row.', "I'm ranked 78th on the whole server!"] },
  'cats': { venue: 'cafe', lines: ['My cat chewed through my headphone cable today.', 'My cat is a pickier eater than I am.'] },
  'dogs': { venue: 'park', lines: ['I dream of a dog that can catch a frisbee.', 'I cannot walk past a dog without stopping.'] },
  'travel': { venue: 'fun', lines: ['Last year I went to the desert alone to see the stars.', 'My suitcase is fuller than my closet.'] },
  'drawing': { venue: 'park', lines: ['I drew a self-portrait. My friend said it looks like a potato.', 'I want to draw this whole town.'] },
  'dancing': { venue: 'bar', lines: ['I out-dance the aunties at square dancing.', 'When the music starts, my feet stop listening to me.'] },
  'fishing': { venue: 'park', lines: ['I sat by the lake all day and caught a flip-flop.', 'Fishing is just talking to yourself.'] },
  'the stock market': { venue: 'cafe', lines: ['Lost a hot-pot dinner on stocks again yesterday.', 'I read charts better than I read people.'] },
  'photography': { venue: 'fun', lines: ["I've taken ten thousand photos. I like three of them.", "Let me take your picture. You'll love it, promise!"] },
  'astrology': { venue: 'cafe', lines: ['I checked before leaving: Mercury is in retrograde.', "What's your sign? I need to know first."] },
  'anime': { venue: 'mall', lines: ['My show dropped a new episode today!', 'I have two hundred figurines in my room.'] },
  'gardening': { venue: 'park', lines: ['Another succulent died on my balcony.', 'Flowers can hear you, you know.'] },
  'shopping': { venue: 'mall', lines: ["My closet won't close anymore.", 'The word "SALE" makes my heart race.'] },
  'chess': { venue: 'park', lines: ["Thirty years of park chess and I've never lost. Except yesterday.", 'Life is a game of chess.'] },
};
const TEMPER_NAME = { warm: 'sweet', tsun: 'prickly', chatty: 'chatty', shy: 'shy', romantic: 'romantic', nerd: 'logical', wild: 'wild', grumpy: 'grumpy' };
// How outgoing: decides who tends to make the calls
const EXTRO = { warm: .6, tsun: .35, chatty: .95, shy: .15, romantic: .7, nerd: .3, wild: .9, grumpy: .4 };
// Temper compatibility (symmetric)
const TEMPER_MATCH = {
  'tsun-warm': .5, 'chatty-shy': .45, 'nerd-nerd': .4, 'grumpy-grumpy': -.6, 'shy-wild': -.35, 'romantic-romantic': .5,
  'nerd-romantic': -.4, 'chatty-grumpy': -.45, 'tsun-tsun': -.5, 'wild-wild': .4, 'grumpy-warm': .35, 'chatty-chatty': .2,
  'nerd-wild': -.3, 'romantic-shy': .3, 'tsun-grumpy': -.3, 'chatty-nerd': -.2, 'romantic-warm': .3, 'shy-shy': -.2,
  'grumpy-shy': -.25, 'tsun-chatty': .15, 'tsun-nerd': .25, 'wild-warm': .2, 'romantic-wild': .25,
};

// ---------- 26 residents ----------
// look: skin, hair {s style, c color}, hat {t, c}, top {t, c, c2}, bottom {t, c}, shoes, acc[], h height, w build
// work: {loc, start, end, mode: inside/spot/roam/drive/wander/patrol, label, pose, days: 'wk' weekdays only / 'all'}
// go: how they get around: walk/bike/taxi/car
const PEOPLE = [
  { id: 'A', name: "Abby", age: 23, job: "barista", temper: 'chatty', likes: ["coffee", "cats", "drawing"], home: 'wt1', go: 'walk',
    work: { loc: 'cafe', start: 7.5, end: 15.5, mode: 'spot', spot: 'counter', label: "making coffee", pose: 'stand', days: 'all' }, wake: 6.6, sleep: 23,
    look: { skin: '#ffe0c7', hair: { s: 'pigtails', c: '#ff8fb1' }, top: { t: 'apron', c: '#fff4e6', c2: '#8d5b3a' }, bottom: { t: 'skirt', c: '#3d405b' }, shoes: '#8d5b3a', acc: [], h: .92, w: .95 },
    thoughts: ["Today's latte art looks like a chicken. I'll call it a swan.", "The café cat is hiding under the counter again.", "Foam foam foam foam~", "Someone just ordered twelve iced americanos!"] },
  { id: 'B', name: "Ben", age: 34, job: "programmer", temper: 'nerd', likes: ["video games", "anime", "good food"], home: 'apt1', go: 'taxi',
    work: { loc: 'office', start: 9.5, end: 19.5, mode: 'inside', label: "writing code", days: 'wk' }, wake: 8.3, sleep: 1.5,
    look: { skin: '#f1c27d', hair: { s: 'messy', c: '#2b2b2b' }, top: { t: 'hoodie', c: '#5c6b7a' }, bottom: { t: 'pants', c: '#2e3440' }, shoes: '#e5e5e5', acc: ['glasses', 'backpack'], h: 1.02, w: 1.1 },
    thoughts: ["This bug wasn't here yesterday.", "But it works on my machine...", "What should I order for lunch...", "The requirements changed. Again."] },
  { id: 'C', name: "Carlos", age: 41, job: "hot pot chef", temper: 'grumpy', likes: ["good food", "fishing", "the stock market"], home: 'fy1', go: 'car', car: '#2f6fb0',
    work: { loc: 'hotpot', start: 10, end: 21.5, mode: 'inside', label: "cooking broth", days: 'all' }, wake: 7, sleep: 23.5,
    look: { skin: '#e0ac69', hair: { s: 'short', c: '#1a1a1a' }, hat: { t: 'chef', c: '#ffffff' }, top: { t: 'tee', c: '#ffffff', c2: '#c0392b' }, bottom: { t: 'pants', c: '#333' }, shoes: '#222', acc: ['mustache'], h: 1.0, w: 1.35 },
    thoughts: ["More beef tallow.", "Who took my knife?!", "This tripe isn't fresh. Not selling it!", "My stocks are as green as lettuce."] },
  { id: 'D', name: "Diana", age: 29, job: "doctor", temper: 'tsun', likes: ["books", "working out", "travel"], home: 'apt2', go: 'car', car: '#ffffff',
    work: { loc: 'hospital', start: 8, end: 18, mode: 'inside', label: "seeing patients", days: 'wk' }, wake: 6.8, sleep: 23,
    look: { skin: '#ffdbac', hair: { s: 'bun', c: '#4a2c1a' }, top: { t: 'labcoat', c: '#ffffff', c2: '#7fb3d5' }, bottom: { t: 'pants', c: '#7fb3d5' }, shoes: '#fff', acc: ['glasses'], h: 1.0, w: .9 },
    thoughts: ["Next patient.", "I'm NOT tired.", "The break-room coffee tastes like dishwater.", "Who's running in the hallway?!"] },
  { id: 'E', name: "Grandpa Earl", age: 68, job: "retiree", temper: 'warm', likes: ["chess", "fishing", "gardening"], home: 'fy2', go: 'walk',
    work: { loc: 'park', start: 6.5, end: 11, mode: 'wander', label: "doing tai chi", pose: 'taichi', days: 'all' }, wake: 5.5, sleep: 21.5,
    look: { skin: '#e8b98a', hair: { s: 'bald', c: '#dddddd' }, top: { t: 'tang', c: '#c0392b', c2: '#f1c40f' }, bottom: { t: 'pants', c: '#222' }, shoes: '#111', acc: ['beard', 'cane'], h: .9, w: 1.0 },
    thoughts: ["Young people should sleep early.", "I'll spot you a rook.", "What lovely sunshine today.", "Back in my day..."] },
  { id: 'F', name: "Fifi", age: 25, job: "livestreamer", temper: 'wild', likes: ["photography", "travel", "dancing"], home: 'apt1', go: 'taxi',
    work: { loc: 'fun', start: 13, end: 18, mode: 'wander', label: "livestreaming", pose: 'selfie', days: 'all' }, wake: 10.5, sleep: 2,
    look: { skin: '#fce1d4', hair: { s: 'long', c: '#f7d774' }, top: { t: 'crop', c: '#ff4fa3' }, bottom: { t: 'shorts', c: '#5ad1e6' }, shoes: '#fff', acc: ['sunglasses', 'handbag'], h: 1.04, w: .85 },
    thoughts: ["Smash that follow button, fam!", "This angle makes my face look tiny~", "Sparkle every day!", "3, 2, 1, link's up!"] },
  { id: 'G', name: "Gus", age: 30, job: "personal trainer", temper: 'warm', likes: ["working out", "good food", "dogs"], home: 'apt2', go: 'walk',
    work: { loc: 'gym', start: 9, end: 17, mode: 'spot', spot: 'yard', label: "coaching clients", pose: 'pushup', days: 'all' }, wake: 6, sleep: 22.5,
    look: { skin: '#c68642', hair: { s: 'mohawk', c: '#111' }, top: { t: 'tank', c: '#ffcc00' }, bottom: { t: 'shorts', c: '#222' }, shoes: '#ff5722', acc: ['earring'], h: 1.12, w: 1.3 },
    thoughts: ["One more set!", "Protein, protein!", "Chest day or back day?", "Never skip leg day!"] },
  { id: 'H', name: "Hazel", age: 22, job: "bookshop clerk", temper: 'shy', likes: ["books", "cats", "astrology"], home: 'wt2', go: 'bike',
    work: { loc: 'books', start: 10, end: 19, mode: 'inside', label: "shelving books", days: 'all' }, wake: 7.8, sleep: 23.5,
    look: { skin: '#fff0e1', hair: { s: 'long', c: '#111' }, hat: { t: 'beret', c: '#a83250' }, top: { t: 'cardigan', c: '#e9c46a', c2: '#fff' }, bottom: { t: 'skirt', c: '#264653' }, shoes: '#6d4c41', acc: ['glasses'], h: .9, w: .85 },
    thoughts: ["(quietly) Welcome...", "Let's not talk to anyone today.", "I already guessed this book's ending.", "Scorpios should stay home today."] },
  { id: 'I', name: "Ivan", age: 36, job: "delivery rider", temper: 'chatty', likes: ["video games", "good food", "dogs"], home: 'wt3', go: 'bike',
    work: { loc: 'city', start: 10.5, end: 21, mode: 'roam', label: "delivering food", days: 'all' }, wake: 9, sleep: 0.5,
    look: { skin: '#f3d2b3', hair: { s: 'short', c: '#c97d3a' }, hat: { t: 'helmet', c: '#ffd400' }, top: { t: 'jacket', c: '#ffd400', c2: '#222' }, bottom: { t: 'pants', c: '#333' }, shoes: '#222', acc: ['box', 'beard'], h: 1.06, w: 1.05 },
    thoughts: ["Your order is here!", "Three minutes until it's late!", "The elevator's broken again...", "Five stars, please!"] },
  { id: 'J', name: "Juno", age: 20, job: "art student", temper: 'romantic', likes: ["anime", "dancing", "astrology"], home: 'apt1', go: 'walk',
    work: { loc: 'school', start: 8.5, end: 16, mode: 'inside', label: "in class", days: 'wk' }, wake: 7.3, sleep: 0.5,
    look: { skin: '#ffe5d0', hair: { s: 'ponytail', c: '#7b3f00' }, hat: { t: 'bunny', c: '#ffffff' }, top: { t: 'sailor', c: '#ffffff', c2: '#1d3557' }, bottom: { t: 'skirt', c: '#1d3557' }, shoes: '#111', acc: ['blush'], h: .88, w: .85 },
    thoughts: ["If only fate had a red thread...", "Tonight's sunset looks like a manga.", "My final project isn't done!", "What a round moon~"] },
  { id: 'K', name: "Officer Kurt", age: 45, job: "traffic officer", temper: 'grumpy', likes: ["fishing", "books", "dogs"], home: 'fy3', go: 'walk',
    work: { loc: 'corner', start: 7, end: 17, mode: 'patrol', label: "directing traffic", pose: 'wave', days: 'all' }, wake: 5.8, sleep: 22,
    look: { skin: '#d9a066', hair: { s: 'short', c: '#333' }, hat: { t: 'police', c: '#1f3a93' }, top: { t: 'uniform', c: '#2c4f8c', c2: '#f1c40f' }, bottom: { t: 'pants', c: '#1f2d4d' }, shoes: '#111', acc: ['mustache', 'sunglasses'], h: 1.05, w: 1.1 },
    thoughts: ["You! Stop that car!", "Look at the light before crossing!", "Tweeeet!", "Nobody ran a red light today. How lonely."] },
  { id: 'L', name: "Lily", age: 31, job: "florist", temper: 'romantic', likes: ["gardening", "photography", "coffee"], home: 'wt4', go: 'walk',
    work: { loc: 'flower', start: 9, end: 18, mode: 'spot', spot: 'front', label: "wrapping bouquets", pose: 'stand', days: 'all' }, wake: 7, sleep: 23,
    look: { skin: '#f5d0b0', hair: { s: 'wavy', c: '#8b5a2b' }, hat: { t: 'straw', c: '#e9c46a' }, top: { t: 'dress', c: '#f4a6c1', c2: '#fff' }, bottom: { t: 'none' }, shoes: '#fff', acc: [], h: .98, w: .95 },
    thoughts: ["The roses look great today.", "Every bouquet has a story.", "Someone bought 99 roses! A proposal?!", "The sunflowers need more sun."] },
  { id: 'M', name: "Marco", age: 27, job: "street musician", temper: 'romantic', likes: ["music", "travel", "coffee"], home: 'apt2', go: 'bike',
    work: { loc: 'park', start: 15, end: 20, mode: 'spot', spot: 'stage', label: "busking with a guitar", pose: 'guitar', days: 'all' }, wake: 10, sleep: 2,
    look: { skin: '#f0c8a0', hair: { s: 'long', c: '#3b2414' }, hat: { t: 'beanie', c: '#e76f51' }, top: { t: 'jacket', c: '#222', c2: '#555' }, bottom: { t: 'pants', c: '#3a5a80' }, shoes: '#6d4c41', acc: ['guitar'], h: 1.02, w: .9 },
    thoughts: ["♪ la la la~", "Made $3.50 today.", "This song is for someone I haven't met yet.", "Broke another string."] },
  { id: 'N', name: "Ned", age: 39, job: "taxi driver", temper: 'chatty', likes: ["the stock market", "fishing", "good food"], home: 'wt3', go: 'car', taxi: true,
    work: { loc: 'road', start: 7, end: 19, mode: 'drive', label: "driving a taxi", days: 'all' }, wake: 6, sleep: 22.5,
    look: { skin: '#e0ac69', hair: { s: 'short', c: '#222' }, hat: { t: 'cap', c: '#2a9d8f' }, top: { t: 'vest', c: '#e9c46a', c2: '#ffffff' }, bottom: { t: 'pants', c: '#4a4a4a' }, shoes: '#222', acc: [], h: .98, w: 1.3 },
    thoughts: ["Let me tell ya, buddy... oh wait, I'm the driver.", "Traffic again on this road.", "Where to? Hop in!", "Twenty fares today!"] },
  { id: 'O', name: "Odette", age: 26, job: "dance teacher", temper: 'wild', likes: ["dancing", "music", "working out"], home: 'apt1', go: 'taxi',
    work: { loc: 'school', start: 13, end: 20, mode: 'inside', label: "teaching street dance", days: 'all' }, wake: 9.5, sleep: 1.5,
    look: { skin: '#8d5524', hair: { s: 'afro', c: '#9b5de5' }, top: { t: 'crop', c: '#00f5d4' }, bottom: { t: 'pants', c: '#222', }, shoes: '#fee440', acc: ['earring', 'headphones'], h: 1.06, w: .9 },
    thoughts: ["Five, six, seven, eight!", "Rhythm is in my blood!", "This music isn't loud enough.", "I can spin this move ten times."] },
  { id: 'P', name: "Pete", age: 33, job: "free spirit (naturist)", temper: 'wild', likes: ["working out", "travel", "photography"], home: 'fy4', go: 'walk',
    work: { loc: 'city', start: 9, end: 12, mode: 'roam', label: "jogging in the buff", pose: 'run', days: 'all' }, wake: 7.5, sleep: 23,
    look: { skin: '#f2c49b', hair: { s: 'curly', c: '#d4a017' }, top: { t: 'none' }, bottom: { t: 'briefs', c: '#ff3b3b' }, shoes: '#fff', acc: ['beard'], h: 1.0, w: 1.0 },
    thoughts: ["Clothes are a cage for the soul!", "I love the breeze!", "Officer, I'm not bothering anyone!", "Freedom!"] },
  { id: 'Q', name: "Queenie", age: 24, job: "heiress", temper: 'tsun', likes: ["shopping", "travel", "dogs"], home: 'apt2', go: 'car', car: '#e63946', dog: '#fff',
    work: { loc: 'mall', start: 13, end: 17, mode: 'spot', spot: 'plaza', label: "shopping", pose: 'stand', days: 'all' }, wake: 11, sleep: 1,
    look: { skin: '#fff1e6', hair: { s: 'wavy', c: '#f4d58d' }, hat: { t: 'tiara', c: '#ffd700' }, top: { t: 'dress', c: '#ffafcc', c2: '#ffffff' }, bottom: { t: 'none' }, shoes: '#ff006e', acc: ['handbag', 'sunglasses'], h: .96, w: .85 },
    thoughts: ["I'll buy the whole store.", "I do NOT take the bus.", "Snowball, no barking!", "So bored. Maybe a new bag."] },
  { id: 'R', name: "Rocky", age: 29, job: "firefighter", temper: 'warm', likes: ["working out", "dogs", "video games"], home: 'apt1', go: 'walk',
    work: { loc: 'fire', start: 8, end: 20, mode: 'inside', label: "on call", days: 'all' }, wake: 6.5, sleep: 23,
    look: { skin: '#d8a47f', hair: { s: 'short', c: '#5a3825' }, hat: { t: 'fireman', c: '#d62828' }, top: { t: 'uniform', c: '#3d3d3d', c2: '#ffd60a' }, bottom: { t: 'pants', c: '#3d3d3d' }, shoes: '#111', acc: [], h: 1.12, w: 1.2 },
    thoughts: ["Hope it stays quiet today.", "I've slid down that pole ten thousand times.", "Whose cat is up a tree now?", "The captain's cooking is awful."] },
  { id: 'S', name: "Mr. Sterling", age: 47, job: "executive", temper: 'nerd', likes: ["the stock market", "travel", "books"], home: 'apt2', go: 'car', car: '#1b1b1b',
    work: { loc: 'office', start: 8.5, end: 20, mode: 'inside', label: "in meetings", days: 'wk' }, wake: 6, sleep: 0,
    look: { skin: '#f1c27d', hair: { s: 'slick', c: '#555' }, top: { t: 'suit', c: '#1d2d44', c2: '#c1121f' }, bottom: { t: 'pants', c: '#1d2d44' }, shoes: '#000', acc: ['briefcase'], h: 1.04, w: 1.05 },
    thoughts: ["This quarter's numbers are off.", "Let's align on the granularity.", "We must embrace change.", "Meeting moved to 7 a.m. tomorrow."] },
  { id: 'T', name: "Tina", age: 28, job: "ice cream seller", temper: 'warm', likes: ["good food", "cats", "anime"], home: 'fy2', go: 'bike',
    work: { loc: 'fun', start: 11, end: 20, mode: 'spot', spot: 'icecream', label: "selling ice cream", pose: 'stand', days: 'all' }, wake: 8, sleep: 23,
    look: { skin: '#ffe0bd', hair: { s: 'curly', c: '#ff7f50' }, hat: { t: 'catears', c: '#ff7f50' }, top: { t: 'stripe', c: '#ffffff', c2: '#ff6b9a' }, bottom: { t: 'overalls', c: '#4ea8de' }, shoes: '#fff', acc: ['blush'], h: .9, w: 1.0 },
    thoughts: ["Strawberry's sold out!", "Want rainbow sprinkles?", "Grandpa went to play chess again.", "Ice cream saves the world!"] },
  { id: 'U', name: "Ursula", age: 35, job: "cashier", temper: 'chatty', likes: ["astrology", "good food", "dancing"], home: 'wt1', go: 'walk',
    work: { loc: 'market', start: 8, end: 17, mode: 'inside', label: "at the register", days: 'all' }, wake: 6.5, sleep: 22.5,
    look: { skin: '#e8beac', hair: { s: 'perm', c: '#7f1d1d' }, top: { t: 'apron', c: '#a7c957', c2: '#386641' }, bottom: { t: 'pants', c: '#6c584c' }, shoes: '#333', acc: ['earring', 'glasses'], h: .94, w: 1.15 },
    thoughts: ["Do you have a member card?", "Eggs are on sale today!", "New song for square dancing tonight.", "Wanna hear some gossip?"] },
  { id: 'V', name: "Victor", age: 32, job: "illustrator", temper: 'shy', likes: ["drawing", "coffee", "movies"], home: 'apt2', go: 'walk',
    work: { loc: 'studio', start: 10, end: 18, mode: 'inside', label: "drawing illustrations", days: 'wk' }, wake: 9, sleep: 1.5,
    look: { skin: '#f6d5b8', hair: { s: 'bob', c: '#264653' }, hat: { t: 'beret', c: '#222' }, top: { t: 'tee', c: '#f4f1de', c2: '#81b29a' }, bottom: { t: 'pants', c: '#81b29a' }, shoes: '#3d405b', acc: ['scarf', 'beard'], h: .98, w: .85 },
    thoughts: ["The client wants a 'colorful black'.", "This blue is wrong...", "Maybe I'll just paint the sky today.", "(staring out the window)"] },
  { id: 'W', name: "Wally", age: 26, job: "mall security guard", temper: 'shy', likes: ["movies", "video games", "good food"], home: 'apt1', go: 'walk',
    work: { loc: 'mall', start: 12, end: 22, mode: 'spot', spot: 'door', label: "standing guard", pose: 'stand', days: 'all' }, wake: 9.5, sleep: 1,
    look: { skin: '#f1c27d', hair: { s: 'short', c: '#000' }, hat: { t: 'cap', c: '#14213d' }, top: { t: 'uniform', c: '#14213d', c2: '#fca311' }, bottom: { t: 'pants', c: '#14213d' }, shoes: '#000', acc: [], h: 1.08, w: .95 },
    thoughts: ["Please show your... never mind, go ahead.", "Six hours standing. My legs hurt.", "Movie tickets are sold out today.", "That guy with no clothes ran by again..."] },
  { id: 'X', name: "Xena", age: 30, job: "nurse", temper: 'warm', likes: ["movies", "cats", "travel"], home: 'apt1', go: 'taxi',
    work: { loc: 'hospital', start: 12, end: 22, mode: 'inside', label: "on the late shift", days: 'all' }, wake: 9.5, sleep: 2,
    look: { skin: '#ffe0c7', hair: { s: 'bob', c: '#2d2d2d' }, hat: { t: 'nurse', c: '#ffffff' }, top: { t: 'dress', c: '#ffffff', c2: '#ff8fab' }, bottom: { t: 'none' }, shoes: '#fff', acc: [], h: .96, w: .9 },
    thoughts: ["Thirty blood pressures to take today.", "A patient said my smile is angelic.", "The stars are bright on the late shift.", "I'm sleeping twelve hours after this!"] },
  { id: 'Y', name: "Yuki", age: 27, job: "programmer", temper: 'nerd', likes: ["video games", "anime", "music"], home: 'apt2', go: 'bike',
    work: { loc: 'office', start: 10, end: 19, mode: 'inside', label: "fixing bugs", days: 'wk' }, wake: 8.5, sleep: 1.5,
    look: { skin: '#fbe3cf', hair: { s: 'bob', c: '#7b2cbf' }, top: { t: 'hoodie', c: '#2b2d42' }, bottom: { t: 'shorts', c: '#8d99ae' }, shoes: '#ef233c', acc: ['headphones', 'glasses'], h: .92, w: .9 },
    thoughts: ["Can't build this feature.", "Why does it work? Don't touch it.", "Gaming after work.", "git push --force... kidding."] },
  { id: 'Z', name: "Zeke", age: 38, job: "bartender", temper: 'grumpy', likes: ["music", "movies", "fishing"], home: 'apt1', go: 'walk',
    work: { loc: 'bar', start: 17, end: 23.8, mode: 'inside', label: "mixing drinks", days: 'all' }, wake: 11, sleep: 3,
    look: { skin: '#c68642', hair: { s: 'bald', c: '#333' }, top: { t: 'vest', c: '#222', c2: '#ffffff' }, bottom: { t: 'pants', c: '#3e2723' }, shoes: '#111', acc: ['bigbeard', 'tattoo', 'earring'], h: 1.1, w: 1.25 },
    thoughts: ["The usual?", "This one's called 'Heartbreak'. On the house.", "Don't cry at my bar.", "Shake shake shake..."] },
];


// After-work places: [place, activity, how they stay there]
const HOBBY_PLACES = {
  'coffee': ['cafe', 'having coffee', 'spot'], 'movies': ['mall', 'watching a movie', 'inside'], 'working out': ['gym', 'lifting weights', 'inside'], 'books': ['books', 'reading', 'inside'],
  'good food': ['hotpot', 'eating hot pot', 'inside'], 'music': ['bar', 'listening to live music', 'inside'], 'video games': ['mall', 'at the arcade', 'inside'], 'cats': ['cafe', 'petting the café cat', 'spot'],
  'dogs': ['park', 'walking the dog', 'wander'], 'travel': ['fun', 'wandering around', 'wander'], 'drawing': ['park', 'sketching outdoors', 'wander'], 'dancing': ['park', 'square dancing', 'wander'],
  'fishing': ['park', 'fishing by the lake', 'wander'], 'the stock market': ['cafe', 'watching stock charts', 'spot'], 'photography': ['fun', 'taking photos', 'wander'], 'astrology': ['cafe', 'reading horoscopes', 'spot'],
  'anime': ['mall', 'browsing the figurine shop', 'inside'], 'gardening': ['flower', 'buying flowers', 'inside'], 'shopping': ['mall', 'shopping', 'inside'], 'chess': ['park', 'playing chess', 'wander'],
};

// ---------- Script library ----------
// {a} speaker {b} the other person {t} topic {p} place {v} what to do there
const L = {
  greetFirst: {
    warm: ['Hi! So nice to finally meet you~', 'Was the trip okay? I got you something warm.'],
    tsun: ["Hmph. I did NOT get here early on purpose.", "So you're {b}? ...You're okay, I guess."],
    chatty: ['Hi hi hi! On the way here I saw a dog wearing pants!', "Hi! Let me introduce myself. This'll take about ten minutes."],
    shy: ['Um... h-hi...', '(quietly) Hey...'],
    romantic: ['{p} looks extra lovely today. Maybe because you came.', 'Hi. I think we met in a dream once.'],
    nerd: ['Hello. You are 3 minutes 12 seconds late.', 'Hi. I checked: this place is rated 4.7.'],
    wild: ["Yo! Finally! We're gonna have SO much fun today!", "Hey! Have we met before? No? Well, now we have!"],
    grumpy: ["You're here. Sit.", 'So many people here. Annoying.'],
  },
  greetAgain: {
    warm: ['Hi again! Long day?', 'I missed you, hehe.'],
    tsun: ["Y-you asked me out again? ...Fine. Sit.", 'I just happened to be in the area.'],
    chatty: ['Guess what happened to me today!', 'I have eight things to tell you!'],
    shy: ['Hi... you look nice today.', 'I-I wore something new.'],
    romantic: ['Every time feels like the first time.', 'I was counting the minutes.'],
    nerd: ['This is date number {n}.', 'I arrived ten minutes early.'],
    wild: ["Babe! Let's go!", "Let's do something crazy today!"],
    grumpy: ["Mm. Good, you're here.", 'Work was awful today. Glad you came.'],
  },
  ask: ['{b}, do you like {t}?', 'Are you into {t}?', 'So... how do you feel about {t}?'],
  love: {
    warm: ['I love it! We have the same taste!'], tsun: ['...I-it\'s fine. I only do it every week.'], chatty: ['OMG! {t}! I could talk about it for three days!'],
    shy: ['Y-yes! I really like {t} too.'], romantic: ['{t} is part of my soul.'], nerd: ['Yes. I have studied {t} systematically.'],
    wild: ["Heck yes! {t} all the way!"], grumpy: ['{t} is fine. Better than people.'],
  },
  meh: {
    warm: ["I don't know much about {t}, but you could teach me."], tsun: ['{t}? Boring.'], chatty: ['{t}, huh... um... so, have you eaten?'],
    shy: ["I... don't really know about that... (looks down)"], romantic: ['{t} sounds nice, as long as I\'m with you.'], nerd: ['{t} lacks logic. Not interested.'],
    wild: ['{t}? That\'s way too tame!'], grumpy: ['Nope. Next topic.'],
  },
  praise: {
    warm: ['You have a really nice smile.'], tsun: ['Your outfit today is... not bad.'], chatty: ['Where did you get that outfit?! So cute!'],
    shy: ['You... you look really nice today.'], romantic: ['Did you know there are stars in your eyes?'], nerd: ['Your facial proportions are close to the golden ratio.'],
    wild: ["You look way too good. That's cheating!"], grumpy: ['You look... decent today.'],
  },
  praiseYes: {
    warm: ['So do you~'], tsun: ['H-hmph! Obviously! (blushing)'], chatty: ['Really? Really?! Say it again!'], shy: ['(turns red to the ears)'],
    romantic: ['Then keep looking.'], nerd: ['Thank you. I will log that.'], wild: ['I know! Haha!'], grumpy: ['...Knock it off. (smiling a little)'],
  },
  praiseNo: {
    warm: ['Oh... thanks.'], tsun: ['Cheesy.'], chatty: ['Hahaha, wow, smooth talker... (awkward laugh)'], shy: ['... (has no idea what to say)'],
    romantic: ['Mm... thank you.'], nerd: ['That conclusion is not rigorous.'], wild: ['So corny, hahaha.'], grumpy: ['Get to the point.'],
  },
  awkward: ['...', '(ten seconds of silence)', 'So... the weather... haha...', 'Waiter! Another one, please!', '(checks phone)', 'Um... you go first.'],
  byeGood: {
    warm: ['I had a great time. See you soon!', 'Today was lovely. Thank you~'], tsun: ["If you ask me out again... I might not say no."], chatty: ["I'll send you a voice message when I get home! A long one!"],
    shy: ['Thanks for today... (waves)', 'S-see you next time...'], romantic: ['The moon will remember tonight.', "I'll dream about today."], nerd: ["Today's date rating: 9.2.", 'Data collected. Results: positive.'],
    wild: ["Next time we go somewhere even crazier!", 'That was a blast!'], grumpy: ['Get home safe. Text me.', 'Not bad. Not bad at all.'],
  },
  byeBad: {
    warm: ["Well... let's leave it here.", 'Take care, okay?'], tsun: ["I'm leaving. Don't walk me home."], chatty: ['Oh no, I just remembered I left the stove on!'], shy: ['I... should go home.', 'Um... bye.'],
    romantic: ['Maybe we were just passing by.'], nerd: ['I need to re-evaluate.'], wild: ['Boring. I\'m out.'], grumpy: ['Bye.', 'Whatever. Later.'],
  },
  confess: {
    warm: ['{b}, I think... I like you.'], tsun: ["I d-don't like you! ...Okay, a little. A lot."],
    chatty: ["I thought for ages about how to say this, so I'll just say it: I like you!"], shy: ['I... I like you!! (voice shaking)'],
    romantic: ['I want to watch every sunset with you. Will you be mine?'], nerd: ['After long observation, my conclusion is: I like you.'],
    wild: ["Stop stalling. Let's be together!"], grumpy: ["Hey. Be with me. I'll look out for you."],
  },
  accept: {
    warm: ['Me too!'], tsun: ['Dummy... yes.'], chatty: ['AAAH! Yes! I\'m telling the whole world!'], shy: ['Mm... (nods hard)'],
    romantic: ["I've waited so long to hear that."], nerd: ['Agreed. Today is now our anniversary.'], wild: ['Took you long enough! Let\'s celebrate!'], grumpy: ['...Fine. (ears turning red)'],
  },
  reject: {
    warm: ["Sorry... let's just be friends."], tsun: ['In your dreams!'], chatty: ["Oh... can't we just be best friends?"], shy: ["I-I'm not ready..."],
    romantic: ["The one in my heart... hasn't shown up yet."], nerd: ['Insufficient data. Cannot accept for now.'], wild: ['I want a few more years of freedom!'], grumpy: ['No.'],
  },
  propose: ["{b}, let's get married! 💍", '{b}, I want to spend every day with you. 💍'],
  wed: ['Yes! YES!', 'I do. (crying happy tears)'],
  fightStart: ["You're late AGAIN!", "Why didn't you answer my texts?", 'You said you\'d take me to {p}!', "Do you even care about me?", "You're gaming again?!", "You spent all that money?!"],
  fightBack: {
    warm: ["I'm sorry, it's my fault..."], tsun: ["Don't yell at me!"], chatty: ['Let me explain! So here\'s what happened...'], shy: ['(eyes tearing up)'],
    romantic: ["You've changed."], nerd: ['Your accusation lacks evidence.'], wild: ['Whatever!'], grumpy: ['Are you done?!'],
  },
  breakup: {
    warm: ["I'm sorry, I'm just tired. Let's break up."], tsun: ["We're done! I never want to see you again! (turns away crying)"], chatty: ["Let's... break up. I don't want to talk about it this time."],
    shy: ["I think... we're not right for each other..."], romantic: ["Maybe we were only passing through each other's lives."], nerd: ['Our compatibility score fell below threshold. Goodbye.'],
    wild: ['Bye-bye, then!'], grumpy: ["Enough. We're over!"],
  },
  breakupReply: ['...Okay.', "You'll regret this!", '(crying)', 'I hope you find happiness.', 'Fine, go!', '...I saw this coming.'],
  // First call: how they "meet"
  meetCute: [
    'Hello? Is this {b}? I found your wallet...',
    "Hi, I'm the one who helped you pick up your stuff at {p}. Remember?",
    'Hello? I think your package got delivered to my door...',
    "Sorry, I think I dialed the wrong number... but you have a nice voice.",
    "Hi, I'm your downstairs neighbor. Your laundry fell onto my balcony.",
    "Hi, is this {b}? A friend of ours said we should meet.",
    'Hi! I tripped over a red thread on the street, and the other end... seems to be you.',
  ],
  meetReply: {
    warm: ['Oh! Thank you so much!'], tsun: ['How did you get my number? ...Whatever. Thanks.'], chatty: ['Whoa, really?! Who are you? Where are you? How old are you?'],
    shy: ['Oh... y-yes, that\'s me... thank you...'], romantic: ['This must be fate.'], nerd: ['The odds of that are low. Interesting.'],
    wild: ['Hahaha, what?! I love it!'], grumpy: ['...Oh. Thanks.'],
  },
  invite: ['So... want to {v} at {p}? My treat!', 'Free this week? Let\'s {v} at {p}.', "To say thanks, let's {v} at {p}?"],
  inviteYes: ['Sure!', "...Fine, consider it a favor repaid.", 'Let me check my schedule... I\'m free!', "Yes! It's a date!"],
  inviteNo: ["I'm a bit busy lately. Another time?", 'Let me think about it...', "Not this week. Maybe next time."],
  callHi: ['What are you up to?', "Hey~ it's me.", 'Guess who?', 'Have you eaten yet?'],
  callStatus: ["I'm {s} right now.", 'Still {s}. So tired.', "I'm {s}. Kind of missing you."],
  callChat: {
    warm: ['Take care of yourself, okay?', "What do you want for dinner? I'll bring it."], tsun: ['Oh. I was just asking.', 'W-who said I miss you?!'], chatty: ['I have gossip!', 'Did you know eggs are on sale today?!'],
    shy: ['Mm...', 'I... just wanted to hear your voice.'], romantic: ['The moon is beautiful tonight.', 'I saw a cloud that looked like you.'], nerd: ['I wrote a script to estimate your commute.', 'Noted.'],
    wild: ["I'm so bored, come out and play!", 'I almost fell off my skateboard, haha!'], grumpy: ['Mm. Hanging up.', 'Someone annoyed me again today.'],
  },
  callLove: ['Miss you.', 'Love you.', 'Sleep early, good night~', 'I like you a lot today too.', 'Mwah!'],
  cancel: ['Sorry, I have to work late tonight... another day?', "I'm not feeling well today. Next time?"],
  stoodUp: ['Is {b} even coming?!', "I've waited an hour...", "Forget it, I'm leaving."],
  late: ['Sorry, sorry! Traffic was terrible!', 'Why are you so late?!'],
  smallTalk: [
    ['Morning!', 'Morning!'], ['So hot today.', 'Tell me about it.'], ['You come here too?', 'Yeah, all the time.'], ['Did you see the guy with no clothes?', 'I did...'],
    ['How are your stocks?', "Don't ask."], ['This place is nice.', 'Right?!'], ['Love your hat!', 'Hehe, thanks.'], ['Got a light?', "I don't smoke."],
  ],
  // Little surprises during a date ({x} is someone passing by)
  incidents: [
    { text: '(It suddenly starts raining. The two of them squeeze under one umbrella.)', d: [6, 6], need: 1 },
    { text: '({a} accidentally spills a drink on {b}.)', d: [-2, -6] },
    { text: "({a}'s phone rings. It's the boss.)", d: [-1, -5] },
    { text: '({x} jogs past without a stitch of clothing...)', d: [2, 2], who: 'P' },
    { text: '({x} walks by and winks at them.)', d: [1, 1] },
    { text: '(They both reach for the last snack. Their hands touch.)', d: [7, 7] },
    { text: '({a} tells a bad joke. Three seconds of silence.)', d: [-1, -3] },
    { text: '({a} insists on paying.)', d: [1, 5] },
    { text: '(A street musician nearby starts a love song.)', d: [4, 4] },
    { text: '({a} sneezes extremely loudly.)', d: [0, -2] },
  ],
};

// Inner thoughts by situation
const CONTEXT_THOUGHTS = {
  sleep: ['Zzz...', 'Zzz... (mumbling) one more bowl...', 'Zzz...'],
  taxi: ['Driver, faster please!', 'Feeling a bit carsick...'],
  wait: ['Where is my taxi...', '🚕?'],
  walk: ['Nice weather today.', 'Walking counts as exercise.', 'Huh, was this street always like this?'],
  rain: ['Rain! And no umbrella!', 'This rain is so annoying.'],
  single: ["Being single isn't so bad.", 'When will I meet the one?'],
  heartbroken: ["I'm not sad. Not at all...", '(staring at phone)', 'I need a drink tonight.'],
  inlove: ['Wonder what {p} is doing...', 'Missing {p}.', '(grinning like a fool)'],
};
