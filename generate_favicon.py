from PIL import Image
import os

def create_favicon():
    source_path = 'public/icon.png'
    dest_path = 'public/favicon.ico'
    
    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found")
        return

    img = Image.open(source_path)
    
    # Generate multiple sizes for a proper ICO file
    # Standard sizes: 16, 32, 48, 64, 128, 256
    img.save(dest_path, format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
    print(f"Successfully created high-res {dest_path}")

create_favicon()
