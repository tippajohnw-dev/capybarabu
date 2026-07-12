#!/bin/bash
# gen-zodiac.sh <index> — generate 1 นักษัตร artwork via gpt-image-1
# usage: OPENAI_API_KEY must be in env. Saves to zodiac-art/z<index>.png
set -euo pipefail
cd "/Users/wathanyootippajohn/Documents/Project Capybarabu/mae-mor-bara"
mkdir -p zodiac-art

IDX="$1"
ANIMALS=(
  "a majestic celestial golden RAT deity with jeweled fur, clever sparkling eyes, holding a gold coin"
  "a majestic celestial golden OX deity with ornate golden horns and ceremonial harness, powerful and serene"
  "a majestic celestial golden TIGER deity with glowing amber stripes and fierce noble gaze, mid-prowl on gold clouds"
  "a majestic celestial golden RABBIT deity with long elegant ears adorned with gold jewelry, graceful leaping pose"
  "a majestic celestial golden DRAGON deity with flowing serpentine body, glowing scales and flaming pearl, coiling through gold clouds"
  "a majestic celestial golden SERPENT deity with shimmering jeweled scales, elegantly coiled, wise glowing eyes"
  "a majestic celestial golden HORSE deity with flowing flame-like mane and tail, galloping through gold clouds"
  "a majestic celestial golden GOAT deity with spiraling ornate horns, serene and gentle, standing on gold clouds"
  "a majestic celestial golden MONKEY deity with ornate golden crown and staff, agile confident pose on gold clouds"
  "a majestic celestial golden ROOSTER deity with magnificent flaming tail feathers spread wide like a phoenix, proud stance"
  "a majestic celestial golden DOG deity with noble loyal gaze and ornate golden collar, guardian stance on gold clouds"
  "a majestic celestial golden BOAR deity with gilded tusks and prosperous round form, warm benevolent expression"
)

PROMPT="Luxurious Thai mystical lucky-charm phone wallpaper artwork, vertical portrait composition. ${ANIMALS[$IDX]}, dominating the upper two-thirds of the frame, surrounded by swirling golden clouds, Thai traditional ornamental line motifs (lai Thai), radiant light rays and sparkling gold particles. Deep crimson red and rich gold color palette, opulent sacred amulet aesthetic, dramatic golden rim lighting, painterly digital art, symmetrical temple-like composition. In the lower foreground sits a small cute capybara wearing a tiny purple gypsy fortune-teller headscarf with gold coin trim, rendered in the same painterly style, looking up in awe with sparkling eyes. Keep the bottom quarter of the image darker and less detailed as negative space. No text, no letters, no numbers, no watermark."

JSON=$(python3 - "$PROMPT" <<'EOF'
import json, sys
print(json.dumps({
  "model": "gpt-image-1",
  "prompt": sys.argv[1],
  "size": "1024x1536",
  "quality": "high",
  "n": 1,
}))
EOF
)

RESP=$(curl -sS --max-time 300 https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON")

echo "$RESP" | python3 -c "
import json, sys, base64
r = json.load(sys.stdin)
if 'data' not in r:
    print('ERROR:', json.dumps(r)[:500]); sys.exit(1)
with open('zodiac-art/z$IDX.png', 'wb') as f:
    f.write(base64.b64decode(r['data'][0]['b64_json']))
print('saved zodiac-art/z$IDX.png')
"
