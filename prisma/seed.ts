// Seeds a top-20 slice of the Pokémon Champions meta with illustrative usage stats.
// Numbers are static fixtures, not live tournament data.
// Localized names are the official Pokémon Company translations to the best of public knowledge.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPRITE = (dex: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`;

const REG_M_A = "reg-m-a";

type I18n = { en: string; ja: string; "zh-Hans": string; "zh-Hant": string };

const POKEMON: Array<{
  dexNo: number;
  slug: string;
  name: string;
  i18n: I18n;
  type1: string;
  type2: string | null;
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
  abilities: string[];
  hiddenAbility: string | null;
  usagePct: number;
  rank: number;
}> = [
  { dexNo: 903, slug: "sneasler",         name: "Sneasler",         i18n: { en: "Sneasler",         ja: "オオニューラ",       "zh-Hans": "大狃拉",       "zh-Hant": "大狃拉" }, type1: "fighting", type2: "poison",  hp: 80,  atk: 130, def: 60,  spa: 40,  spd: 80,  spe: 120, abilities: ["unburden","poison-touch"], hiddenAbility: "pickpocket", usagePct: 43.80, rank: 1 },
  { dexNo: 727, slug: "incineroar",       name: "Incineroar",       i18n: { en: "Incineroar",       ja: "ガオガエン",         "zh-Hans": "炽焰咆哮虎",   "zh-Hant": "熾焰咆哮虎" }, type1: "fire",     type2: "dark",    hp: 95,  atk: 115, def: 90,  spa: 80,  spd: 90,  spe: 60,  abilities: ["blaze","intimidate"], hiddenAbility: "intimidate", usagePct: 62.40, rank: 2 },
  { dexNo: 445, slug: "garchomp",         name: "Garchomp",         i18n: { en: "Garchomp",         ja: "ガブリアス",         "zh-Hans": "烈咬陆鲨",     "zh-Hant": "烈咬陸鯊" }, type1: "dragon",   type2: "ground",  hp: 108, atk: 130, def: 95,  spa: 80,  spd: 85,  spe: 102, abilities: ["sand-veil"], hiddenAbility: "rough-skin", usagePct: 38.10, rank: 3 },
  { dexNo: 983, slug: "kingambit",        name: "Kingambit",        i18n: { en: "Kingambit",        ja: "ドドゲザン",         "zh-Hans": "仆斩将军",     "zh-Hant": "僕斬將軍" }, type1: "dark",     type2: "steel",   hp: 100, atk: 135, def: 120, spa: 60,  spd: 85,  spe: 50,  abilities: ["defiant","supreme-overlord"], hiddenAbility: "pressure", usagePct: 35.70, rank: 4 },
  { dexNo: 902, slug: "basculegion",      name: "Basculegion",      i18n: { en: "Basculegion",      ja: "イダイトウ",         "zh-Hans": "幽尾玄鱼",     "zh-Hant": "幽尾玄魚" }, type1: "water",    type2: "ghost",   hp: 120, atk: 112, def: 65,  spa: 80,  spd: 75,  spe: 78,  abilities: ["swift-swim","adaptability"], hiddenAbility: "mold-breaker", usagePct: 29.40, rank: 5 },
  { dexNo: 645, slug: "landorus-therian", name: "Landorus-Therian", i18n: { en: "Landorus-Therian", ja: "ランドロス(れいじゅう)", "zh-Hans": "土地云(灵兽)", "zh-Hant": "土地雲(靈獸)" }, type1: "ground", type2: "flying", hp: 89, atk: 145, def: 90, spa: 105, spd: 80, spe: 91, abilities: ["intimidate"], hiddenAbility: null, usagePct: 28.20, rank: 6 },
  { dexNo: 405, slug: "luxray",           name: "Luxray",           i18n: { en: "Luxray",           ja: "レントラー",         "zh-Hans": "伦琴猫",       "zh-Hant": "倫琴貓" }, type1: "electric", type2: null,      hp: 80,  atk: 120, def: 79,  spa: 95,  spd: 79,  spe: 70,  abilities: ["rivalry","intimidate"], hiddenAbility: "guts", usagePct: 18.30, rank: 7 },
  { dexNo: 706, slug: "goodra-hisuian",   name: "Goodra (Hisuian)", i18n: { en: "Goodra (Hisuian)", ja: "ヒスイヌメルゴン",   "zh-Hans": "洗翠黏美龙",   "zh-Hant": "洗翠黏美龍" }, type1: "steel",   type2: "dragon",  hp: 80, atk: 100, def: 100, spa: 110, spd: 150, spe: 60, abilities: ["sap-sipper","shell-armor"], hiddenAbility: "gooey", usagePct: 16.90, rank: 8 },
  { dexNo: 196, slug: "espeon",           name: "Espeon",           i18n: { en: "Espeon",           ja: "エーフィ",           "zh-Hans": "太阳伊布",     "zh-Hant": "太陽伊布" }, type1: "psychic",  type2: null,      hp: 65,  atk: 65,  def: 60,  spa: 130, spd: 95,  spe: 110, abilities: ["synchronize"], hiddenAbility: "magic-bounce", usagePct: 15.60, rank: 9 },
  { dexNo: 612, slug: "haxorus",          name: "Haxorus",          i18n: { en: "Haxorus",          ja: "オノノクス",         "zh-Hans": "双斧战龙",     "zh-Hant": "雙斧戰龍" }, type1: "dragon",   type2: null,      hp: 76,  atk: 147, def: 90,  spa: 60,  spd: 70,  spe: 97,  abilities: ["rivalry","mold-breaker"], hiddenAbility: "unnerve", usagePct: 14.20, rank: 10 },
  { dexNo: 376, slug: "metagross",        name: "Metagross",        i18n: { en: "Metagross",        ja: "メタグロス",         "zh-Hans": "巨金怪",       "zh-Hant": "巨金怪" }, type1: "steel",    type2: "psychic", hp: 80,  atk: 135, def: 130, spa: 95,  spd: 90,  spe: 70,  abilities: ["clear-body"], hiddenAbility: "light-metal", usagePct: 13.50, rank: 11 },
  { dexNo: 248, slug: "tyranitar",        name: "Tyranitar",        i18n: { en: "Tyranitar",        ja: "バンギラス",         "zh-Hans": "班基拉斯",     "zh-Hant": "班基拉斯" }, type1: "rock",     type2: "dark",    hp: 100, atk: 134, def: 110, spa: 95,  spd: 100, spe: 61,  abilities: ["sand-stream"], hiddenAbility: "unnerve", usagePct: 12.80, rank: 12 },
  { dexNo: 282, slug: "gardevoir",        name: "Gardevoir",        i18n: { en: "Gardevoir",        ja: "サーナイト",         "zh-Hans": "沙奈朵",       "zh-Hant": "沙奈朵" }, type1: "psychic",  type2: "fairy",   hp: 68,  atk: 65,  def: 65,  spa: 125, spd: 115, spe: 80,  abilities: ["synchronize","trace"], hiddenAbility: "telepathy", usagePct: 12.10, rank: 13 },
  { dexNo: 593, slug: "jellicent",        name: "Jellicent",        i18n: { en: "Jellicent",        ja: "ブルンゲル",         "zh-Hans": "胖嘟嘟",       "zh-Hant": "胖嘟嘟" }, type1: "water",    type2: "ghost",   hp: 100, atk: 60,  def: 70,  spa: 85,  spd: 105, spe: 60,  abilities: ["water-absorb","cursed-body"], hiddenAbility: "damp", usagePct: 11.40, rank: 14 },
  { dexNo: 530, slug: "excadrill",        name: "Excadrill",        i18n: { en: "Excadrill",        ja: "ドリュウズ",         "zh-Hans": "龙头地鼠",     "zh-Hant": "龍頭地鼠" }, type1: "ground",   type2: "steel",   hp: 110, atk: 135, def: 60,  spa: 50,  spd: 65,  spe: 88,  abilities: ["sand-rush","sand-force"], hiddenAbility: "mold-breaker", usagePct: 10.90, rank: 15 },
  { dexNo: 244, slug: "entei",            name: "Entei",            i18n: { en: "Entei",            ja: "エンテイ",           "zh-Hans": "炎帝",         "zh-Hant": "炎帝" }, type1: "fire",     type2: null,      hp: 115, atk: 115, def: 85,  spa: 90,  spd: 75,  spe: 100, abilities: ["pressure"], hiddenAbility: "inner-focus", usagePct: 9.60, rank: 16 },
  { dexNo: 894, slug: "regieleki",        name: "Regieleki",        i18n: { en: "Regieleki",        ja: "レジエレキ",         "zh-Hans": "雷吉艾勒奇",   "zh-Hant": "雷吉艾勒奇" }, type1: "electric", type2: null,      hp: 80,  atk: 100, def: 50,  spa: 100, spd: 50,  spe: 200, abilities: ["transistor"], hiddenAbility: null, usagePct: 9.10, rank: 17 },
  { dexNo: 6,   slug: "charizard",        name: "Charizard",        i18n: { en: "Charizard",        ja: "リザードン",         "zh-Hans": "喷火龙",       "zh-Hant": "噴火龍" }, type1: "fire",     type2: "flying",  hp: 78,  atk: 84,  def: 78,  spa: 109, spd: 85,  spe: 100, abilities: ["blaze"], hiddenAbility: "solar-power", usagePct: 8.50, rank: 18 },
  { dexNo: 9,   slug: "blastoise",        name: "Blastoise",        i18n: { en: "Blastoise",        ja: "カメックス",         "zh-Hans": "水箭龟",       "zh-Hant": "水箭龜" }, type1: "water",    type2: null,      hp: 79,  atk: 83,  def: 100, spa: 85,  spd: 105, spe: 78,  abilities: ["torrent"], hiddenAbility: "rain-dish", usagePct: 6.20, rank: 19 },
  { dexNo: 3,   slug: "venusaur",         name: "Venusaur",         i18n: { en: "Venusaur",         ja: "フシギバナ",         "zh-Hans": "妙蛙花",       "zh-Hant": "妙蛙花" }, type1: "grass",    type2: "poison",  hp: 80,  atk: 82,  def: 83,  spa: 100, spd: 100, spe: 80,  abilities: ["overgrow"], hiddenAbility: "chlorophyll", usagePct: 5.80, rank: 20 },
];

