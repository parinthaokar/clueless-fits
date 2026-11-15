"""Model v6 (feminine): layered blowout with curtain layers and balayage; grey double-breasted suit; tortoiseshell glasses."""
import math
from pathlib import Path
from playwright.sync_api import sync_playwright
import models_v4 as M4

INK = "#1d1a16"
ST = f'stroke="{INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"'
THIN = f'stroke="{INK}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"'

SKIN_TONES = ["#f3d4bf", "#e2b08c", "#c98e6b", "#9a6646", "#5e3b28"]
# hair root colour, strand highlight, balayage end colour
HAIR_FOR = {"#f3d4bf": ("#6b4430", "#9a6a4c", "#c0915f"),
            "#e2b08c": ("#4a2c1d", "#7a5038", "#a87a4e"),
            "#c98e6b": ("#33231a", "#5e4434", "#8f6644"),
            "#9a6646": ("#211611", "#4a352a", "#6e4c34"),
            "#5e3b28": ("#141010", "#3a302c", "#4f3a2c")}

GREY, GREY_D, GREY_L, BTN = "#9a9da2", "#7a7d82", "#b4b7bb", "#2b2b2e"
_n = [0]


def glasses(uid):
    """Tortoiseshell frames: soft rectangles with lifted outer corners, mint/greige/brown mottling."""
    pat = (f'<pattern id="tort{uid}" patternUnits="userSpaceOnUse" width="7" height="6">'
           f'<rect width="7" height="6" fill="#bdb79c"/>'
           f'<ellipse cx="1.5" cy="1.5" rx="1.6" ry="1.1" fill="#4e3b2c"/><ellipse cx="5" cy="4" rx="1.4" ry="1" fill="#4e3b2c"/>'
           f'<ellipse cx="4.6" cy="1.2" rx="1.1" ry=".8" fill="#86ab9c"/><ellipse cx="1.6" cy="4.6" rx="1.2" ry=".8" fill="#86ab9c"/>'
           f'<ellipse cx="6.4" cy="2.6" rx=".7" ry=".6" fill="#7a5a40"/></pattern>')
    def eye(mirror):
        outer = "M83.8 43.2 Q92 43.4 99.6 45.1 L99.3 51.4 Q98.9 55.6 94.4 55.6 H89 Q85.6 55.4 85.2 51.6 Z"
        inner = "M85.7 45.2 Q92 45.1 98.2 46.4 L98 51.2 Q97.7 54.1 94.2 54.1 H89.3 Q87 54 86.7 51.3 Z"
        t = ' transform="translate(200 0) scale(-1 1)"' if mirror else ""
        return (f'<g{t}><path d="{outer} {inner}" fill="url(#tort{uid})" fill-rule="evenodd"/>'
                f'<path d="{inner}" fill="#ffffff" fill-opacity=".14"/>'
                f'<path d="{outer}" fill="none" stroke="{INK}" stroke-width="1" stroke-linejoin="round"/>'
                f'<path d="{inner}" fill="none" stroke="{INK}" stroke-width=".7" stroke-opacity=".7"/>'
                f'<path d="M88.5 52 L91.5 47.5" stroke="#ffffff" stroke-opacity=".55" stroke-width=".9" stroke-linecap="round"/></g>')
    bridge = (f'<path d="M99.4 47.4 Q100 45.8 100.6 47.4" fill="none" stroke="url(#tort{uid})" stroke-width="2"/>'
              f'<path d="M99.2 46.4 Q100 45 100.8 46.4" fill="none" stroke="{INK}" stroke-width=".7"/>')
    return f'<defs>{pat}</defs>{eye(False)}{eye(True)}{bridge}'


