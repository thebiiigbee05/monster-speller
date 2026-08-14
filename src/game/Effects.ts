/**
 * ระบบเอฟเฟกต์บน Canvas (docs/06-chapter-6-ui-ux-graphics.md ข้อ 6.2)
 * - ParticleSystem: ระเบิด/ประกาย/เปลวไฟ
 * - FloatingTexts: ตัวเลขคะแนน/ข้อความลอยขึ้น
 * ใช้ Object pooling แบบง่าย (รีไซเคิลเมื่อหมดอายุ) เพื่อจำกัด GC บนคอมพิวเตอร์รุ่นเก่า
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

export class ParticleSystem {
  particles: Particle[] = [];

  /** ระเบิดกระจายจากจุด (x, y) */
  burst(x: number, y: number, color: string, count: number, speed = 160, size = 3, life = 0.6): void {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: life * (0.5 + Math.random() * 0.5),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        color,
        gravity: 60,
      });
    }
  }

  /** ประกายไฟเล็ก ๆ พุ่งขึ้น (เปลวท้ายยาน) */
  emit(x: number, y: number, color: string): void {
    this.spawn({
      x: x + (Math.random() - 0.5) * 8,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy: 60 + Math.random() * 90,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      size: 1.6 + Math.random() * 1.6,
      color,
      gravity: 0,
    });
  }

  private spawn(p: Particle): void {
    if (this.particles.length > 400) this.particles.shift(); // จำกัดจำนวน (โหมดลดเอฟเฟกต์รองรับ)
    this.particles.push(p);
  }

  update(dt: number): void {
    const arr = this.particles;
    for (let i = arr.length - 1; i >= 0; i -= 1) {
      const p = arr[i];
      p.life -= dt;
      if (p.life <= 0) {
        arr[i] = arr[arr.length - 1];
        arr.pop();
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export interface FloatText {
  text: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class FloatingTexts {
  items: FloatText[] = [];

  add(text: string, x: number, y: number, color: string, size = 22): void {
    this.items.push({
      text,
      x,
      y,
      vy: -55,
      life: 1.1,
      maxLife: 1.1,
      color,
      size,
    });
  }

  update(dt: number): void {
    const arr = this.items;
    for (let i = arr.length - 1; i >= 0; i -= 1) {
      const t = arr[i];
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy *= 1 - dt * 2; // ชะลอ
      if (t.life <= 0) {
        arr[i] = arr[arr.length - 1];
        arr.pop();
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.items) {
      const a = Math.min(1, t.life / (t.maxLife * 0.5));
      ctx.globalAlpha = a;
      ctx.font = `700 ${t.size}px "Chakra Petch", "Prompt", sans-serif`;
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