const ABILITIES: Array<{
  slug: string; name: string; i18n: I18n;
  shortDesc: string; shortDescI18n: I18n; longDesc: string; usagePct: number;
}> = [
  { slug: "intimidate", name: "Intimidate",
    i18n: { en: "Intimidate", ja: "いかく", "zh-Hans": "威吓", "zh-Hant": "威嚇" },
    shortDesc: "Lowers opponents' Attack on switch-in.",
    shortDescI18n: { en: "Lowers opponents' Attack on switch-in.", ja: "登場時に相手の攻撃を1段階下げる。", "zh-Hans": "登场时让对手的攻击下降1级。", "zh-Hant": "登場時讓對手的攻擊下降1級。" },
    longDesc: "When the Pokémon enters battle, it lowers the Attack stat of all adjacent opposing Pokémon by one stage.", usagePct: 31.0 },
  { slug: "supreme-overlord", name: "Supreme Overlord",
    i18n: { en: "Supreme Overlord", ja: "そうだいしょう", "zh-Hans": "大将", "zh-Hant": "大將" },
    shortDesc: "Attacks scale with fallen teammates.",
    shortDescI18n: { en: "Attacks scale with fallen teammates.", ja: "倒れた味方の数だけ攻撃と特攻が上がる。", "zh-Hans": "每有1只倒下的队友,攻击与特攻提升10%。", "zh-Hant": "每有1隻倒下的隊友,攻擊與特攻提升10%。" },
    longDesc: "The Pokémon's Attack and Special Attack increase by 10% for each ally that has already fainted.", usagePct: 14.5 },
  { slug: "unburden", name: "Unburden",
    i18n: { en: "Unburden", ja: "かるわざ", "zh-Hans": "轻装", "zh-Hant": "輕裝" },
    shortDesc: "Doubles Speed when item is consumed.",
    shortDescI18n: { en: "Doubles Speed when item is consumed.", ja: "持ち物を失うと素早さが2倍になる。", "zh-Hans": "失去持有道具时速度提升至2倍。", "zh-Hant": "失去持有道具時速度提升至2倍。" },
    longDesc: "If the Pokémon's held item is consumed or removed, its Speed is doubled until it leaves the field.", usagePct: 12.2 },
  { slug: "adaptability", name: "Adaptability",
    i18n: { en: "Adaptability", ja: "てきおうりょく", "zh-Hans": "适应力", "zh-Hant": "適應力" },
    shortDesc: "STAB becomes 2× instead of 1.5×.",
    shortDescI18n: { en: "STAB becomes 2× instead of 1.5×.", ja: "タイプ一致技の威力が2倍に。", "zh-Hans": "本系技能加成由1.5倍变为2倍。", "zh-Hant": "本系技能加成由1.5倍變為2倍。" },
    longDesc: "Same-type attack bonus is increased from 1.5× to 2× for moves that match the Pokémon's type.", usagePct: 11.8 },
  { slug: "transistor", name: "Transistor",
    i18n: { en: "Transistor", ja: "トランジスタ", "zh-Hans": "电晶体", "zh-Hant": "電晶體" },
    shortDesc: "Powers up Electric-type moves by 30%.",
    shortDescI18n: { en: "Powers up Electric-type moves by 30%.", ja: "でんきタイプの技の威力が30%上がる。", "zh-Hans": "电属性招式威力提升30%。", "zh-Hant": "電屬性招式威力提升30%。" },
    longDesc: "Electric-type moves used by this Pokémon are boosted by 30%.", usagePct: 4.1 },
  { slug: "blaze", name: "Blaze",
    i18n: { en: "Blaze", ja: "もうか", "zh-Hans": "猛火", "zh-Hant": "猛火" },
    shortDesc: "Boosts Fire moves at low HP.",
    shortDescI18n: { en: "Boosts Fire moves at low HP.", ja: "HPがピンチの時にほのお技を強化。", "zh-Hans": "HP濒危时火属性招式威力提升。", "zh-Hant": "HP瀕危時火屬性招式威力提升。" },
    longDesc: "When HP drops below 1/3, Fire-type moves deal 50% more damage.", usagePct: 3.8 },
  { slug: "rough-skin", name: "Rough Skin",
    i18n: { en: "Rough Skin", ja: "さめはだ", "zh-Hans": "粗糙皮肤", "zh-Hant": "粗糙皮膚" },
    shortDesc: "Damages attackers on contact.",
    shortDescI18n: { en: "Damages attackers on contact.", ja: "接触してきた相手にダメージを与える。", "zh-Hans": "对接触自己的对手造成伤害。", "zh-Hant": "對接觸自己的對手造成傷害。" },
    longDesc: "Contact moves deal 1/8 of attacker's max HP as recoil damage.", usagePct: 9.4 },
  { slug: "sand-stream", name: "Sand Stream",
    i18n: { en: "Sand Stream", ja: "すなおこし", "zh-Hans": "扬沙", "zh-Hant": "揚沙" },
    shortDesc: "Summons a sandstorm on switch-in.",
    shortDescI18n: { en: "Summons a sandstorm on switch-in.", ja: "登場時に砂嵐を起こす。", "zh-Hans": "登场时召唤沙暴。", "zh-Hant": "登場時召喚沙暴。" },
    longDesc: "Sets sandstorm weather for 5 turns (8 with Smooth Rock) when this Pokémon enters battle.", usagePct: 7.2 },
];

