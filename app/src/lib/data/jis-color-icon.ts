const JIS_COLOR_ICON = {
  //
  // 動物系
  //

  // 鳥
  bird: "game-icons:egyptian-bird",
  // 小鳥
  songbird: "game-icons:hummingbird",
  // 孔雀
  peacock: "fluent-emoji-high-contrast:peacock",
  // ネズミ
  mouse: "game-icons:seated-mouse",
  // 魚
  fish: "game-icons:school-of-fish",
  // イカ
  squid: "game-icons:giant-squid",
  // ヒトデ
  starfish: "game-icons:sea-star",
  // 貝
  shell: "emojione-monotone:spiral-shell",

  //
  // 植物系
  //

  sakura: "fluent-emoji-high-contrast:cherry-blossom",
  flower: "game-icons:spoted-flower",

  // 珊瑚
  coral: "temaki:coral-reef",
  // サボテン
  cactus: "game-icons:cactus-pot",
  // 竹
  bamboo: "game-icons:bamboo",
  // 稲
  rice: "emojione-monotone:sheaf-of-rice",
  // 植物
  plant: "game-icons:plant-roots",
  // 草
  grass: "game-icons:high-grass",
  // 芽
  sprout: "game-icons:sprout",
  // 木の葉
  leaf: "file-icons:leaflet",
  // 落ち葉
  fallenLeaf: "emojione-monotone:fallen-leaf",
  // 植木
  pottedPlant: "roentgen:tree-with-leaf-urban-tree-pot",
  // 木の幹
  trunk: "game-icons:birch-trees",

  //
  // 食べ物系
  //

  // チョコレート
  chocolate: "fluent-emoji-high-contrast:chocolate-bar",
  // 栗
  chestnut: "emojione-monotone:chestnut",
  // フルーツ
  fruit: "healthicons:fruits",
  // 葡萄
  grape: "game-icons:grapes",
  // りんご
  apple: "game-icons:shiny-apple",
  // みかん
  orange: "game-icons:orange-slice",
  // ナス
  eggplant: "emojione-monotone:eggplant",
  // 唐辛子
  chiliPepper: "game-icons:chili-pepper",
  // オリーブ
  olive: "game-icons:olive",
  // ミント
  mint: "file-icons:mint",
  // ワイン
  wine: "mdi:glass-wine",
  // カクテル
  cocktail: "icon-park-solid:liqueur",
  // ボトル
  bottle: "game-icons:brandy-bottle",
  // ミルク
  milk: "game-icons:milk-carton",

  //
  // 人系
  //

  // 髪
  hair: "fluent-emoji-high-contrast:hair-pick",
  // 赤ちゃん
  baby: "mdi:child-toy",
  // 王冠
  crown: "game-icons:crown",
  // 軍
  army: "game-icons:custodian-helmet",
  // 海軍
  navy: "game-icons:anchor",
  // 騎士
  knight: "game-icons:mounted-knight",

  //
  // 布系
  //

  // 糸巻き
  thread: "fluent-emoji-high-contrast:thread",
  // 布
  cloth: "game-icons:rolled-cloth",
  // 羊毛
  wool: "game-icons:wool",
  // 革
  leather: "game-icons:leather-boot",

  //
  // 自然系
  //

  // 空
  sky: "fluent:weather-sunny-high-20-regular",
  // 太陽
  sun: "streamline-ultimate:mist-sun-bold",
  // 月
  moon: "game-icons:moon",
  // 川
  river: "game-icons:river",

  // 化石
  fossil: "game-icons:fossil",
  // 石
  stone: "game-icons:stone-pile",
  // 岩
  rock: "game-icons:stone-tablet",
  // 鉱石
  ore: "game-icons:ore",
  // 宝石
  jewelry: "game-icons:emerald",
  // 象牙
  ivory: "game-icons:ivory-tusks",

  //
  // 塗料系
  //

  // スタンプ
  stamp: "temaki:stamp",

  // 絵の具
  artPaint: "pepicons-pencil:paint-pallet",
  // 塗料
  paint: "game-icons:paint-bucket",

  //
  // その他
  //

  // プリンター
  printer: "dashicons:printer",
  // シャベル
  shovel: "mynaui:shovel-solid",
  // 香水
  perfume: "game-icons:delicate-perfume",
  // コイン
  coin: "game-icons:two-coins",
  // 陶器
  pottery: "game-icons:painted-pottery",
  // 壺
  jar: "game-icons:cloth-jar",
  // 煉瓦
  brick: "mdi:bricks",
  // 鉄
  iron: "game-icons:steel-door",
  // 炭
  charcoal: "game-icons:thrown-charcoal",
  // 火
  fire: "game-icons:campfire",
  // 和風
  japanese: "game-icons:japanese-bridge"
}

export type JISColorIconKey = keyof typeof JIS_COLOR_ICON

export const JIS_COLOR_ICON_MAP = new Map<JISColorIconKey, string>(
  Object.entries(JIS_COLOR_ICON) as [JISColorIconKey, string][]
)
