// Mock data for the games lobby
// Module export/asset-path plumbing adapted for a plain <script> global.
(function () {
const PROVIDERS = [
  'Saba',
  'Bti',
  'Evolution',
  'Pragmatic Play',
  'PG Soft',
  'Microgaming',
  'Playtech',
  'NetEnt',
  'JDB',
  'CQ9',
  'Jili',
  'Spadegaming',
  'Habanero',
  'Yggdrasil',
  'Red Tiger',
  'NoLimit City',
  'Relax Gaming',
  'Hacksaw Gaming',
  'Spribe',
  'Ezugi',
];

const GAME_TAGS = ['Hot', 'New', '2x', 'Top', '⚡', 'Live', 'VIP'];
const assetPath = (path) => path;

function makeGames(category, count, hueBase, imagePrefix = 'game') {
  const titles = {
    slots: ['Neon Vault', 'Cosmic Drift', 'Sugar Rush 9000', 'Golden Hex', 'Wild Riders',
            'Volt Strike', 'Hyper Reels', 'Crown of Aether', 'Pixel Pirates', 'Mega Moon',
            'Inferno Coins', 'Polar Quest', 'Atlantic Loot', 'Skyline Spin', 'Zen Garden',
            'Phantom Cash', 'Diamond Forge', 'Bull Rush', 'Tiki Tides', 'Ronin Reels'],
    live: ['Lightning Roulette', 'Crazy Time Live', 'Blackjack VIP A', 'Mega Wheel', 'Baccarat Squeeze',
           'Speed Roulette', 'Dragon Tiger', 'Monopoly Live', 'Sic Bo', 'Hold\'em Royale',
           'Auto Roulette', 'XXXtreme Lightning'],
    originals: ['Crash 100', 'Mines', 'Plinko', 'Dice', 'Limbo',
                'Hilo', 'Keno', 'Wheel', 'Tower', 'Diamonds',
                'Roulette X', 'Coin Flip'],
    table: ['European Roulette', 'Single Deck Blackjack', 'Pai Gow', 'Texas Hold\'em',
            'Caribbean Stud', 'Three Card Poker', 'Casino War', 'Punto Banco',
            'Red Dog', 'High Card Flush', 'Let It Ride', 'Pontoon']
  };
  const arr = [];
  const list = titles[category];
  for (let i = 0; i < count; i++) {
    const t = list[i % list.length];
    const hue = (hueBase + i * 31) % 360;
    arr.push({
      id: `${category}-${i}`,
      title: t,
      category,
      provider: PROVIDERS[i % PROVIDERS.length],
      hue,
      tag: i % 3 === 0 ? GAME_TAGS[i % GAME_TAGS.length] : null,
      players: 80 + ((i * 137) % 4200),
      rtp: (94 + ((i * 7) % 6) + ((i * 13) % 100) / 100).toFixed(2),
      maxWin: `${500 + ((i * 91) % 50000)}x`,
      image: assetPath(`assets/mock/${imagePrefix}-${String((i % 12) + 1).padStart(2, '0')}.webp`),
    });
  }
  return arr;
}

const GAMES = {
  slots:     makeGames('slots',     30, 280),
  live:      makeGames('live',      30,  10, 'live'),
  originals: makeGames('originals', 30, 200),
  table:     makeGames('table',     30, 130),
};

const HERO_SLIDES = [
  { eyebrow: 'WEEKLY DROP',  title: '$250,000 Vault\nUnlock Saturday',  sub: 'Spin any qualifying slot to enter. The bigger you bet, the bigger your slice.', hue: 290, badge: 'LIVE NOW', image: assetPath('assets/mock/hero-1.webp'), position: 'center', mobilePosition: '68% center' },
  { eyebrow: 'NEW ORIGINAL', title: 'Crash 100 is\nlive in beta',       sub: 'Our flagship original — provably fair multipliers up to 1,000,000×.',           hue: 200, badge: 'BETA', image: assetPath('assets/mock/hero-2.webp'), position: 'center', mobilePosition: '70% center' },
  { eyebrow: 'TOURNAMENT',   title: 'Race for $50K\nin 72 hours',        sub: 'Top 100 players split the prize pool. Climb the leaderboard live.',              hue: 340, badge: 'ENDS 2D 14H', image: assetPath('assets/mock/hero-3.webp'), position: 'center', mobilePosition: '72% center' },
  {
    eyebrow: 'PRIVATE ACCESS',
    title: 'Private tables.\nPriority rewards.',
    sub: 'A premium gaming experience backed by fast settlement and transparent account controls.',
    hue: 42,
    badge: 'INVITATION',
    image: assetPath('assets/mock/hero-4-v2.jpg'),
    position: 'center',
    size: 'cover',
    mobilePosition: '82% center',
    mobileSize: 'cover',
    overlay: 'linear-gradient(90deg, rgba(5, 6, 7, .92) 0%, rgba(8, 8, 8, .72) 24%, rgba(13, 11, 9, .38) 44%, rgba(24, 17, 11, .12) 62%, rgba(5, 7, 10, 0) 82%)',
  },
  {
    eyebrow: 'GLOBAL FOOTBALL',
    title: 'The world plays.\nYou set the odds.',
    sub: 'Follow marquee matches, live markets, and championship moments from one secure account.',
    hue: 48,
    badge: 'MATCHDAY',
    image: assetPath('assets/mock/hero-5-v2.jpg'),
    position: 'right center',
    size: 'cover',
    mobilePosition: 'right center',
    mobileSize: 'cover',
    overlay: 'linear-gradient(90deg, rgba(4, 7, 9, .94) 0%, rgba(6, 10, 13, .74) 24%, rgba(8, 14, 17, .40) 44%, rgba(17, 19, 18, .12) 62%, rgba(5, 7, 10, 0) 82%)',
  }
];

const SPOTLIGHT_GAMES = [
  { tag: '獨家', title: 'Sugar Rush 9000', sub: 'Evolution', cta: '馬上遊戲', image: assetPath('assets/mock/game-01.webp') },
  { tag: '熱門', title: 'Crash 100', sub: '公平驗證 · 最高 1,000,000×', cta: '查看更多', image: assetPath('assets/mock/game-02.webp') },
  { tag: '新遊戲', title: 'Volt Strike', sub: 'Microgaming', cta: '馬上遊戲', image: assetPath('assets/mock/game-03.webp') },
  { tag: '限時活動', title: '每日競賽 · 瓜分 $100,000', sub: '天天投注天天贏', cta: '立即競賽', image: assetPath('assets/mock/game-04.webp') },
  { tag: '獨家', title: 'Golden Hex', sub: 'Pragmatic Play', cta: '馬上遊戲', image: assetPath('assets/mock/game-05.webp') },
  { tag: 'VIP', title: 'Crown of Aether', sub: 'NetEnt', cta: '馬上遊戲', image: assetPath('assets/mock/game-06.webp') },
  { tag: '熱門', title: 'Lightning Roulette', sub: 'Evolution', cta: '查看更多', image: assetPath('assets/mock/game-07.webp') },
  { tag: '新遊戲', title: 'Plinko', sub: '原創遊戲', cta: '馬上遊戲', image: assetPath('assets/mock/game-08.webp') },
  { tag: '限時活動', title: '新會員迎新加碼', sub: '首存 100% 上不封頂', cta: '立即領取', image: assetPath('assets/mock/game-09.webp') },
  { tag: '獨家', title: 'Cosmic Drift', sub: 'Bti', cta: '馬上遊戲', image: assetPath('assets/mock/game-10.webp') },
];

const PROMOS = [
  { title: '100% First Deposit', sub: 'Up to 10,000 USDT',  icon: '◉', hue: 290 },
  { title: 'Daily Reload',       sub: '15% back, every day', icon: '◇', hue: 200 },
  { title: 'Refer a Friend',     sub: 'Earn 25% lifetime',   icon: '△', hue: 340 },
  { title: 'VIP Cashback',       sub: 'Up to 20% weekly',    icon: '◯', hue:  60 }
];

const WINNERS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  user: ['CryptoKing','Nova','Blackbird','Mira','V0idR4t','Hydra','Lupin','Aki','Echo','Kade',
         'Sable','Ronin','Qüip','Ferro','Zen0','Dax','Hush','Vex'][i],
  game: ['Sugar Rush 9000','Crash 100','Mega Moon','Lightning Roulette','Wild Riders','Mines',
         'Golden Hex','Plinko','Crazy Time Live','Volt Strike','Inferno Coins','Crown of Aether',
         'Sugar Rush 9000','Crash 100','Pixel Pirates','Phantom Cash','Diamond Forge','Hyper Reels'][i],
  bet:    (10 + (i * 7)  % 200).toFixed(2),
  mult:   (2  + (i * 13) % 480).toFixed(2),
  payout: ((10 + (i * 7) % 200) * (2 + (i * 13) % 480)).toFixed(2),
  avatar: ['CK','NV','BB','MR','VR','HY','LP','AK','EC','KD','SB','RN','QP','FR','ZN','DX','HS','VX'][i],
  hue: (i * 47) % 360
}));

const TOURNAMENTS = [
  { title: 'Saturday Slot Race', prize: '$50,000', endsIn: '2d 14h', players: 4129, hue: 290, tag: 'FEATURED' },
  { title: 'Crash Kings',        prize: '$25,000', endsIn: '6h 22m', players: 2104, hue: 200, tag: 'ENDS SOON' },
  { title: 'Live Casino Cup',    prize: '$15,000', endsIn: '4d 0h',  players:  870, hue: 340, tag: null }
];

// Featured tournament hero card banner — reuses the same sports/matchday
// artwork as the "GLOBAL FOOTBALL" hero slide.
const TOURNAMENT_HERO_IMAGE = assetPath('assets/mock/hero-5-v2.jpg');

const RECENTLY_PLAYED = [
  GAMES.slots[2], GAMES.originals[0], GAMES.slots[5],
  GAMES.live[0],  GAMES.slots[1],     GAMES.originals[2],
  GAMES.slots[7], GAMES.table[0]
];

window.CMS_DATA = { PROVIDERS, GAMES, HERO_SLIDES, SPOTLIGHT_GAMES, PROMOS, WINNERS, TOURNAMENTS, TOURNAMENT_HERO_IMAGE, RECENTLY_PLAYED };
})();