const ITEMS: Array<{
  slug: string; name: string; i18n: I18n;
  category: string; description: string; descI18n: I18n; usagePct: number;
}> = [
  { slug: "focus-sash", name: "Focus Sash",
    i18n: { en: "Focus Sash", ja: "きあいのタスキ", "zh-Hans": "气势披带", "zh-Hant": "氣勢披帶" },
    category: "held", description: "Survives an OHKO from full HP with 1 HP remaining. Single use.",
    descI18n: { en: "Survives an OHKO from full HP with 1 HP remaining. Single use.", ja: "HP満タンから一撃で倒れる時、HP1で耐える。1回のみ。", "zh-Hans": "满HP时遭受一击必杀的招式可以1HP保留。仅一次。", "zh-Hant": "滿HP時遭受一擊必殺的招式可以1HP保留。僅一次。" },
    usagePct: 21.4 },
  { slug: "choice-scarf", name: "Choice Scarf",
    i18n: { en: "Choice Scarf", ja: "こだわりスカーフ", "zh-Hans": "讲究围巾", "zh-Hant": "講究圍巾" },
    category: "choice", description: "Boosts Speed by 50% but locks the user into one move.",
    descI18n: { en: "Boosts Speed by 50% but locks the user into one move.", ja: "素早さが1.5倍になるが、1つの技しか出せなくなる。", "zh-Hans": "速度提升1.5倍,但只能使用一种招式。", "zh-Hant": "速度提升1.5倍,但只能使用一種招式。" },
    usagePct: 16.8 },
  { slug: "choice-band", name: "Choice Band",
    i18n: { en: "Choice Band", ja: "こだわりハチマキ", "zh-Hans": "讲究头带", "zh-Hant": "講究頭帶" },
    category: "choice", description: "Boosts Attack by 50% but locks the user into one move.",
    descI18n: { en: "Boosts Attack by 50% but locks the user into one move.", ja: "攻撃が1.5倍になるが、1つの技しか出せなくなる。", "zh-Hans": "攻击提升1.5倍,但只能使用一种招式。", "zh-Hant": "攻擊提升1.5倍,但只能使用一種招式。" },
    usagePct: 12.3 },
  { slug: "leftovers", name: "Leftovers",
    i18n: { en: "Leftovers", ja: "たべのこし", "zh-Hans": "吃剩的东西", "zh-Hant": "吃剩的東西" },
    category: "held", description: "Restores 1/16 max HP at the end of every turn.",
    descI18n: { en: "Restores 1/16 max HP at the end of every turn.", ja: "毎ターン終了時にHPを1/16回復。", "zh-Hans": "每回合结束时回复1/16最大HP。", "zh-Hant": "每回合結束時回復1/16最大HP。" },
    usagePct: 11.9 },
  { slug: "safety-goggles", name: "Safety Goggles",
    i18n: { en: "Safety Goggles", ja: "ぼうじんゴーグル", "zh-Hans": "防尘护目镜", "zh-Hant": "防塵護目鏡" },
    category: "held", description: "Protects against powder moves and weather chip damage.",
    descI18n: { en: "Protects against powder moves and weather chip damage.", ja: "粉系の技と天候ダメージを無効化。", "zh-Hans": "无效化粉末类招式与天气伤害。", "zh-Hant": "無效化粉末類招式與天氣傷害。" },
    usagePct: 9.5 },
  { slug: "life-orb", name: "Life Orb",
    i18n: { en: "Life Orb", ja: "いのちのたま", "zh-Hans": "生命宝珠", "zh-Hant": "生命寶珠" },
    category: "held", description: "Boosts damage by 30% but the holder loses 1/10 max HP after each attack.",
    descI18n: { en: "Boosts damage by 30% but the holder loses 1/10 max HP after each attack.", ja: "技のダメージが1.3倍になるが、攻撃後にHPを1/10失う。", "zh-Hans": "招式伤害提升1.3倍,但攻击后失去1/10最大HP。", "zh-Hant": "招式傷害提升1.3倍,但攻擊後失去1/10最大HP。" },
    usagePct: 8.7 },
  { slug: "assault-vest", name: "Assault Vest",
    i18n: { en: "Assault Vest", ja: "とつげきチョッキ", "zh-Hans": "突击背心", "zh-Hant": "突擊背心" },
    category: "held", description: "Raises Sp. Def by 50%, but only damaging moves can be used.",
    descI18n: { en: "Raises Sp. Def by 50%, but only damaging moves can be used.", ja: "特防が1.5倍になるが、変化技が使えなくなる。", "zh-Hans": "特防提升1.5倍,但无法使用变化招式。", "zh-Hant": "特防提升1.5倍,但無法使用變化招式。" },
    usagePct: 13.6 },
  { slug: "rocky-helmet", name: "Rocky Helmet",
    i18n: { en: "Rocky Helmet", ja: "ゴツゴツメット", "zh-Hans": "凸凸头盔", "zh-Hant": "凸凸頭盔" },
    category: "held", description: "Contact attackers lose 1/6 of their max HP.",
    descI18n: { en: "Contact attackers lose 1/6 of their max HP.", ja: "接触技を受けると相手のHPを1/6削る。", "zh-Hans": "受到接触招式时令对手损失1/6最大HP。", "zh-Hant": "受到接觸招式時令對手損失1/6最大HP。" },
    usagePct: 10.2 },
];

