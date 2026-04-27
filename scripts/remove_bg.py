"""
Rimuove il colore di sfondo beige/crema dall'immagine della mascot
e lo sostituisce con trasparenza (canale alpha).
"""
from PIL import Image
import numpy as np
import sys

def remove_background(input_path: str, output_path: str, tolerance: int = 30):
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)

    # Colore di sfondo da rimuovere (beige/crema: ~F5F0E8)
    bg_color = np.array([245, 240, 232], dtype=np.float32)

    rgb = data[:, :, :3]
    alpha = data[:, :, 3]

    # Calcola distanza euclidea di ogni pixel dal colore bg
    dist = np.sqrt(np.sum((rgb - bg_color) ** 2, axis=2))

    # I pixel entro la tolleranza diventano trasparenti
    mask = dist < tolerance
    alpha[mask] = 0

    data[:, :, 3] = alpha
    result = Image.fromarray(data.astype(np.uint8), "RGBA")
    result.save(output_path, "PNG")
    print(f"✅ Salvato: {output_path}")

if __name__ == "__main__":
    src = r"public\immagini\mascot\Chef Nolimpius.png"
    dst = r"public\immagini\mascot\Chef Nolimpius nobg.png"
    remove_background(src, dst, tolerance=35)