def hair_parts(hair, hi, ends, uid):
    grad = (f'<defs><linearGradient id="bal{uid}" gradientUnits="userSpaceOnUse" x1="0" y1="18" x2="0" y2="108">'
            f'<stop offset="0" stop-color="{hair}"/><stop offset=".34" stop-color="{hair}"/>'
            f'<stop offset=".78" stop-color="{ends}"/><stop offset="1" stop-color="{ends}"/></linearGradient></defs>')
    fill = f'url(#bal{uid})'
    # back mass: full crown, collarbone length, ends flip outward
    back = (f'<path d="M74.5 44 Q73 17.5 95 17.5 Q127 17.5 125.5 44 C129 62 133 76 137 88 Q141 97 146 100 Q140 110 130 104 '
            f'L100 99 L70 104 Q60 110 54 100 Q59 97 63 88 C67 76 71 62 74 46 Z" fill="{fill}" {ST}/>')
    # front curtain layers (side part at x=95): sweep off the forehead, fall along the cheek, open away from the face and flip out
    left = ('M95 18.5 Q76 17.5 74 42 C72 58 68.5 73 64.5 85 Q61 94 55.5 98.5 Q53.5 107.5 62.5 107 Q69.5 106 72.5 99 '
            'Q75.5 106.5 80.5 106.5 Q85.5 105 84.5 98 Q79.5 90 79.5 81 Q80 69 84.5 61 Q83 52 84 44 Q87 31 98 26.5 Z')
    right = ('M95 18.5 Q124 17.5 126 42 C128 58 131.5 73 135.5 85 Q139 94 144.5 98.5 Q146.5 107.5 137.5 107 Q130.5 106 127.5 99 '
             'Q124.5 106.5 119.5 106.5 Q114.5 105 115.5 98 Q120.5 90 120.5 81 Q120 69 115.5 61 Q117 50 116 44 Q112 30 98 26.5 Z')
    strands = "".join(
        f'<path d="{d}" stroke="{c}" stroke-width="1.15" fill="none" stroke-linecap="round" stroke-opacity="{o}"/>'
        for d, c, o in [
            ("M91 21 Q79 24 77.5 42 C76 58 73 72 69.5 84 Q66 94 60 102", hi, ".9"),
            ("M89 26 Q83.5 34 81.5 46 Q80 58 76.5 72 Q74.5 86 77.5 98 Q79 102 81.5 103", hi, ".75"),
            ("M100 21 Q121 24 122.5 42 C124 58 127 72 130.5 84 Q134 94 140 102", hi, ".9"),
            ("M104 26 Q115 32 118.5 46 Q120 58 123.5 72 Q125.5 86 122.5 98 Q121 102 118.5 103", hi, ".75"),
            ("M86 30 Q80 40 78 56", ends, ".5"), ("M113 29 Q120 40 122 56", ends, ".5"),
        ])
    # face-framing swoops at cheekbone level, curling away from the face
    swoops = (f'<path d="M84 61 Q78 70 78 80" stroke="{INK}" stroke-width="1" fill="none" stroke-opacity=".4"/>'
              f'<path d="M116 61 Q122 70 122 80" stroke="{INK}" stroke-width="1" fill="none" stroke-opacity=".4"/>')
    part = f'<path d="M95 18.5 Q96 22.5 98 26.5" stroke="{hi}" stroke-width="1.2" fill="none"/>'
    front = (f'<path d="{left}" fill="{fill}" {ST}/><path d="{right}" fill="{fill}" {ST}/>' + strands + swoops + part)
    return grad, back, front