const MOVES: Array<{
  slug: string; name: string; i18n: I18n;
  type: string; category: string;
  power: number | null; accuracy: number | null; pp: number; priority: number;
  targetShape: string; makesContact: boolean;
  effectText: string; effectI18n: I18n; usagePct: number;
}> = [
  { slug: "fake-out", name: "Fake Out",
    i18n: { en: "Fake Out", ja: "ねこだまし", "zh-Hans": "击掌奇袭", "zh-Hant": "擊掌奇襲" },
    type: "normal", category: "physical", power: 40, accuracy: 100, pp: 10, priority: 3, targetShape: "single", makesContact: true,
    effectText: "Flinches the target. Only works on the user's first turn out.",
    effectI18n: { en: "Flinches the target. Only works on the user's first turn out.", ja: "ひるませる。場に出た最初のターンのみ。", "zh-Hans": "使对手畏缩。仅在出场首回合可用。", "zh-Hant": "使對手畏縮。僅在出場首回合可用。" },
    usagePct: 28.5 },
  { slug: "protect", name: "Protect",
    i18n: { en: "Protect", ja: "まもる", "zh-Hans": "守住", "zh-Hant": "守住" },
    type: "normal", category: "status", power: null, accuracy: null, pp: 8, priority: 4, targetShape: "self", makesContact: false,
    effectText: "Blocks all moves from hitting the user this turn. Fails consecutively.",
    effectI18n: { en: "Blocks all moves from hitting the user this turn. Fails consecutively.", ja: "そのターンの攻撃をすべて防ぐ。連発すると失敗しやすくなる。", "zh-Hans": "防住本回合受到的所有招式。连续使用易失败。", "zh-Hant": "防住本回合受到的所有招式。連續使用易失敗。" },
    usagePct: 41.2 },
  { slug: "earthquake", name: "Earthquake",
    i18n: { en: "Earthquake", ja: "じしん", "zh-Hans": "地震", "zh-Hant": "地震" },
    type: "ground", category: "physical", power: 100, accuracy: 100, pp: 10, priority: 0, targetShape: "all-adjacent", makesContact: false,
    effectText: "Hits all adjacent Pokémon. 0.75× damage in doubles.",
    effectI18n: { en: "Hits all adjacent Pokémon. 0.75× damage in doubles.", ja: "周囲全員を攻撃。ダブルでは威力0.75倍。", "zh-Hans": "攻击周围全员。双打中威力为0.75倍。", "zh-Hant": "攻擊周圍全員。雙打中威力為0.75倍。" },
    usagePct: 22.1 },
  { slug: "knock-off", name: "Knock Off",
    i18n: { en: "Knock Off", ja: "はたきおとす", "zh-Hans": "拍落", "zh-Hant": "拍落" },
    type: "dark", category: "physical", power: 65, accuracy: 100, pp: 20, priority: 0, targetShape: "single", makesContact: true,
    effectText: "Removes the target's held item and powers up if one is held.",
    effectI18n: { en: "Removes the target's held item and powers up if one is held.", ja: "相手の持ち物を落とす。持っていれば威力1.5倍。", "zh-Hans": "拍掉对手的持有道具。若有则威力提升1.5倍。", "zh-Hant": "拍掉對手的持有道具。若有則威力提升1.5倍。" },
    usagePct: 19.7 },
  { slug: "parting-shot", name: "Parting Shot",
    i18n: { en: "Parting Shot", ja: "すてゼリフ", "zh-Hans": "抛下狠话", "zh-Hant": "拋下狠話" },
    type: "dark", category: "status", power: null, accuracy: 100, pp: 20, priority: 0, targetShape: "single", makesContact: false,
    effectText: "Lowers target's Attack and Sp. Attack by one stage, then switches out.",
    effectI18n: { en: "Lowers target's Attack and Sp. Attack by one stage, then switches out.", ja: "相手の攻撃と特攻を1段階下げてから交代する。", "zh-Hans": "降低对手攻击与特攻各1级,然后换下场。", "zh-Hant": "降低對手攻擊與特攻各1級,然後換下場。" },
    usagePct: 14.8 },
  { slug: "flare-blitz", name: "Flare Blitz",
    i18n: { en: "Flare Blitz", ja: "フレアドライブ", "zh-Hans": "闪焰冲锋", "zh-Hant": "閃焰衝鋒" },
    type: "fire", category: "physical", power: 120, accuracy: 100, pp: 15, priority: 0, targetShape: "single", makesContact: true,
    effectText: "Heavy contact attack; user takes 1/3 of damage dealt as recoil. 10% burn chance.",
    effectI18n: { en: "Heavy contact attack; user takes 1/3 of damage dealt as recoil. 10% burn chance.", ja: "強力な接触技。与えたダメージの1/3を反動で受ける。10%でやけど。", "zh-Hans": "强力接触招式;反伤1/3。10%几率灼伤。", "zh-Hant": "強力接觸招式;反傷1/3。10%幾率灼傷。" },
    usagePct: 12.3 },
  { slug: "close-combat", name: "Close Combat",
    i18n: { en: "Close Combat", ja: "インファイト", "zh-Hans": "近身战", "zh-Hant": "近身戰" },
    type: "fighting", category: "physical", power: 120, accuracy: 100, pp: 5, priority: 0, targetShape: "single", makesContact: true,
    effectText: "High-damage contact attack; lowers user's Defense and Sp. Def by one stage.",
    effectI18n: { en: "High-damage contact attack; lowers user's Defense and Sp. Def by one stage.", ja: "強力な接触技。自分の防御と特防を1段階下げる。", "zh-Hans": "强力接触招式;自身防御与特防各下降1级。", "zh-Hant": "強力接觸招式;自身防禦與特防各下降1級。" },
    usagePct: 11.0 },
  { slug: "thunderbolt", name: "Thunderbolt",
    i18n: { en: "Thunderbolt", ja: "10まんボルト", "zh-Hans": "10万伏特", "zh-Hant": "10萬伏特" },
    type: "electric", category: "special", power: 90, accuracy: 100, pp: 15, priority: 0, targetShape: "single", makesContact: false,
    effectText: "10% chance to paralyze the target.",
    effectI18n: { en: "10% chance to paralyze the target.", ja: "10%の確率でマヒ。", "zh-Hans": "10%几率使对手麻痹。", "zh-Hant": "10%幾率使對手麻痺。" },
    usagePct: 17.4 },
  { slug: "ice-beam", name: "Ice Beam",
    i18n: { en: "Ice Beam", ja: "れいとうビーム", "zh-Hans": "冰冻光束", "zh-Hant": "冰凍光束" },
    type: "ice", category: "special", power: 90, accuracy: 100, pp: 10, priority: 0, targetShape: "single", makesContact: false,
    effectText: "10% chance to freeze the target.",
    effectI18n: { en: "10% chance to freeze the target.", ja: "10%の確率でこおり。", "zh-Hans": "10%几率使对手冰冻。", "zh-Hant": "10%幾率使對手冰凍。" },
    usagePct: 15.3 },
  { slug: "psychic", name: "Psychic",
    i18n: { en: "Psychic", ja: "サイコキネシス", "zh-Hans": "精神强念", "zh-Hant": "精神強念" },
    type: "psychic", category: "special", power: 90, accuracy: 100, pp: 10, priority: 0, targetShape: "single", makesContact: false,
    effectText: "10% chance to lower target's Sp. Def by one stage.",
    effectI18n: { en: "10% chance to lower target's Sp. Def by one stage.", ja: "10%の確率で相手の特防を1段階下げる。", "zh-Hans": "10%几率使对手特防下降1级。", "zh-Hant": "10%幾率使對手特防下降1級。" },
    usagePct: 9.8 },
  { slug: "dragon-claw", name: "Dragon Claw",
    i18n: { en: "Dragon Claw", ja: "ドラゴンクロー", "zh-Hans": "龙爪", "zh-Hant": "龍爪" },
    type: "dragon", category: "physical", power: 80, accuracy: 100, pp: 15, priority: 0, targetShape: "single", makesContact: true,
    effectText: "Solid Dragon-type contact attack with no secondary effect.",
    effectI18n: { en: "Solid Dragon-type contact attack with no secondary effect.", ja: "安定したドラゴンタイプの接触技。", "zh-Hans": "稳定的龙属性接触招式。", "zh-Hant": "穩定的龍屬性接觸招式。" },
    usagePct: 8.4 },
];

