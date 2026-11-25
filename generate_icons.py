"""
Generate PWA icons (192x192 and 512x512) using pure Python.
Creates simple indigo gradient squares with 'BP' text encoded as PNG.
Run once: python generate_icons.py
"""
import struct, zlib, os

def make_png(width, height):
    """Generate a simple indigo square PNG with 'BP' pixel art."""
    # Indigo color: #6366f1 (99, 102, 241)
    # Violet color: #8b5cf6 (139, 92, 246)
    
    def pixel(x, y, w, h):
        # Gradient from indigo to violet
        t = x / w
        r = int(99 + t * (139 - 99))
        g = int(102 + t * (92 - 102))
        b = int(241 + t * (246 - 241))
        
        # Rounded corners mask
        margin = w // 8
        cx, cy = x - w//2, y - h//2
        corner_r = w // 4
        in_corner = False
        for (ox, oy) in [(-w//2+margin, -h//2+margin), (w//2-margin, -h//2+margin),
                          (-w//2+margin, h//2-margin), (w//2-margin, h//2-margin)]:
            if (cx - ox)**2 + (cy - oy)**2 > corner_r**2:
                # Only check actual corners
                pass
        
        # Simple 'BP' pixel art in center (scaled to icon size)
        px = (x - w//4) / (w // 2)
        py = (y - h//4) / (h // 2)
        
        # White pixel for foreground glyph area
        in_b = (0.1 < px < 0.4 and 0.0 < py < 0.9) or \
               (0.1 < px < 0.5 and 0.0 < py < 0.15) or \
               (0.1 < px < 0.5 and 0.35 < py < 0.5) or \
               (0.3 < px < 0.5 and 0.0 < py < 0.5)
        in_p = (0.5 < px < 0.8 and 0.0 < py < 0.9) or \
               (0.5 < px < 0.9 and 0.0 < py < 0.15) or \
               (0.5 < px < 0.9 and 0.35 < py < 0.5) or \
               (0.7 < px < 0.9 and 0.0 < py < 0.5)
        
        if in_b or in_p:
            return (255, 255, 255, 255)
        return (r, g, b, 255)
    
    rows = []
    for y in range(height):
        row = bytearray()
        row.append(0)  # filter type None
        for x in range(width):
            r, g, b, a = pixel(x, y, width, height)
            row += bytes([r, g, b, a])
        rows.append(bytes(row))
    
    raw = b''.join(rows)
    
    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    # RGBA = color type 6
    ihdr = struct.pack('>II', width, height) + bytes([8, 6, 0, 0, 0])
    
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    
    compressed = zlib.compress(raw, 9)
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    return png

os.makedirs('icons', exist_ok=True)

for size in [192, 512]:
    png_data = make_png(size, size)
    path = f'icons/icon-{size}.png'
    with open(path, 'wb') as f:
        f.write(png_data)
    print(f'Created {path} ({len(png_data)} bytes)')

print('Done! Icons generated in ./icons/')