def fem(width=200, skin="#c98e6b", with_glasses=True):
    _n[0] += 1
    uid = _n[0]
    hair, hi, ends = HAIR_FOR.get(skin, HAIR_FOR["#c98e6b"])
    head, neck, feats = M4.face(skin, True)
    grad, back_hair, front_hair = hair_parts(hair, hi, ends, uid)

    pumps = (f'<path d="M77 300 H95 L92.5 309 Q88 315 84 309 Z" fill="#141212" {ST}/>'
             f'<path d="M105 300 H123 L116 309 Q112 315 107.5 309 Z" fill="#141212" {ST}/>')
    # wide-leg trousers, full length, pressed front creases
    trousers = (f'<path d="M78 158 Q100 162 122 158 L130 304 H102 L100 182 L98 304 H70 Z" fill="{GREY}" {ST}/>'
                f'<path d="M88.5 178 L85 302 M111.5 178 L115 302" stroke="{GREY_D}" stroke-width="1.3"/>'
                f'<path d="M89.5 178 L86.5 302 M110.5 178 L113.5 302" stroke="{GREY_L}" stroke-width=".8"/>')
    # fitted double-breasted blazer: structured shoulders, nipped waist, hip-length
    body = (f'<path d="M70 84 Q84 88 94 84.5 L106 84.5 Q116 88 130 84 L128.5 101 Q121 118 119.5 133 Q123.5 152 124.5 175 '
            f'Q112 178 100 178 Q88 178 75.5 175 Q76.5 152 80.5 133 Q79 118 71.5 101 Z" fill="{GREY}" {ST}/>'
            # princess seams that shape the waist
            f'<path d="M84 104 Q82.5 120 86 134 Q87.5 152 86.5 176 M116 104 Q117.5 120 114 134 Q112.5 152 113.5 176" stroke="{GREY_D}" stroke-width="1" fill="none"/>'
            # front edge of the overlap
            f'<path d="M100 121 Q101.5 150 102.5 178" stroke="{INK}" stroke-width="1.2" fill="none"/>'
            # flap pockets and breast welt
            f'<path d="M78.5 156 L91 157 L90.6 162 L78.4 161.2 Z M121.5 156 L109 157 L109.4 162 L121.6 161.2 Z" fill="{GREY}" {THIN}/>'
            f'<path d="M109.5 111 L119 108.5" stroke="{INK}" stroke-width="1.4" stroke-linecap="round"/>')
    sleeves = (f'<path d="M70 84 Q59.5 88 59 106 L58 184 L67.5 184 L69.5 128 Q70.5 110 71.5 101 Z" fill="{GREY}" {ST}/>'
               f'<path d="M130 84 Q140.5 88 141 106 L142 184 L132.5 184 L130.5 128 Q129.5 110 128.5 101 Z" fill="{GREY}" {ST}/>'
               f'<path d="M64 120 Q63.5 140 63 160 M136 120 Q136.5 140 137 160" stroke="{GREY_D}" stroke-width=".9" fill="none"/>'
               f'<path d="M58.4 178 H67.4 M132.6 178 H141.6" stroke="{GREY_D}" stroke-width="1"/>'
               f'<circle cx="60.6" cy="181" r=".8" fill="{BTN}"/><circle cx="139.4" cy="181" r=".8" fill="{BTN}"/>')
    hands = (f'<ellipse cx="62.6" cy="191" rx="4.8" ry="7.2" fill="{skin}" {ST}/>'
             f'<ellipse cx="137.4" cy="191" rx="4.8" ry="7.2" fill="{skin}" {ST}/>')
    # deep V (no shirt), fine gold chain, then peak lapels and six buttons
    v_neck = (f'<path d="M93.5 83.5 L106.5 83.5 L100 121.5 Z" fill="{skin}"/>'
              f'<path d="M95.6 86 Q100 98 104.4 86" stroke="#c9a35c" stroke-width=".7" fill="none"/><circle cx="100" cy="97.6" r="1" fill="#c9a35c"/>')
    lapels = (f'<path d="M93.5 83 L100 121.5 L86 104 L79.5 93 L77.5 88 L84.5 91.8 L89 85.6 Z" fill="{GREY}" {ST}/>'
              f'<path d="M106.5 83 L100 121.5 L114 104 L120.5 93 L122.5 88 L115.5 91.8 L111 85.6 Z" fill="{GREY}" {ST}/>'
              f'<path d="M91.5 89 L98 116 M108.5 89 L102 116" stroke="{GREY_L}" stroke-width=".9"/>')
    buttons = "".join(f'<circle cx="{x}" cy="{y}" r="1.7" fill="{BTN}"/><circle cx="{x - .5}" cy="{y - .5}" r=".5" fill="#ffffff" fill-opacity=".5"/>'
                      for x, y in [(91.5, 127), (108.5, 127), (93, 139), (107, 139), (93, 151), (107, 151)])
    specs = glasses(uid) if with_glasses else ""
    inner = (f'{grad}{back_hair}{pumps}{trousers}{body}{sleeves}{hands}'
             f'{head}{neck}{v_neck}{lapels}{buttons}{feats}{specs}{front_hair}')
    return M4.frame(width, inner)


# ------------------------------------------------------------ thumbnails (GarmentArt, 120 x 120)
def thumb_glasses():
    return (f'<svg viewBox="0 0 120 120" width="150" height="150"><g transform="translate(-200 -66) scale(2.6)">{glasses("T")}'
            f'<path d="M84.4 45 L79.5 43.5" stroke="url(#tortT)" stroke-width="2.2" stroke-linecap="round"/>'
            f'<path d="M115.6 45 L120.5 43.5" stroke="url(#tortT)" stroke-width="2.2" stroke-linecap="round"/></g></svg>')


