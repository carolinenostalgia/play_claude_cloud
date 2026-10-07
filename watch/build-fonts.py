"""Re-embed the page's fonts, subset to exactly the characters index.html uses.

Run this after changing any text in index.html:  python3 build-fonts.py
It rewrites the <style id="fonts"> block in place.
"""
import base64
import pathlib
import re
import urllib.parse
import urllib.request

PAGE = pathlib.Path(__file__).with_name("index.html")
# Characters produced at runtime by the lunar calendar library (干支, months, days, 纳音).
EXTRA = ("甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥正二三四五六七八九十冬腊闰初廿卅〇一月日年时点"
         "海中金炉火大林木路旁土剑锋山头涧下水城白蜡杨柳泉屋上霹雳松柏长流砂平地壁箔覆灯天河驿钗钏桑柘溪沙石榴"
         "0123456789–-·（）：，。、「」 ")
FACES = [("IBM Plex Mono", "IBM+Plex+Mono:wght@400", "400"),
         ("Noto Serif SC", "Noto+Serif+SC:wght@300", "200 600")]
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
CHUNK = 150  # Google ignores the text= subset when the URL gets too long


def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA})).read()


html = PAGE.read_text(encoding="utf-8")
start = html.index('<style id="fonts">')
end = html.index("</style>", start) + len("</style>")
body = html[:start] + html[end:]
chars = sorted({c for c in body + EXTRA if c.isprintable()})

rules = []
for name, family, weight in FACES:
    # Latin-only faces have no CJK glyphs; ask them only for the characters they can draw.
    own = [c for c in chars if ord(c) < 0x2000] if "Plex" in name else chars
    for i in range(0, len(own), CHUNK):
        text = urllib.parse.quote("".join(own[i:i + CHUNK]))
        css = fetch(f"https://fonts.googleapis.com/css2?family={family}&display=block&text={text}").decode()
        url = re.search(r"url\((https://[^)]+)\)", css).group(1)
        ranges = re.search(r"unicode-range:\s*([^;]+);", css).group(1)
        data = base64.b64encode(fetch(url)).decode()
        rules.append(f"@font-face{{font-family:'{name}';font-style:normal;font-weight:{weight};font-display:block;"
                     f"src:url(data:font/woff2;base64,{data}) format('woff2');unicode-range:{ranges}}}")

block = ('<style id="fonts">\n/* Brush and serif faces, subset to the characters this page uses '
         '(SIL Open Font License; see LICENSE-fonts.txt). Inlined so text never swaps from a fallback face. '
         'Regenerate with build-fonts.py. */\n' + "\n".join(rules) + "\n</style>")
PAGE.write_text(html[:start] + block + html[end:], encoding="utf-8")
print(f"{len(chars)} characters, {len(rules)} faces, page is now {PAGE.stat().st_size // 1024} KB")
