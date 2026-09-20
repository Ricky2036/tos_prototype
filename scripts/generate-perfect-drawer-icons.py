import os
from PIL import Image, ImageDraw

OUT_DIR = 'public/icons/drawer'
os.makedirs(OUT_DIR, exist_ok=True)

im_all = Image.open('/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/.user_uploaded/media_1789870904758.jpg')
im_cat = Image.open('/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/.user_uploaded/media_1789870909316.jpg')
im_f = Image.open('/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/.user_uploaded/media_1789870900111.jpg')

def apply_squircle_mask(img, radius=16):
    w, h = img.size
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (w - 1, h - 1)], radius=radius, fill=255)
    rgba = img.convert('RGBA')
    rgba.putalpha(mask)
    return rgba

# ── 1. 严格像素校准提取 media_1789870904758.jpg Row 1 至 Row 6 ──
col_centers = [78.0, 182.0, 285.0, 389.0]
row_centers = [193.0, 339.0, 463.0, 587.0, 711.0, 835.0]

grid_mapping = [
    # Row 1 (常用置顶)
    ['wechat', 'transsioner', 'contacts', 'weibo'],
    # Row 2 (A)
    ['ahagames', 'ahaprime', 'antigravity', 'appcenter'],
    # Row 3 (A/B/C)
    ['security', 'bubblepop', 'bilibili', 'carlcare'],
    # Row 4 (C/D)
    ['chatgpt', 'chrome', 'crushblock', 'deepseek'],
    # Row 5 (D)
    ['dongka', 'dingdong', 'ditu', 'dianping'],
    # Row 6 (D/D/D/phone)
    ['douyin', 'douyin_mall', 'douyin_lite', 'phone'],
]

for r_idx, row in enumerate(grid_mapping):
    cy = row_centers[r_idx]
    for c_idx, app_id in enumerate(row):
        cx = col_centers[c_idx]
        if app_id == 'appcenter':
            box = (int(cx - 35), int(cy - 35), int(cx + 36), int(cy + 35))
        elif app_id == 'transsioner':
            box = (int(cx - 35), int(cy - 35), int(cx + 38), int(cy + 35))
        else:
            box = (int(cx - 35), int(cy - 35), int(cx + 35), int(cy + 35))
        c = im_all.crop(box)
        c = c.resize((72, 72), Image.Resampling.LANCZOS)
        icon = apply_squircle_mask(c, radius=16)
        icon.save(os.path.join(OUT_DIR, f'{app_id}.png'))

print('Row 1-6 icons extracted from media_1789870904758.jpg!')

# ── 2. 从 media_1789870900111.jpg 提取 F 组高清图标 ──
f_col_centers = [78.0, 182.0, 285.0, 389.0]
f_row_centers = [325.0, 455.0]
f_mapping = [
    ['fm', 'flclash', 'feedback', 'facebook'],
    ['tomato', 'cgb', 'folax', None]
]
for r_idx, row in enumerate(f_mapping):
    cy = f_row_centers[r_idx]
    for c_idx, app_id in enumerate(row):
        if not app_id: continue
        cx = f_col_centers[c_idx]
        box = (int(cx - 35), int(cy - 35), int(cx + 35), int(cy + 35))
        c = im_f.crop(box)
        c = c.resize((72, 72), Image.Resampling.LANCZOS)
        icon = apply_squircle_mask(c, radius=16)
        icon.save(os.path.join(OUT_DIR, f'{app_id}.png'))

print('F group icons extracted from media_1789870900111.jpg!')

# ── 3. 从 media_1789870909316.jpg 提取分类卡专用图标 ──
cat_items = [
    ('abc', 133, 200),
    ('shortplay', 133, 283),
    ('google_one', 216, 283),
    ('dingtalk', 396, 425),
    ('notes', 133, 658),
    ('clock', 216, 658),
    ('settings', 133, 742),
    ('ximalaya', 314, 742),
]

for app_id, cx, cy in cat_items:
    box = (int(cx - 35), int(cy - 35), int(cx + 35), int(cy + 35))
    c = im_cat.crop(box)
    c = c.resize((72, 72), Image.Resampling.LANCZOS)
    icon = apply_squircle_mask(c, radius=16)
    icon.save(os.path.join(OUT_DIR, f'{app_id}.png'))

print('Category specific icons extracted!')

# ── 4. 为全量其他图标补齐平滑 Squircle 遮罩，清除黑底 ──
def mask_squircle(im, radius_ratio=0.22):
    w, h = im.size
    radius = int(min(w, h) * radius_ratio)
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (w - 1, h - 1)], radius=radius, fill=255)
    if im.mode == 'RGBA':
        r, g, b, a = im.split()
        mask = Image.composite(a, Image.new('L', (w, h), 0), mask)
        im.putalpha(mask)
        return im
    else:
        rgba = im.convert('RGBA')
        rgba.putalpha(mask)
        return rgba

for f in os.listdir(OUT_DIR):
    if not f.endswith('.png'): continue
    p = os.path.join(OUT_DIR, f)
    im = Image.open(p)
    masked = mask_squircle(im)
    masked.save(p)

print('Full icon directory squircle normalized successfully!')