def thumb_blazer():
    return (f'<svg viewBox="0 0 120 120" width="150" height="150"><g transform="translate(-60 -60) scale(.9) translate(6 2)">'
            f'<path d="M70 84 Q84 88 94 84.5 L106 84.5 Q116 88 130 84 L128.5 101 Q121 118 119.5 133 Q123.5 152 124.5 175 Q112 178 100 178 Q88 178 75.5 175 Q76.5 152 80.5 133 Q79 118 71.5 101 Z" fill="{GREY}" {ST}/>'
            f'<path d="M70 84 Q59.5 88 59 106 L58 170 L67.5 170 L69.5 128 Q70.5 110 71.5 101 Z" fill="{GREY}" {ST}/>'
            f'<path d="M130 84 Q140.5 88 141 106 L142 170 L132.5 170 L130.5 128 Q129.5 110 128.5 101 Z" fill="{GREY}" {ST}/>'
            f'<path d="M93.5 83.5 L106.5 83.5 L100 121.5 Z" fill="#fbf7ee" {ST}/>'
            f'<path d="M93.5 83 L100 121.5 L86 104 L79.5 93 L77.5 88 L84.5 91.8 L89 85.6 Z" fill="{GREY}" {ST}/>'
            f'<path d="M106.5 83 L100 121.5 L114 104 L120.5 93 L122.5 88 L115.5 91.8 L111 85.6 Z" fill="{GREY}" {ST}/>'
            f'<path d="M100 121 Q101.5 150 102.5 178" stroke="{INK}" stroke-width="1.2" fill="none"/>'
            f'<path d="M78.5 156 L91 157 L90.6 162 L78.4 161.2 Z M121.5 156 L109 157 L109.4 162 L121.6 161.2 Z" fill="{GREY}" {THIN}/>'
            + "".join(f'<circle cx="{x}" cy="{y}" r="1.9" fill="{BTN}"/>' for x, y in [(91.5, 127), (108.5, 127), (93, 139), (107, 139), (93, 151), (107, 151)])
            + '</g></svg>')


def thumb_trousers():
    return (f'<svg viewBox="0 0 120 120" width="150" height="150"><g transform="translate(-8 -2) scale(.85) translate(-30 -150)">'
            f'<path d="M78 156 H122 L130 280 H102 L100 178 L98 280 H70 Z" fill="{GREY}" {ST}/>'
            f'<path d="M78 156 H122 V166 H78 Z" fill="{GREY}" {ST}/>'
            f'<path d="M88.5 172 L85 278 M111.5 172 L115 278" stroke="{GREY_D}" stroke-width="1.4"/></g></svg>')


if __name__ == "__main__":
    out = Path(__file__).parent
    card = "background:#fffaf0;border:1.5px solid #f4eee2;border-radius:16px;padding:6px 4px 0"
    tones = "".join(f'<div style="{card}">{fem(214, t)}</div>' for t in SKIN_TONES)
    thumbs = "".join(f'<div style="background:#fbf7ee;border:2px solid #1d1a16;border-radius:14px;padding:6px;text-align:center;font:700 13px Inter,Arial">{s}<div>{n}</div></div>'
                     for s, n in [(thumb_blazer(), "Grey DB Blazer"), (thumb_trousers(), "Grey Wide-Leg Trousers"), (thumb_glasses(), "Tortoise Glasses")])
    html = (f"<html><body style='margin:0;background:#fff;font-family:Inter,Arial'>"
            f"<div style='display:flex;gap:8px;padding:8px'>{tones}</div>"
            f"<div style='display:flex;gap:14px;padding:8px 14px 14px;align-items:flex-start'>"
            f"<div style='{card}'>{fem(330, '#c98e6b')}</div>"
            f"<div style='{card}'>{fem(330, '#c98e6b', with_glasses=False)}<div style='text-align:center;font:600 12px Arial;padding-bottom:6px'>without glasses</div></div>"
            f"<div style='display:flex;flex-direction:column;gap:10px'>{thumbs}</div></div></body></html>")
    (out / "fem6.html").write_text(html)
    zoom = f"<html><body style='margin:0;background:#fffaf0'><div style='width:620px;height:520px;overflow:hidden'><div style='margin-top:-30px;margin-left:-160px'>{fem(940, '#9a6646')}</div></div></body></html>"
    (out / "fem6_zoom.html").write_text(zoom)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1120, "height": 920})
        pg.goto((out / "fem6.html").as_uri()); pg.screenshot(path=str(out / "fem6.png"), full_page=True)
        pg.set_viewport_size({"width": 620, "height": 520}); pg.goto((out / "fem6_zoom.html").as_uri()); pg.screenshot(path=str(out / "fem6_zoom.png"))
        b.close()
    print("ok")
