/**
 * เกมลูปพื้นฐาน (core/ — ไม่รู้จักเกม Monster Speller)
 * เรียก onTick(dt) ทุกเฟรม โดย dt ถูกจำกัด (cap) กันเกมกระโดดเมื่อแท็บพื้นหลัง
 */
export class GameLoop {
  private raf = 0;
  private last = 0;
  private running = false;

  constructor(
    private readonly onTick: (dt: number) => void,
    private readonly maxDelta = 0.05,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  get isRunning(): boolean {
    return this.running;
  }

  private frame = (t: number): void => {
    if (!this.running) return;
    const dt = Math.min((t - this.last) / 1000, this.maxDelta);
    this.last = t;
    this.onTick(dt);
    this.raf = requestAnimationFrame(this.frame);
  };
}
