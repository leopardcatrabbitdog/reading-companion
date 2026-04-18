# Generate icons for Reading Companion Chrome Extension
# Run: python generate_icons.py

from PIL import Image, ImageDraw
import os

def create_icon(size, output_path):
    # Create gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Gradient colors (purple-blue theme)
    color1 = (102, 126, 234)  # #667eea
    color2 = (118, 75, 162)    # #764ba2
    
    # Draw gradient background
    for y in range(size):
        ratio = y / size
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # Draw book icon
    center_x = size // 2
    center_y = size // 2
    
    # Book dimensions (proportional to icon size)
    book_width = int(size * 0.5)
    book_height = int(size * 0.4)
    spine_width = int(size * 0.06)
    
    left = center_x - book_width // 2
    top = center_y - book_height // 2
    right = center_x + book_width // 2
    bottom = center_y + book_height // 2
    
    # Book pages (white background with slight transparency)
    draw.rectangle([left, top, right, bottom], fill=(255, 255, 255, 230))
    
    # Book spine
    spine_left = center_x - spine_width // 2
    draw.rectangle([spine_left, top, spine_left + spine_width, bottom], fill=(240, 240, 240, 255))
    
    # Book cover outline
    draw.rectangle([left, top, right, bottom], outline=(80, 80, 80, 200), width=max(1, size // 32))
    
    # Text lines on book (to represent content)
    line_count = 3
    line_height = book_height // (line_count + 1)
    line_margin = book_width // 4
    
    for i in range(line_count):
        line_y = top + line_height * (i + 1)
        # Left page lines
        draw.line([(left + line_margin, line_y), (center_x - spine_width // 2 - 4, line_y)], 
                  fill=(180, 180, 180, 200), width=max(1, size // 48))
        # Right page lines
        draw.line([(center_x + spine_width // 2 + 4, line_y), (right - line_margin, line_y)], 
                  fill=(180, 180, 180, 200), width=max(1, size // 48))
    
    # Small sparkle/star in top right corner
    star_size = size // 8
    star_x = right - star_size // 2
    star_y = top - star_size // 4
    draw.ellipse([star_x - star_size // 2, star_y - star_size // 2, 
                  star_x + star_size // 2, star_y + star_size // 2], 
                 fill=(255, 220, 100, 255))
    
    img.save(output_path, 'PNG')
    print(f"Created: {output_path}")

# Create icons
output_dir = os.path.dirname(os.path.abspath(__file__))
sizes = [16, 48, 128]

for size in sizes:
    output_path = os.path.join(output_dir, f'icon{size}.png')
    create_icon(size, output_path)

print("All icons created successfully!")
