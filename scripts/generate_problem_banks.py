#!/usr/bin/env python3
"""Generate Shinobi Keys typing problem banks. Choon ー → '-' in romaji."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "problems"

YOON = {
    "きゃ", "きゅ", "きょ", "しゃ", "しゅ", "しょ", "ちゃ", "ちゅ", "ちょ",
    "にゃ", "にゅ", "にょ", "ひゃ", "ひゅ", "ひょ", "みゃ", "みゅ", "みょ",
    "りゃ", "りゅ", "りょ", "ぎゃ", "ぎゅ", "ぎょ", "じゃ", "じゅ", "じょ",
    "びゃ", "びゅ", "びょ", "ぴゃ", "ぴゅ", "ぴょ",
    "てぃ", "でぃ", "うぃ", "うぇ", "うぉ", "ふぁ", "ふぃ", "ふぇ", "ふぉ",
}

BASIC = {
    "あ": ["a"], "い": ["i"], "う": ["u"], "え": ["e"], "お": ["o"],
    "か": ["ka"], "き": ["ki"], "く": ["ku"], "け": ["ke"], "こ": ["ko"],
    "さ": ["sa"], "し": ["shi", "si"], "す": ["su"], "せ": ["se"], "そ": ["so"],
    "た": ["ta"], "ち": ["chi", "ti"], "つ": ["tsu", "tu"], "て": ["te"], "と": ["to"],
    "な": ["na"], "に": ["ni"], "ぬ": ["nu"], "ね": ["ne"], "の": ["no"],
    "は": ["ha", "wa"], "ひ": ["hi"], "ふ": ["fu", "hu"], "へ": ["he"], "ほ": ["ho"],
    "ま": ["ma"], "み": ["mi"], "む": ["mu"], "め": ["me"], "も": ["mo"],
    "や": ["ya"], "ゆ": ["yu"], "よ": ["yo"],
    "ら": ["ra"], "り": ["ri"], "る": ["ru"], "れ": ["re"], "ろ": ["ro"],
    "わ": ["wa"], "を": ["wo"], "ん": ["n"],
    "ぁ": ["a"], "ぃ": ["i"], "ぅ": ["u"], "ぇ": ["e"], "ぉ": ["o"],
    "が": ["ga"], "ぎ": ["gi"], "ぐ": ["gu"], "げ": ["ge"], "ご": ["go"],
    "ざ": ["za"], "じ": ["ji", "zi"], "ず": ["zu"], "ぜ": ["ze"], "ぞ": ["zo"],
    "だ": ["da"], "ぢ": ["ji", "zi"], "づ": ["zu"], "で": ["de"], "ど": ["do"],
    "ば": ["ba"], "び": ["bi"], "ぶ": ["bu"], "べ": ["be"], "ぼ": ["bo"],
    "ぱ": ["pa"], "ぴ": ["pi"], "ぷ": ["pu"], "ぺ": ["pe"], "ぽ": ["po"],
}

YOON_ROMAJI = {
    "きゃ": ["kya"], "きゅ": ["kyu"], "きょ": ["kyo"],
    "しゃ": ["sha", "sya"], "しゅ": ["shu", "syu"], "しょ": ["sho", "syo"],
    "ちゃ": ["cha", "tya", "cya"], "ちゅ": ["chu", "tyu", "cyu"], "ちょ": ["cho", "tyo", "cyo"],
    "にゃ": ["nya"], "にゅ": ["nyu"], "にょ": ["nyo"],
    "ひゃ": ["hya"], "ひゅ": ["hyu"], "ひょ": ["hyo"],
    "みゃ": ["mya"], "みゅ": ["myu"], "みょ": ["myo"],
    "りゃ": ["rya"], "りゅ": ["ryu"], "りょ": ["ryo"],
    "ぎゃ": ["gya"], "ぎゅ": ["gyu"], "ぎょ": ["gyo"],
    "じゃ": ["ja", "jya", "zya"], "じゅ": ["ju", "jyu", "zyu"], "じょ": ["jo", "jyo", "zyo"],
    "びゃ": ["bya"], "びゅ": ["byu"], "びょ": ["byo"],
    "ぴゃ": ["pya"], "ぴゅ": ["pyu"], "ぴょ": ["pyo"],
    "てぃ": ["ti"], "でぃ": ["di"], "うぃ": ["wi"], "うぇ": ["we"], "うぉ": ["wo"],
    "ふぁ": ["fa"], "ふぃ": ["fi"], "ふぇ": ["fe", "fue"], "ふぉ": ["fo"],
}

VOWELS = {"あ", "い", "う", "え", "お"}
WA_READINGS = {"こんにちは", "こんばんは"}
KANA_RE = re.compile(r"^[\u3040-\u309F\u30A0-\u30FFー]+$")
HIRA_RE = re.compile(r"^[\u3040-\u309Fー]+$")
ENGLISH_RE = re.compile(r"^[a-zA-Z\s-]+$")


def to_hira(s: str) -> str:
    out = []
    for ch in s:
        if ch == "ー":
            out.append(ch)
        else:
            o = ord(ch)
            out.append(chr(o - 0x60) if 0x30A1 <= o <= 0x30F6 else ch)
    return "".join(out)


def to_kata(s: str) -> str:
    out = []
    for ch in s:
        if ch == "ー":
            out.append(ch)
        else:
            o = ord(ch)
            out.append(chr(o + 0x60) if 0x3041 <= o <= 0x3096 else ch)
    return "".join(out)


def parse_morae(reading: str) -> list[str]:
    morae: list[str] = []
    i = 0
    while i < len(reading):
        if reading[i] == "っ":
            morae.append("っ")
            i += 1
            continue
        y = reading[i : i + 2]
        if y in YOON:
            morae.append(y)
            i += 2
            continue
        morae.append(reading[i])
        i += 1
    return morae


def base_opts(kana: str) -> list[str]:
    if kana in ("っ", "ー"):
        return []
    if kana in YOON_ROMAJI:
        return list(YOON_ROMAJI[kana])
    if kana in BASIC:
        return list(BASIC[kana])
    raise KeyError(f"Unknown kana: {kana!r}")


def consonant_of(opt: str) -> str | None:
    return opt[0] if opt and opt[0] in "bcdfghjklmnpqrstvwxyz" else None


def mora_options(morae: list[str], reading: str) -> list[list[str]]:
    opts: list[list[str]] = []
    for i, kana in enumerate(morae):
        if kana == "っ":
            nxt = base_opts(morae[i + 1]) if i + 1 < len(morae) else []
            cons = {consonant_of(o) for o in nxt}
            opts.append([c for c in cons if c])
        elif kana == "ー":
            opts.append(["-"])
        elif kana == "ん":
            nxt = morae[i + 1] if i + 1 < len(morae) else None
            opts.append(["n", "nn"] if (not nxt or nxt in VOWELS) else ["n"])
        elif kana == "は" and reading in WA_READINGS:
            opts.append(["wa", "ha"])
        else:
            opts.append(base_opts(kana))
    return opts


def patterns_for(reading: str) -> list[str]:
    morae = parse_morae(reading)
    opts = mora_options(morae, reading)
    primary = "".join(o[0] for o in opts)
    s = {primary}
    for i, o in enumerate(opts):
        if len(o) < 2:
            continue
        s.add("".join(o[1] if j == i else oo[0] for j, oo in enumerate(opts)))
    s.add("".join(o[1] if len(o) > 1 else o[0] for o in opts))
    valid = sorted(p for p in s if can_complete(reading, p))
    if not valid:
        raise ValueError(f"No valid romaji patterns for {reading!r}")
    return valid


def can_complete(reading: str, pattern: str) -> bool:
    opts = mora_options(parse_morae(reading), reading)
    pos = 0
    for options in opts:
        rem = pattern[pos:]
        matched = next((o for o in options if rem.startswith(o)), None)
        if not matched:
            return False
        pos += len(matched)
    return pos == len(pattern)


def build(entries: list[tuple], difficulty: str, prefix: str) -> list[dict]:
    """entries: (display|None|'kata', reading, category, score)"""
    problems = []
    seen = set()
    for i, (disp, reading, cat, score) in enumerate(entries, start=1):
        reading = to_hira(reading)
        if disp is None:
            display = reading
        elif disp == "kata":
            display = to_kata(reading)
        else:
            display = disp
        if display in seen:
            raise SystemExit(f"Duplicate display in {difficulty}: {display}")
        seen.add(display)
        if not HIRA_RE.match(reading):
            raise SystemExit(f"Reading must be hiragana+ー only: {reading}")
        if ENGLISH_RE.match(display):
            raise SystemExit(f"English-only display: {display}")
        pats = patterns_for(reading)
        for p in pats:
            if not can_complete(reading, p):
                raise SystemExit(f"Not completable: {display} / {p} ({reading})")
        problems.append({
            "id": f"{prefix}-{i:03d}",
            "displayText": display,
            "reading": reading,
            "romajiPatterns": pats,
            "difficulty": difficulty,
            "category": cat,
            "baseScore": score,
        })
    return problems


def ts_str(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def write_ts(path: Path, export_name: str, problems: list[dict]) -> None:
    lines = []
    for p in problems:
        pats = ", ".join(f"'{ts_str(x)}'" for x in p["romajiPatterns"])
        lines.append(
            "  { "
            f"id: '{ts_str(p['id'])}', displayText: '{ts_str(p['displayText'])}', "
            f"reading: '{ts_str(p['reading'])}', "
            f"romajiPatterns: [{pats}], difficulty: '{p['difficulty']}', "
            f"category: '{p['category']}', baseScore: {p['baseScore']} "
            "},"
        )
    path.write_text(
        "import type { TypingProblem } from '../../types/typing'\n\n"
        f"export const {export_name}: TypingProblem[] = [\n"
        + "\n".join(lines)
        + "\n]\n",
        encoding="utf-8",
    )


def T(reading: str, cat: str, score: int, display=None):
    return (display, reading, cat, score)


# ═══════════════════════════════════════════════════════════════════════════
# TRAINEE (≥200)
# ═══════════════════════════════════════════════════════════════════════════
TRAINEE = [
    T("ねこ", "basic", 80), T("いぬ", "basic", 70), T("そら", "nature", 80),
    T("やま", "nature", 80), T("うみ", "nature", 70), T("すし", "food", 90),
    T("にんじゃ", "basic", 100), T("あき", "nature", 70), T("はる", "nature", 80),
    T("みず", "nature", 80), T("かぜ", "nature", 80), T("つき", "nature", 90),
    T("はな", "nature", 80), T("とり", "basic", 80), T("うめ", "food", 70),
    T("おちゃ", "food", 80), T("ほし", "nature", 80), T("うし", "basic", 70),
    T("うま", "basic", 70), T("ぶた", "basic", 70), T("さる", "basic", 70),
    T("きつね", "basic", 90), T("かめ", "basic", 70), T("へび", "basic", 70),
    T("かに", "basic", 70), T("えび", "food", 70), T("いか", "food", 70),
    T("たこ", "food", 70), T("さかな", "food", 90), T("にく", "food", 70),
    T("ごはん", "food", 90), T("みそ", "food", 70), T("しお", "food", 70),
    T("さとう", "food", 90), T("あめ", "nature", 70), T("ゆき", "nature", 70),
    T("くも", "nature", 70), T("かみなり", "nature", 100), T("たいよう", "nature", 100),
    T("もり", "nature", 70), T("かわ", "nature", 70), T("いけ", "nature", 70),
    T("たき", "nature", 70), T("いし", "nature", 70), T("すな", "nature", 70),
    T("つち", "nature", 70), T("き", "nature", 60), T("は", "nature", 60),
    T("ね", "basic", 60), T("め", "basic", 60), T("て", "basic", 60),
    T("あし", "basic", 70), T("かお", "basic", 70), T("くち", "basic", 70),
    T("みみ", "basic", 70), T("かみ", "basic", 70), T("いえ", "basic", 70),
    T("へや", "basic", 70), T("まど", "basic", 70), T("つくえ", "basic", 90),
    T("いす", "basic", 70), T("ほん", "basic", 70), T("えんぴつ", "basic", 100),
    T("はさみ", "basic", 90), T("とけい", "basic", 90), T("かさ", "basic", 70),
    T("くつ", "basic", 70), T("ふく", "basic", 70), T("ぼうし", "basic", 90),
    T("めがね", "basic", 90), T("かばん", "basic", 90), T("みち", "basic", 70),
    T("はし", "basic", 70), T("くるま", "basic", 90), T("でんしゃ", "basic", 100),
    T("ひこうき", "basic", 100), T("ふね", "basic", 70), T("じてんしゃ", "basic", 100),
    T("あか", "basic", 70), T("あお", "basic", 70), T("きいろ", "basic", 90),
    T("みどり", "nature", 90), T("しろ", "basic", 70), T("くろ", "basic", 70),
    T("むらさき", "basic", 100), T("もも", "food", 70), T("りんご", "food", 90),
    T("みかん", "food", 90), T("ばなな", "food", 90, "kata"), T("いちご", "food", 90),
    T("ぶどう", "food", 90), T("すいか", "food", 90), T("めろん", "food", 90, "kata"),
    T("なし", "food", 70), T("かき", "food", 70), T("くり", "food", 70),
    T("まめ", "food", 70), T("とうふ", "food", 90), T("なっとう", "food", 100),
    T("たまご", "food", 90), T("ぎゅうにゅう", "food", 100), T("ぱん", "food", 70),
    T("けーき", "food", 90, "kata"), T("こーひー", "food", 100, "kata"),
    T("こうちゃ", "food", 90), T("じゅーす", "food", 90, "kata"),
    T("みずうみ", "nature", 100), T("しま", "nature", 70), T("はま", "nature", 70),
    T("なみ", "nature", 70), T("うしお", "nature", 90), T("きり", "nature", 70),
    T("にじ", "nature", 70), T("ひかり", "nature", 90), T("かげ", "nature", 70),
    T("やみ", "nature", 70), T("あさ", "nature", 70), T("ひる", "nature", 70),
    T("よる", "nature", 70), T("よあけ", "nature", 90), T("ゆうがた", "nature", 100),
    T("なつ", "nature", 70), T("ふゆ", "nature", 70), T("きせつ", "nature", 90),
    T("くさ", "nature", 70), T("たけ", "nature", 70), T("まつ", "nature", 70),
    T("さくら", "nature", 90), T("うめのき", "nature", 100), T("もみじ", "nature", 90),
    T("きく", "nature", 70), T("ばら", "nature", 70), T("ひまわり", "nature", 100),
    T("ちゅーりっぷ", "nature", 100, "kata"), T("ちょう", "nature", 80),
    T("とんぼ", "nature", 90), T("あり", "nature", 70), T("はち", "nature", 70),
    T("か", "nature", 60), T("せみ", "nature", 70, "kata"), T("かえる", "nature", 90, "kata"),
    T("うさぎ", "basic", 90), T("ねずみ", "basic", 90), T("ひつじ", "basic", 90),
    T("しか", "basic", 70), T("くま", "basic", 70), T("らいおん", "basic", 100, "kata"),
    T("ぞう", "basic", 70), T("きりん", "basic", 90), T("ぱんだ", "basic", 90, "kata"),
    T("いと", "basic", 70), T("はり", "basic", 70), T("ぬの", "basic", 70),
    T("かべ", "basic", 70), T("ゆか", "basic", 70), T("やね", "basic", 70),
    T("にわ", "nature", 70), T("はたけ", "nature", 90), T("たんぼ", "nature", 90),
    T("むぎ", "food", 70), T("こめ", "food", 70), T("やさい", "food", 90),
    T("くだもの", "food", 100), T("にんじん", "food", 100), T("じゃがいも", "food", 100),
    T("たまねぎ", "food", 100), T("きゅうり", "food", 100), T("とまと", "food", 90, "kata"),
    T("きゃべつ", "food", 100, "kata"), T("れたす", "food", 90, "kata"),
    T("こーん", "food", 80, "kata"), T("ちーず", "food", 90, "kata"),
    T("ばたー", "food", 90, "kata"), T("よーぐると", "food", 100, "kata"),
    T("あいす", "food", 90), T("しょくぱん", "food", 100), T("うどん", "food", 90),
    T("そば", "food", 70), T("かれー", "food", 90, "kata"), T("すーぷ", "food", 80, "kata"),
    T("さらだ", "food", 90, "kata"), T("ぴざ", "food", 70, "kata"),
    T("はんばーがー", "food", 100, "kata"), T("おこめ", "food", 90), T("のり", "food", 70),
    T("わさび", "food", 90), T("しょうゆ", "food", 100), T("てんぷら", "food", 100),
    T("おにぎり", "food", 100), T("べんとう", "food", 100), T("おやつ", "food", 90),
    T("あめだま", "food", 100), T("くっきー", "food", 100, "kata"),
    T("げーむ", "basic", 80, "kata"), T("てれび", "basic", 90, "kata"),
    T("らじお", "basic", 90, "kata"), T("かめら", "basic", 90, "kata"),
    T("でんわ", "basic", 90), T("ぱそこん", "basic", 100), T("まうす", "basic", 90, "kata"),
    T("きー", "basic", 60, "kata"), T("めもり", "basic", 90, "kata"),
    T("しのび", "basic", 90), T("かたな", "basic", 90), T("まきびし", "basic", 100),
    T("くさり", "basic", 90), T("いずみ", "nature", 90), T("おんせん", "nature", 100),
    T("たに", "nature", 70), T("おか", "nature", 70), T("みね", "nature", 70),
    T("いわ", "nature", 70), T("どうくつ", "nature", 100), T("さばく", "nature", 90),
    T("こおり", "nature", 90), T("ひょう", "nature", 80), T("つゆ", "nature", 70),
    T("しずく", "nature", 90), T("もや", "nature", 70), T("あらし", "nature", 90),
    T("たいふう", "nature", 100), T("じしん", "nature", 90), T("かざん", "nature", 90),
    T("うみべ", "nature", 90), T("みなと", "nature", 90), T("そらもよう", "nature", 100),
    T("ひつじぐも", "nature", 100), T("あさがお", "nature", 100), T("つきみ", "nature", 90),
    T("はなび", "nature", 90), T("まつば", "nature", 90), T("わかば", "nature", 90),
    T("しんりん", "nature", 100), T("やまみち", "nature", 100), T("かわべ", "nature", 90),
    T("あおぞら", "nature", 100), T("ゆうひ", "nature", 90), T("あさひ", "nature", 90),
    T("ほしぞら", "nature", 100), T("つきかげ", "nature", 100), T("おと", "basic", 60),
    T("こえ", "basic", 70), T("おとな", "basic", 90), T("こども", "basic", 90),
    T("ともだち", "basic", 100), T("かぞく", "basic", 90), T("ちち", "basic", 70),
    T("はは", "basic", 70), T("あに", "basic", 70), T("あね", "basic", 70),
    T("おとうと", "basic", 100), T("いもうと", "basic", 100), T("せんせい", "basic", 100),
    T("がくせい", "basic", 100), T("すーぱー", "food", 90, "kata"),
    T("ばす", "basic", 70, "kata"), T("たくしー", "basic", 100, "kata"),
    T("どあ", "basic", 70, "kata"), T("のーと", "basic", 80, "kata"),
    T("ぺん", "basic", 70, "kata"), T("けしごむ", "basic", 100),
]

# ═══════════════════════════════════════════════════════════════════════════
# NINJA (≥200)
# ═══════════════════════════════════════════════════════════════════════════
NINJA = [
    T("さむらい", "basic", 140), T("しゅりけん", "basic", 160), T("はやて", "nature", 130),
    T("たぬき", "basic", 130), T("らーめん", "food", 120), T("おてら", "basic", 130),
    T("ありがとう", "phrase", 150), T("こんにちは", "phrase", 170), T("おりがみ", "basic", 140),
    T("がっこう", "phrase", 150), T("こんばんは", "phrase", 160), T("おはよう", "phrase", 140),
    T("さようなら", "phrase", 160), T("すみません", "phrase", 170), T("いただきます", "phrase", 180),
    T("ごちそうさま", "phrase", 180), T("がんばって", "phrase", 160), T("よろしく", "phrase", 150),
    T("おねがい", "phrase", 140), T("おめでとう", "phrase", 170), T("かしこい", "basic", 140),
    T("つよい", "basic", 130), T("はやい", "basic", 130), T("おおきい", "basic", 140),
    T("ちいさい", "basic", 140), T("あたらしい", "basic", 160), T("ふるい", "basic", 120),
    T("うつくしい", "basic", 160), T("たのしい", "basic", 140), T("かなしい", "basic", 140),
    T("おもしろい", "basic", 160), T("むずかしい", "basic", 170), T("やさしい", "basic", 140),
    T("しあわせ", "phrase", 150), T("ゆうき", "basic", 130), T("きぼう", "basic", 130),
    T("ゆめ", "basic", 110), T("まぼろし", "basic", 150), T("にんげん", "basic", 140),
    T("こころ", "basic", 130), T("ちから", "basic", 130), T("ひみつ", "basic", 130),
    T("かくれみの", "basic", 160), T("かげぶんしん", "basic", 170), T("すいとん", "basic", 140),
    T("どとん", "basic", 120), T("きとん", "basic", 120), T("ふうとん", "basic", 140),
    T("しゅりけんじゅつ", "basic", 180), T("とうけん", "basic", 130), T("よろい", "basic", 120),
    T("かぶと", "basic", 120), T("はやみち", "basic", 140), T("やみみち", "basic", 140),
    T("つきよ", "nature", 120), T("あめふり", "nature", 140), T("ゆきどけ", "nature", 140),
    T("かぜのね", "nature", 140), T("なみおと", "nature", 140), T("たきつぼ", "nature", 140),
    T("いわばし", "nature", 140), T("もみじば", "nature", 140), T("わかたけ", "nature", 130),
    T("しんりょく", "nature", 150), T("こうよう", "nature", 130), T("うめぼし", "food", 140),
    T("おでん", "food", 120), T("すきやき", "food", 140), T("しゃぶしゃぶ", "food", 170),
    T("とんかつ", "food", 140), T("やきとり", "food", 140),
    T("おこのみやき", "food", 170, "お好み焼き"), T("ぎょうざ", "food", 130),
    T("しゅうまい", "food", 150), T("ちらしずし", "food", 160), T("てまきずし", "food", 160),
    T("いなりずし", "food", 160), T("みそしる", "food", 140), T("つきみそば", "food", 160),
    T("かけうどん", "food", 160), T("ざるそば", "food", 140), T("てんぷらそば", "food", 180),
    T("すぱげってぃ", "food", 180, "kata"), T("あいすくりーむ", "food", 180, "kata"),
    T("ちょこれーと", "food", 170, "kata"), T("きゃんでぃ", "food", 150, "kata"),
    T("ぽてとちっぷす", "food", 180, "kata"), T("まっちゃ", "food", 130),
    T("ほうじちゃ", "food", 150), T("むぎちゃ", "food", 130), T("げんまいちゃ", "food", 160),
    T("かふぇおれ", "food", 150, "kata"), T("かふぇらて", "food", 150, "kata"),
    T("えすぷれっそ", "food", 170, "kata"), T("まっちゃらて", "food", 170, "kata"),
    T("せかい", "basic", 120), T("にほん", "basic", 120), T("とうきょう", "basic", 150),
    T("おおさか", "basic", 140), T("きょうと", "basic", 130), T("なごや", "basic", 130),
    T("ふじさん", "nature", 140), T("びわこ", "nature", 120), T("せとうち", "nature", 140),
    T("おきなわ", "basic", 140), T("ほっかいどう", "basic", 170), T("きゅうしゅう", "basic", 170),
    T("しこく", "basic", 120), T("かんさい", "basic", 140), T("かんとう", "basic", 140),
    T("しんかんせん", "phrase", 180), T("でんしゃみち", "basic", 160), T("こうさてん", "basic", 150),
    T("としょかん", "basic", 150), T("びじゅつかん", "basic", 160), T("はくぶつかん", "basic", 170),
    T("どうぶつえん", "basic", 160), T("すいぞくかん", "basic", 170), T("ゆうえんち", "basic", 150),
    T("こうえん", "basic", 130), T("じんじゃ", "basic", 130), T("ぶっかく", "basic", 140),
    T("しょうぐん", "basic", 150), T("だいみょう", "basic", 150), T("ぶしどう", "basic", 140),
    T("にんじゃやしろ", "basic", 180), T("かげのむら", "basic", 150), T("しのびのさと", "basic", 170),
    T("つきのかげ", "nature", 150), T("かぜのうた", "nature", 150), T("あめのひ", "nature", 130),
    T("ゆきのひ", "nature", 130), T("はるのかぜ", "nature", 150), T("あきのもみじ", "nature", 170),
    T("なつのよる", "nature", 150), T("ふゆのあさ", "nature", 150), T("やまのいずみ", "nature", 170),
    T("うみのなみ", "nature", 150), T("もりのこかげ", "nature", 170), T("かわのせせらぎ", "nature", 180),
    T("いんたーねっと", "it", 180, "kata"), T("うぇぶさいと", "it", 170, "kata"),
    T("ぶらうざー", "it", 160, "kata"), T("さーばー", "it", 140, "kata"),
    T("くらいあんと", "it", 170, "kata"), T("ねっとわーく", "it", 170, "kata"),
    T("ぱすわーど", "it", 160, "kata"), T("ろぐいん", "it", 140, "kata"),
    T("ろぐあうと", "it", 160, "kata"), T("あっぷろーど", "it", 170, "kata"),
    T("だうんろーど", "it", 170, "kata"), T("ふぁいる", "it", 130, "kata"),
    T("ふぉるだー", "it", 150, "kata"), T("めーる", "it", 120, "kata"),
    T("めっせーじ", "it", 160, "kata"), T("ちゃっと", "it", 130, "kata"),
    T("すまーとふぉん", "it", 180, "kata"), T("たぶれっと", "it", 160, "kata"),
    T("でじたるかめら", "it", 180, "kata"), T("ぷりんたー", "it", 160, "kata"),
    T("すきゃなー", "it", 150, "kata"), T("きーぼーど", "it", 150, "kata"),
    T("もにたー", "it", 140, "kata"), T("すぴーかー", "it", 150, "kata"),
    T("へっどふぉん", "it", 170, "kata"), T("まいくろふぉん", "it", 180, "kata"),
    T("ばてりー", "it", 140, "kata"), T("ちゃーじゃー", "it", 160, "kata"),
    T("けーぶる", "it", 140, "kata"), T("あだぷたー", "it", 150, "kata"),
    T("ぷろぐらみんぐ", "it", 180, "プログラミング"), T("こーでぃんぐ", "it", 160, "コーディング"),
    T("でばっぐ", "it", 140, "デバッグ"), T("てすと", "it", 120, "テスト"),
    T("りりーす", "it", 140, "リリース"), T("あっぷでーと", "it", 170, "アップデート"),
    T("いんすとーる", "it", 170, "インストール"), T("ばっくあっぷ", "it", 170, "バックアップ"),
    T("りすとあ", "it", 140, "リストア"), T("せきゅりてぃ", "it", 170, "セキュリティ"),
    T("ういるす", "it", 140, "ウイルス"), T("ふぁいあうぉーる", "it", 180, "ファイアウォール"),
    T("あるごりずむ", "it", 170, "アルゴリズム"), T("でーたべーす", "it", 170, "データベース"),
    T("くらうど", "it", 140, "クラウド"), T("すとれーじ", "it", 150, "ストレージ"),
    T("ぷろせっさ", "it", 160, "プロセッサ"), T("ぐらふぃっく", "it", 170, "グラフィック"),
    T("あにめーしょん", "it", 180, "アニメーション"), T("おつかれさま", "phrase", 170),
    T("いってきます", "phrase", 170), T("いってらっしゃい", "phrase", 180),
    T("ただいま", "phrase", 140), T("おかえり", "phrase", 140), T("はじめまして", "phrase", 170),
    T("しつれいします", "phrase", 180), T("おまたせ", "phrase", 140), T("だいじょうぶ", "phrase", 170),
    T("もちろん", "phrase", 140), T("きっとうまくいく", "phrase", 180),
    T("あきらめるな", "phrase", 160), T("まえをむけ", "phrase", 140),
    T("ちからをあわせて", "phrase", 180), T("ゆめをかなえる", "phrase", 170),
    T("まいにちれんしゅう", "phrase", 180), T("きょうもしのぶ", "phrase", 160),
    T("かげをふむな", "phrase", 150), T("しずかにすすめ", "phrase", 170),
    T("いっきにいこう", "phrase", 160), T("さいごまで", "phrase", 140),
    T("しゅぎょう", "basic", 140), T("にんぽう", "basic", 130), T("とうぞく", "basic", 130),
    T("けんじゃ", "basic", 130), T("まほうつかい", "basic", 160), T("ぼうけんしゃ", "basic", 160),
    T("ゆうしゃ", "basic", 130), T("まもの", "basic", 120), T("りゅう", "basic", 120),
    T("おにごっこ", "basic", 150), T("かくれんぼ", "basic", 150), T("なわとび", "basic", 140),
    T("こままわり", "basic", 150), T("けんだま", "basic", 130), T("だるまさんがころんだ", "phrase", 180),
    T("あやとり", "basic", 130), T("おりがみざいく", "basic", 170), T("てまり", "basic", 120),
    T("ふうりん", "nature", 130), T("うちわ", "basic", 120), T("せんす", "basic", 120),
    T("じんべえ", "basic", 130), T("ゆかた", "basic", 120), T("はっぴ", "basic", 120),
    T("まつりのよる", "phrase", 160), T("はなびたいかい", "phrase", 170),
    T("おしょうがつ", "phrase", 160), T("おぼん", "phrase", 120), T("たなばた", "phrase", 140),
    T("しちごさん", "phrase", 150), T("せいじんしき", "phrase", 160),
    T("そつぎょうしき", "phrase", 170), T("にゅうがくしき", "phrase", 170),
    T("うんどうかい", "phrase", 160), T("ぶんかすいさい", "phrase", 170),
    T("がっこうきゅうしょく", "phrase", 180), T("ほうかご", "phrase", 140),
    T("じゅくがえり", "phrase", 150), T("つうがくろ", "phrase", 140),
]

# ═══════════════════════════════════════════════════════════════════════════
# MASTER (≥200)
# ═══════════════════════════════════════════════════════════════════════════
MASTER = [
    T("ぷろぐらむ", "it", 220, "プログラム"),
    T("じゃばすくりぷと", "it", 260, "ジャバスクリプト"),
    T("たいぷすくりぷと", "it", 260, "タイプスクリプト"),
    T("あるごりずむ", "it", 200, "アルゴリズム"),
    T("あぷりけーしょん", "it", 240, "アプリケーション"),
    T("さいばーせきゅりてぃ", "it", 260, "サイバーセキュリティ"),
    T("おもてなし", "phrase", 200),
    T("しんかんせん", "phrase", 210),
    T("なつかしい", "phrase", 210),
    T("こもれび", "nature", 180),
    T("しんりんよく", "nature", 220),
    T("ふれーむわーく", "it", 220, "フレームワーク"),
    T("でーたべーす", "it", 220, "データベース"),
    T("いんたーふぇーす", "it", 240, "インターフェース"),
    T("ぱふぉーまんす", "it", 230, "パフォーマンス"),
    T("せきにん", "phrase", 200),
    T("きょうりょく", "phrase", 210),
    T("おぺれーてぃんぐしすてむ", "it", 280, "オペレーティングシステム"),
    T("まいくろさーびす", "it", 250, "マイクロサービス"),
    T("こんてなおーけすとれーしょん", "it", 300, "コンテナオーケストレーション"),
    T("ばーちゃるましん", "it", 240, "バーチャルマシン"),
    T("ろーどばらんさー", "it", 240, "ロードバランサー"),
    T("りばーすぷろきし", "it", 250, "リバースプロキシ"),
    T("こんてんつでりばりー", "it", 270, "コンテンツデリバリー"),
    T("おぶじぇくとすとれーじ", "it", 280, "オブジェクトストレージ"),
    T("りれーしょなるでーたべーす", "it", 300, "リレーショナルデータベース"),
    T("のーえすきゅーえる", "it", 260, "ノーエスキューエル"),
    T("ぐらふぃかるゆーざーいんたーふぇーす", "it", 300, "グラフィカルユーザーインターフェース"),
    T("こまんどらいんいんたーふぇーす", "it", 300, "コマンドラインインターフェース"),
    T("あぷりけーしょんぷろぐらみんぐいんたーふぇーす", "it", 300, "アプリケーションプログラミングインターフェース"),
    T("そふとうぇあえんじにありんぐ", "it", 290, "ソフトウェアエンジニアリング"),
    T("しすてむあーきてくちゃ", "it", 270, "システムアーキテクチャ"),
    T("どめいんくどうせっけい", "it", 250, "ドメイン駆動設計"),
    T("てすとくどうかいはつ", "it", 240, "テスト駆動開発"),
    T("けいぞくてきいんてぐれーしょん", "it", 290, "継続的インテグレーション"),
    T("けいぞくてきでりばりー", "it", 270, "継続的デリバリー"),
    T("いんふらすとらくちゃあずこーど", "it", 300, "インフラストラクチャアズコード"),
    T("さーばーれすあーきてくちゃ", "it", 290, "サーバーレスアーキテクチャ"),
    T("いべんとくどうあーきてくちゃ", "it", 290, "イベント駆動アーキテクチャ"),
    T("まいくろふろんとえんど", "it", 270, "マイクロフロントエンド"),
    T("れすぽんしぶでざいん", "it", 250, "レスポンシブデザイン"),
    T("あくせしびりてぃ", "it", 240, "アクセシビリティ"),
    T("ゆーざびりてぃてすと", "it", 260, "ユーザビリティテスト"),
    T("ぷろぐれっしぶうぇぶあぷり", "it", 290, "プログレッシブウェブアプリ"),
    T("しんぐるぺーじあぷりけーしょん", "it", 300, "シングルページアプリケーション"),
    T("さーばーさいどれんだりんぐ", "it", 290, "サーバーサイドレンダリング"),
    T("くらいあんとさいどれんだりんぐ", "it", 300, "クライアントサイドレンダリング"),
    T("すてーとめねじめんと", "it", 260, "ステートマネジメント"),
    T("りあくてぃぶぷろぐらみんぐ", "it", 290, "リアクティブプログラミング"),
    T("かんすうがたぷろぐらみんぐ", "it", 270, "関数型プログラミング"),
    T("おぶじぇくとしこうぷろぐらみんぐ", "it", 300, "オブジェクト指向プログラミング"),
    T("でざいんぱたーん", "it", 230, "デザインパターン"),
    T("りふぁくたりんぐ", "it", 230, "リファクタリング"),
    T("こーどれびゅー", "it", 210, "コードレビュー"),
    T("ぺあぷろぐらみんぐ", "it", 250, "ペアプログラミング"),
    T("てくにかるどきゅめんと", "it", 270, "テクニカルドキュメント"),
    T("おーぷんそーすすおふとうぇあ", "it", 280, "オープンソースソフトウェア"),
    T("ばーじょんかんりしすてむ", "it", 260, "バージョン管理システム"),
    T("そーすこーどかんり", "it", 230, "ソースコード管理"),
    T("ぎっとりぽじとり", "it", 240, "ギットリポジトリ"),
    T("ぷるりくえすと", "it", 220, "プルリクエスト"),
    T("こーどこんふりくと", "it", 230, "コードコンフリクト"),
    T("じどうかてすと", "it", 220, "自動化テスト"),
    T("たんたいてすと", "it", 210, "単体テスト"),
    T("とうごうてすと", "it", 210, "統合テスト"),
    T("えんどつーえんどてすと", "it", 260, "エンドツーエンドテスト"),
    T("せきゅあこーでぃんぐ", "it", 250, "セキュアコーディング"),
    T("せいのうかいぜん", "it", 230, "性能改善"),
    T("おきゃくさまたいおう", "phrase", 250),
    T("ぷろじぇくとかんり", "it", 240, "プロジェクト管理"),
    T("あじゃいるかいはつ", "it", 230, "アジャイル開発"),
    T("すくらむみーてぃんぐ", "it", 230, "スクラムミーティング"),
    T("すぷりんときかく", "it", 230, "スプリント企画"),
    T("れとろすぺくてぃぶ", "it", 250, "レトロスペクティブ"),
    T("すたんどあっぷみーてぃんぐ", "it", 280, "スタンドアップミーティング"),
    T("いんしでんとたいおう", "it", 250, "インシデント対応"),
    T("ろーるばっくせいこう", "it", 250, "ロールバック成功"),
    T("いしゃのふようせい", "phrase", 220, "医者の不養生"),
    T("はなよりだんご", "phrase", 200, "花より団子"),
    T("さるもきからおちる", "phrase", 220, "猿も木から落ちる"),
    T("ななころびやおき", "phrase", 210, "七転び八起き"),
    T("いしのうえにもさんねん", "phrase", 240, "石の上にも三年"),
    T("じゅうにんといろ", "phrase", 210, "十人十色"),
    T("しちてんばっとう", "phrase", 210, "七転八倒"),
    T("せいてんはくじつ", "phrase", 210, "青天白日"),
    T("いちごいちえ", "phrase", 200, "一期一会"),
    T("ゆきのふるさと", "nature", 210, "雪のふるさと"),
    T("あきのよなが", "nature", 200, "秋の夜長"),
    T("ふゆのしんしゅ", "nature", 200, "冬の新酒"),
    T("はるのはなざかり", "nature", 230, "春の花盛り"),
    T("なつのうみべ", "nature", 200, "夏の海辺"),
    T("もみじのかおり", "nature", 210, "紅葉の香り"),
    T("しらゆきのやま", "nature", 210, "白雪の山"),
    T("あさつゆのきらめき", "nature", 240, "朝露のきらめき"),
    T("ゆうやけこやけ", "phrase", 210, "夕焼け小焼け"),
    T("わびさびのこころ", "phrase", 220, "わびさびの心"),
    T("おもてなしのこころ", "phrase", 230, "おもてなしの心"),
    T("なつかしのふるさと", "phrase", 240, "懐かしのふるさと"),
    T("ありがとうございます", "phrase", 240),
    T("よろしくおねがいします", "phrase", 260),
    T("おせわになりました", "phrase", 230),
    T("おつかれさまでした", "phrase", 230),
    T("おかえりなさい", "phrase", 210),
    T("おだいじに", "phrase", 190),
    T("まいにちがしゅぎょう", "phrase", 240),
    T("しゅぎょうはつづく", "phrase", 230),
    T("ゆめはかなう", "phrase", 190),
    T("あきらめないで", "phrase", 200),
    T("じぶんをしんじる", "phrase", 220),
    T("ともにたたかう", "phrase", 200),
    T("かぜにのる", "phrase", 190),
    T("つきのひかり", "nature", 200, "月の光"),
    T("ほしのきらめき", "nature", 210, "星のきらめき"),
    T("うみのそこまで", "nature", 210, "海の底まで"),
    T("やまのてっぺん", "nature", 210, "山のてっぺん"),
    T("もりのおくまで", "nature", 210, "森の奥まで"),
    T("かわのせせらぎ", "nature", 210, "川のせせらぎ"),
    T("たきのおと", "nature", 190, "滝の音"),
    T("しずかなあさ", "nature", 200, "静かな朝"),
    T("あかいゆうひ", "nature", 200, "赤い夕日"),
    T("しろいゆき", "nature", 190, "白い雪"),
    T("あおいそら", "nature", 190, "青い空"),
    T("みどりのは", "nature", 190, "緑の葉"),
    T("こがねいろのあき", "nature", 220, "黄金色の秋"),
    T("しんしゅうのあじ", "nature", 210, "新酒の味"),
    T("おもいでづくり", "phrase", 210),
    T("ふるさとのそら", "nature", 210, "ふるさとの空"),
    T("たいせつなひと", "phrase", 210, "大切な人"),
    T("でぃーぷらーにんぐ", "it", 250, "ディープラーニング"),
    T("ましんらーにんぐ", "it", 260, "マシンラーニング"),
    T("こんぴゅーたびじょん", "it", 280, "コンピュータビジョン"),
    T("なちゅらるらんげーじぷろせっしんぐ", "it", 300, "ナチュラルランゲージプロセッシング"),
    T("えーじぇんとでーたべーす", "it", 280, "エージェントデータベース"),
    T("いんめもりでーたべーす", "it", 280, "インメモリデータベース"),
    T("くえりおぷてぃまいざー", "it", 260, "クエリオプティマイザー"),
    T("ばーじょんこんとろーる", "it", 270, "バージョンコントロール"),
    T("きゅばねてす", "it", 230, "kata"),
    T("どっかーこんてな", "it", 250, "Dockerコンテナ"),
    T("おーとすけーりんぐ", "it", 260, "オートスケーリング"),
    T("さーびすめっしゅ", "it", 250, "サービスメッシュ"),
    T("めっせーじきゅー", "it", 240, "メッセージキュー"),
    T("いべんとすとりーむ", "it", 260, "イベントストリーム"),
    T("りあくてぃぶすとりーむ", "it", 280, "リアクティブストリーム"),
    T("ふろんとえんどふれーむわーく", "it", 290, "フロントエンドフレームワーク"),
    T("ばっくえんどふれーむわーく", "it", 280, "バックエンドフレームワーク"),
    T("ふるすたっくでべろっぱー", "it", 290, "フルスタックデベロッパー"),
    T("じゃばすくりぷとえんじん", "it", 280, "JavaScriptエンジン"),
    T("たいぷすくりぷとえんじん", "it", 280, "TypeScriptエンジン"),
    T("ぶらうざえんじん", "it", 240, "ブラウザエンジン"),
    T("れんだりんぐえんじん", "it", 260, "レンダリングエンジン"),
    T("さーちえんじん", "it", 230, "サーチエンジン"),
    T("いんでっくすえんじん", "it", 260, "インデックスエンジン"),
    T("れこめんでーしょんえんじん", "it", 290, "レコメンデーションエンジン"),
    T("あなりてぃくす", "it", 220, "アナリティクス"),
    T("びっぐでーた", "it", 210, "ビッグデータ"),
    T("でーたさいえんす", "it", 240, "データサイエンス"),
    T("くらうどこんぴゅーティング", "it", 280, "クラウドコンピューティング"),
    T("えっじこんぴゅーティング", "it", 270, "エッジコンピューティング"),
    T("いんたーねっとおぶしんぐす", "it", 290, "インターネットオブシングス"),
    T("ぶろっくちぇーん", "it", 240, "ブロックチェーン"),
    T("くりぷとぐらふぃ", "it", 250, "クリプトグラフィ"),
    T("ぺねとれーしょんてすと", "it", 280, "ペネトレーションテスト"),
    T("ぶるーとふぉーす", "it", 230, "ブルートフォース"),
    T("でぃすとりびゅーてっど", "it", 270, "ディストリビューテッド"),
    T("れぷりけーしょん", "it", 240, "レプリケーション"),
    T("しゃーでぃんぐ", "it", 210, "シャーディング"),
    T("こんしすてんしー", "it", 240, "コンシステンシー"),
    T("あとみっくとらんざくしょん", "it", 290, "アトミックトランザクション"),
    T("あいそれーしょん", "it", 230, "アイソレーション"),
    T("ぱーしすてんす", "it", 230, "パーシステンス"),
    T("きゃっしゅめもり", "it", 230, "キャッシュメモリ"),
    T("れでぃす", "it", 190, "kata"),
    T("えらすてっく", "it", 220, "kata"),
    T("ぐらふぁな", "it", 200, "kata"),
    T("ぷろめてうす", "it", 220, "kata"),
    T("おーぷんてれめとりー", "it", 260, "kata"),
    T("れふぁれんすあーきてくちゃ", "it", 290, "リファレンスアーキテクチャ"),
    T("ぽりしーえんじん", "it", 240, "ポリシーエンジン"),
    T("わーくふろーえんじん", "it", 260, "ワークフローエンジン"),
    T("びじねすいんてりじぇんす", "it", 290, "ビジネスインテリジェンス"),
    T("びじゅありぜーしょん", "it", 270, "ビジュアライゼーション"),
    T("ゆーざーえくすぺりえんす", "it", 290, "ユーザーエクスペリエンス"),
    T("いんたーなしょならいぜーしょん", "it", 300, "インターナショナライゼーション"),
    T("ろーからいぜーしょん", "it", 260, "ローカライゼーション"),
    T("ぐろーばるでぷろい", "it", 250, "グローバルデプロイ"),
    T("ぶるーぐりーんでぷろい", "it", 280, "ブルーグリーンデプロイ"),
    T("かなりありりーす", "it", 240, "カナリアリリース"),
    T("ふぃーちゃーふらぐ", "it", 250, "フィーチャーフラグ"),
    T("えーびーてすと", "it", 210, "A/Bテスト"),
    T("こーどじぇねれーしょん", "it", 270, "コードジェネレーション"),
    T("あーきてくちゃれびゅー", "it", 270, "アーキテクチャレビュー"),
    T("ぽすともーてむ", "it", 220, "ポストモーテム"),
    T("いんしでんとまねじめんと", "it", 290, "インシデントマネジメント"),
    T("おんこーる", "it", 190, "オンコール"),
    T("えすかれーしょん", "it", 240, "エスカレーション"),
    T("もにたりんぐ", "it", 220, "モニタリング"),
    T("あらーと", "it", 190, "アラート"),
    T("ろぐかんり", "it", 200, "ログ管理"),
    T("めとりくすしゅうしゅう", "it", 270, "メトリクス収集"),
    T("でぃすとりびゅーてっどとれーシング", "it", 300, "ディストリビューティッドトレーシング"),
    T("さーびすれべる", "it", 230, "サービスレベル"),
    T("りらいありびりてぃえんじにありんぐ", "it", 300, "リライアビリティエンジニアリング"),
    T("ぱふぉーまんすちゅーニング", "it", 280, "パフォーマンスチューニング"),
    T("ろーどてすと", "it", 210, "ロードテスト"),
    T("すとれすてすと", "it", 230, "ストレステスト"),
    T("けいおすえんじにありんぐ", "it", 280, "カオスエンジニアリング"),
    T("ふぉーるととれらんす", "it", 260, "フォールトトレランス"),
    T("りじりえんす", "it", 210, "レジリエンス"),
    T("ぐれーすふるしゃっとだうん", "it", 290, "グレースフルシャットダウン"),
    T("ろーるばっくすとらてじー", "it", 280, "ロールバックストラテジー"),
    T("れふぁれんすいんぷりめんてーしょん", "it", 300, "リファレンスインプリメンテーション"),
    T("こんぴゅーたーさいえんす", "it", 280, "コンピュータサイエンス"),
    T("でべろっぷめんとおぺれーしょん", "it", 290, "デベロップメントオペレーション"),
    T("でぶおぷすえんじにありんぐ", "it", 270, "デブオプスエンジニアリング"),
    T("ぎっとはぶりぽじとり", "it", 250, "ギットハブリポジトリ"),
    T("ぎっとらぶりぽじとり", "it", 260, "ギットラブリポジトリ"),
    T("びっとばけっとりぽじとり", "it", 280, "ビットバケットリポジトリ"),
    T("あまぞんうぇぶさーびす", "it", 270, "アマゾンウェブサービス"),
    T("あじゅーらくらうど", "it", 240, "アジュールクラウド"),
    T("ぐーぐるくらうどぷらっとふぉーむ", "it", 300, "グーグルクラウドプラットフォーム"),
    T("ばーせるでぷろい", "it", 230, "バーセルデプロイ"),
    T("ねっとりふぁいでぷろい", "it", 260, "ネットリファイデプロイ"),
    T("りあくとこんぽーねんと", "it", 260, "リアクトコンポーネント"),
    T("びゅーじぇいえす", "it", 220, "ビュージェイエス"),
    T("あんぎゅらーふれーむわーく", "it", 280, "アンギュラーフレームワーク"),
    T("ねくすとじぇいえす", "it", 240, "ネクストジェイエス"),
    T("ぬくすとじぇいえす", "it", 240, "ナクストジェイエス"),
    T("すべるときっと", "it", 230, "スベルトキット"),
    T("れみっくすふれーむわーく", "it", 270, "リミックスフレームワーク"),
    T("あすとろじぇいえす", "it", 240, "アストロジェイエス"),
    T("でのらんたいむ", "it", 220, "デノランタイム"),
    T("ばんらんたいむ", "it", 210, "バンランタイム"),
    T("のーどじぇいえす", "it", 230, "ノードジェイエス"),
    T("らすとげんご", "it", 210, "ラスト言語"),
    T("ごーげんご", "it", 200, "ゴー言語"),
    T("ぱいそんげんご", "it", 230, "パイソン言語"),
    T("るびーげんご", "it", 220, "ルビー言語"),
    T("ぽすとぐれすきゅーえる", "it", 270, "ポストグレスキューエル"),
    T("まいえすきゅーえるでーたべーす", "it", 290, "マイエスキューエルデータベース"),
    T("もんごでぃーびーでーたべーす", "it", 280, "モンゴディービーデータベース"),
    T("れでぃすきゃっしゅ", "it", 230, "レディスキャッシュ"),
    T("にどあることはさんどある", "phrase", 260, "二度あることは三度ある"),
    T("さんにんよればもんじゅのちえ", "phrase", 280, "三人寄れば文殊の知恵"),
    T("いっぽいっぽすすむ", "phrase", 220, "一歩一歩進む"),
    T("みちはとおくても", "phrase", 220, "道は遠くても"),
    T("ゆめをみつづける", "phrase", 230, "夢を見続ける"),
    T("こころのこえをきく", "phrase", 230, "心の声を聞く"),
    T("ともにせかいをあるく", "phrase", 250, "共に世界を歩く"),
    T("しずかなしのびあし", "phrase", 240, "静かな忍び足"),
    T("かぜのようにはやくはしれ", "phrase", 260, "風のように速く走れ"),
    T("つきのようにしずかに", "phrase", 250, "月のように静かに"),
    T("ほしのようにひかりつづける", "phrase", 280, "星のように光り続ける"),
    T("やまのようにつよくあれ", "phrase", 250, "山のように強くあれ"),
    T("うみのようにひろくみつめる", "phrase", 280, "海のように広く見つめる"),
    T("もりのようにしずまる", "phrase", 240, "森のように静まる"),
    T("かわのようにながれつづける", "phrase", 280, "川のように流れ続ける"),
    T("はるのよるはゆめをみる", "nature", 250, "春の夜は夢を見る"),
    T("あきのよるはつきをみる", "nature", 250, "秋の夜は月を見る"),
    T("ふゆのよるはほしをかぞえる", "nature", 280, "冬の夜は星を数える"),
    T("なつのよるはかぜをかんじる", "nature", 280, "夏の夜は風を感じる"),
]

def write_index(path: Path) -> None:
    path.write_text(
        "import type { TypingProblem } from '../../types/typing'\n"
        "import { traineeProblems } from './trainee'\n"
        "import { ninjaProblems } from './ninja'\n"
        "import { masterProblems } from './master'\n\n"
        "export const typingProblems: readonly TypingProblem[] = [\n"
        "  ...traineeProblems,\n"
        "  ...ninjaProblems,\n"
        "  ...masterProblems,\n"
        "]\n\n"
        "export { traineeProblems, ninjaProblems, masterProblems }\n",
        encoding="utf-8",
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    banks = [
        ("trainee", TRAINEE, "tr", "traineeProblems", "trainee.ts"),
        ("ninja", NINJA, "nj", "ninjaProblems", "ninja.ts"),
        ("master", MASTER, "ms", "masterProblems", "master.ts"),
    ]
    totals: dict[str, list[dict]] = {}
    for name, entries, prefix, export_name, filename in banks:
        problems = build(entries, name, prefix)
        if len(problems) < 200:
            raise SystemExit(f"{name} has only {len(problems)} problems (need ≥200)")
        totals[name] = problems
        write_ts(OUT / filename, export_name, problems)
        print(f"  {name}: {len(problems)}")
    write_index(OUT / "index.ts")
    total = sum(len(p) for p in totals.values())
    print(f"total: {total}")
    ramen = next(p for p in totals["ninja"] if p["reading"] == "らーめん")
    print(f"らーめん patterns: {ramen['romajiPatterns']}")


if __name__ == "__main__":
    main()
