from PIL import Image

img_path = '/Users/nishantthakor/.gemini/antigravity-ide/brain/7b105115-55ce-4cf2-a391-c8f7a6841994/media__1782378811261.png'
img = Image.open(img_path)
width, height = img.size
print(f"Original size: {width}x{height}")

# Assuming it's a 2x2 grid:
# Top-Left: OW 20A
# Top-Right: OW 20B
# Bottom-Left: OW 21A
# Bottom-Right: OW 21B

w2 = width // 2
h2 = height // 2

ow20a = img.crop((0, 0, w2, h2))
ow20b = img.crop((w2, 0, width, h2))
ow21a = img.crop((0, h2, w2, height))
ow21b = img.crop((w2, h2, width, height))

out_dir = '/Users/nishantthakor/Downloads/nirmandeleted/public/wardrobe_modules'
import os
os.makedirs(out_dir, exist_ok=True)

ow20a.save(f"{out_dir}/OW_20A.png")
ow20b.save(f"{out_dir}/OW_20B.png")
ow21a.save(f"{out_dir}/OW_21A.png")
ow21b.save(f"{out_dir}/OW_21B.png")

print("Images saved.")
