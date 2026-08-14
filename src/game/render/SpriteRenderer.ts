import type { Monster } from '../entities/Monster';

interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ManifestMonster {
  frames: Record<string, FrameRect>;
}

interface Manifest {
  frames: Record<string, ManifestMonster>;
}

/**
 * วาดสไปรต์มอนสเตอร์จาก Sprite sheet (public/assets/sprites/monsters-sheet.png)
 * — slice ตาม manifest และเลือกเฟรมตามสถานะของมอนสเตอร์
 */
export class SpriteRenderer {
  private img: HTMLImageElement | null = null;
  private manifest: Manifest | null = null;

  static async load(): Promise<SpriteRenderer> {
    const renderer = new SpriteRenderer();
    await renderer.loadImage();
    await renderer.loadManifest();
    return renderer;
  }

  private async loadImage(): Promise<void> {
    const img = new Image();
    img.src = import.meta.env.BASE_URL + 'assets/sprites/monsters-sheet.png';
    await img.decode();
    this.img = img;
  }

  private async loadManifest(): Promise<void> {
    const res = await fetch(import.meta.env.BASE_URL + 'assets/sprites/monsters-sheet.json');
    this.manifest = (await res.json()) as Manifest;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    monster: Monster,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const img = this.img;
    const row = this.manifest?.frames[monster.spriteId];
    if (!img || !row) return;
    const rect = row.frames[monster.frameName()] ?? row.frames.walk1;
    if (!rect) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, x, y, w, h);
  }
}
