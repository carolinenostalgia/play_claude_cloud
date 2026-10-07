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
# Characters the script writes at runtime (numerals, counters, scores).
EXTRA = "0123456789"
# (family name, Google Fonts query, weight, style)
FACES = [("Ma Shan Zheng", "Ma+Shan+Zheng", "400", "normal")]
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
for name, family, weight, style in FACES:
    for i in range(0, len(chars), CHUNK):
        text = urllib.parse.quote("".join(chars[i:i + CHUNK]))
        css = fetch(f"https://fonts.googleapis.com/css2?family={family}&display=block&text={text}").decode()
        url = re.search(r"url\((https://[^)]+)\)", css).group(1)
        ranges = re.search(r"unicode-range:\s*([^;]+);", css).group(1)
        data = base64.b64encode(fetch(url)).decode()
        rules.append(f"@font-face{{font-family:'{name}';font-style:{style};font-weight:{weight};font-display:block;"
                     f"src:url(data:font/woff2;base64,{data}) format('woff2');unicode-range:{ranges}}}")

block = ('<style id="fonts">\n/* Chinese brush face, subset to the characters this page uses '
         '(SIL Open Font License; see LICENSE-fonts.txt). Inlined so text never swaps from a fallback face. '
         'Regenerate with build-fonts.py. */\n' + "\n".join(rules) + "\n</style>")
PAGE.write_text(html[:start] + block + html[end:], encoding="utf-8")
print(f"{len(chars)} characters, {len(rules)} faces, page is now {PAGE.stat().st_size // 1024} KB")
