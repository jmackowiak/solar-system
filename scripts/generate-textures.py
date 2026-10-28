#!/usr/bin/env python3
"""Rebuild original Orbita maps and optimized NASA Blue Marble derivatives.

Build-time only: python3 -m pip install pillow numpy
python3 scripts/generate-textures.py
NASA originals download to the system temporary directory, never at runtime.
"""
from pathlib import Path
import tempfile
import urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'textures'
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1024, 512
rng = np.random.default_rng(20261028)
y, x = np.mgrid[0:H, 0:W]
u, v = x / W, y / H

def noise(octaves=(8, 16, 32, 64, 128)):
    result = np.zeros((H, W), dtype=float)
    for n in octaves:
        layer = Image.fromarray(rng.integers(0, 256, (max(2,n//2), n), dtype=np.uint8))
        # Mirror a border horizontally to hide longitude seam.
        arr = np.asarray(layer.resize((W, H), Image.Resampling.BICUBIC), dtype=float) / 255
        result += (arr-.5) / (n/8)**.55
    return result

def save(name, values):
    image = Image.fromarray(np.uint8(np.clip(values, 0, 255)))
    image.save(OUT / f'{name}.webp', quality=84, method=6)
    image.resize((256,128), Image.Resampling.LANCZOS).save(OUT / f'{name}-low.webp', quality=72, method=6)
    return image

def colors(base, variation):
    return np.array(base)[None,None,:] + variation[:,:,None]

rough = noise()
mercury = Image.fromarray(np.uint8(np.clip(colors((143,135,123), rough*65),0,255)))
draw = ImageDraw.Draw(mercury, 'RGBA')
for _ in range(380):
    cx, cy = int(rng.integers(W)), int(rng.integers(H))
    radius = float(rng.uniform(1,19))
    yy = radius * .7
    draw.ellipse((cx-radius,cy-yy,cx+radius,cy+yy), fill=(58,55,50,50), outline=(201,190,171,95),width=1)
    draw.arc((cx-radius,cy-yy,cx+radius,cy+yy), 10,170,fill=(37,35,34,120),width=2)
save('mercury',np.asarray(mercury.filter(ImageFilter.GaussianBlur(.35))))

swirl = noise((4,8,16,32,64))
save('venus', colors((211,172,112), swirl*62 + np.sin(v*35 + swirl*4)*5))
mars_noise=noise((4,8,16,32,64,128))
mars=colors((164,81,48),mars_noise*80)
dark=np.clip((np.sin(u*22 + np.sin(v*17)*3) + mars_noise*6 - .7),0,1)
mars-=dark[:,:,None]*np.array((43,31,23))
pole=np.clip((np.abs(v-.5)-.435)*30,0,1)[:,:,None]
mars=mars*(1-pole)+np.array((216,211,197))*pole
save('mars',mars)

for name,base,amp in [('jupiter',(197,163,125),33),('saturn',(207,185,139),19),('uranus',(142,195,195),5),('neptune',(45,91,177),13)]:
    fine=noise((16,32,64,128))
    turbulence=np.sin(u*27 + np.sin(v*49)*2)*.004 + fine*.016
    latitude=v+turbulence
    bands=np.sin(latitude*68)*.6+np.sin(latitude*141)*.25+np.sin(latitude*31)*.5
    texture=colors(base,bands*amp+fine*amp*.7)
    if name=='jupiter':
        # An original schematic Great Red Spot; no claim to current weather.
        ellipse=((u-.68)/.052)**2 + ((v-.61)/.038)**2
        spot=np.clip((1.15-ellipse)*3,0,1)[:,:,None]
        target=np.array((167,91,57))+np.sin(ellipse[:,:,None]*20)*8
        texture=texture*(1-spot*.8)+target*spot*.8
    save(name,texture)

grain=noise((16,32,64,128))
save('sun',colors((255,170,54),grain*95 + np.sin(u*110+grain*5)*5))

ring=Image.new('RGBA',(1024,16))
pixels=np.zeros((16,1024,4),dtype=np.uint8)
for i in range(1024):
    radius=i/1023
    a=(.42 + .22*np.sin(radius*340)+.13*np.sin(radius*840))*255
    if .60<radius<.65: a*=.05 # Cassini-like division, schematic
    a*=min(1,radius*30,(1-radius)*30)
    pixels[:,i,:]=[194,178,145,int(np.clip(a,0,220))]
Image.fromarray(pixels).save(OUT/'saturn-ring.png',optimize=True)

sources={
    'earth':'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_2048.png',
    'earth-clouds':'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg',
}
for name,url in sources.items():
    local=Path(tempfile.gettempdir())/('orbita-earth.png' if name=='earth' else 'orbita-clouds.jpg')
    if not local.exists(): urllib.request.urlretrieve(url,local)
    image=Image.open(local).convert('RGB')
    if name=='earth':
        image.save(OUT/'earth-high.webp',quality=86,method=6)
    save(name,np.asarray(image.resize((W,H),Image.Resampling.LANCZOS)))

for path in sorted(OUT.iterdir()):
    print(f'{path.name}: {path.stat().st_size:,} bytes')
