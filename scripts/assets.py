import sys
from PIL import Image, ImageOps

src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")

# 1) optimized grayscale hero (landscape), progressive
hero = ImageOps.grayscale(im)
hero = ImageOps.autocontrast(hero, cutoff=1)
hero.convert("RGB").save(f"{outdir}/hero.jpg", "JPEG", quality=84, optimize=True, progressive=True)

# 2) portrait crop around the subject (podium shot, subject center-right)
W, H = im.size  # 1280 x 854
box = (int(W*0.42), int(H*0.14), int(W*0.70), int(H*0.95))  # x0,y0,x1,y1
port = im.crop(box)
pg = ImageOps.autocontrast(ImageOps.grayscale(port), cutoff=1)
pg.convert("RGB").save(f"{outdir}/portrait.jpg", "JPEG", quality=86, optimize=True, progressive=True)

# 3) ASCII text-art from the portrait crop
cols = 70
ramp = " .:-=+*#%@"
cw, ch = pg.size
rows = max(1, int(cols * (ch / cw) * 0.52))
small = pg.resize((cols, rows))
px = small.load()
lines = []
for y in range(rows):
    row = []
    for x in range(cols):
        v = px[x, y]
        row.append(ramp[min(len(ramp) - 1, v * len(ramp) // 256)])
    lines.append("".join(row).rstrip())
art = "\n".join(lines)
with open(f"{outdir}/portrait.txt", "w", encoding="utf-8") as f:
    f.write(art + "\n")
print(art)
print("\n--- dims hero", hero.size, "portrait", pg.size, "ascii", cols, "x", rows)