async function main() {
  await prisma.regulation.upsert({
    where: { slug: REG_M_A },
    create: {
      slug: REG_M_A,
      name: "Regulation M-A",
      maxVp: 510,
      allowTera: false,
      validFrom: new Date("2026-03-01"),
    },
    update: {},
  });

  for (const p of POKEMON) {
    await prisma.pokemon.upsert({
      where: { slug: p.slug },
      create: {
        dexNo: p.dexNo,
        slug: p.slug,
        name: p.name,
        nameI18n: JSON.stringify(p.i18n),
        type1: p.type1,
        type2: p.type2,
        hp: p.hp, atk: p.atk, def: p.def, spa: p.spa, spd: p.spd, spe: p.spe,
        abilities: JSON.stringify(p.abilities),
        hiddenAbility: p.hiddenAbility,
        spriteUrl: SPRITE(p.dexNo),
        usagePct: p.usagePct,
        rank: p.rank,
        regulations: JSON.stringify([REG_M_A]),
      },
      update: {
        nameI18n: JSON.stringify(p.i18n),
        usagePct: p.usagePct,
        rank: p.rank,
      },
    });
  }

  for (const a of ABILITIES) {
    const row = {
      slug: a.slug, name: a.name,
      nameI18n: JSON.stringify(a.i18n),
      shortDesc: a.shortDesc,
      shortDescI18n: JSON.stringify(a.shortDescI18n),
      longDesc: a.longDesc,
      usagePct: a.usagePct,
    };
    await prisma.ability.upsert({ where: { slug: a.slug }, create: row, update: row });
  }
  for (const i of ITEMS) {
    const row = {
      slug: i.slug, name: i.name,
      nameI18n: JSON.stringify(i.i18n),
      category: i.category,
      description: i.description,
      descI18n: JSON.stringify(i.descI18n),
      usagePct: i.usagePct,
    };
    await prisma.item.upsert({ where: { slug: i.slug }, create: row, update: row });
  }
  for (const m of MOVES) {
    const row = {
      slug: m.slug, name: m.name,
      nameI18n: JSON.stringify(m.i18n),
      type: m.type, category: m.category,
      power: m.power, accuracy: m.accuracy, pp: m.pp,
      priority: m.priority, targetShape: m.targetShape, makesContact: m.makesContact,
      effectText: m.effectText,
      effectI18n: JSON.stringify(m.effectI18n),
      usagePct: m.usagePct,
    };
    await prisma.move.upsert({ where: { slug: m.slug }, create: row, update: row });
  }

  console.log("Seeded:", {
    pokemon: POKEMON.length,
    abilities: ABILITIES.length,
    items: ITEMS.length,
    moves: MOVES.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
