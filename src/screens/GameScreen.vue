<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useGameStore } from '../stores/game';
import { useSettingsStore, type Speed } from '../stores/settings';
import { MATRA_ORDER } from '../data/types';
import { MATRA_COLORS } from '../game/constants';
import { GameEngine } from '../game/GameEngine';

const game = useGameStore();
const settings = useSettingsStore();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const hintText = ref('');

let engine: GameEngine | null = null;
let timer: ReturnType<typeof setInterval> | undefined;

const SPEED_MULT: Record<Speed, number> = { slow: 0.7, normal: 1, fast: 1.4 };

// ตัวนับเวลารอบ 1 วินาที (docs/04-chapter-4-game-design.md — รอบ 3 นาที)
onMounted(() => {
  if (!canvasRef.value) return;
  engine = new GameEngine(canvasRef.value, {
    onCorrect: (points, combo) => {
      hintText.value = '';
      game.addScore(points, combo);
    },
    onWrong: () => {
      game.registerWrong();
    },
    onHint: (text) => {
      hintText.value = text;
    },
    onEscape: () => {
      game.registerEscape();
    },
  });
  engine.setSpeedMultiplier(SPEED_MULT[settings.speed]);
  engine.setGentleMode(settings.gentleMode);
  void engine.start();

  // เปิดให้เทส E2E เข้าถึงได้ (dev เท่านั้น)
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__monsterSpellerEngine = engine;
  }

  timer = setInterval(() => game.tick(), 1000);
  window.addEventListener('keydown', onKey);
});

onBeforeUnmount(() => {
  engine?.stop();
  engine = null;
  if (timer) clearInterval(timer);
  window.removeEventListener('keydown', onKey);
});

// เปลี่ยนความเร็ว/โหมดผ่อนปรนตอนกำลังเล่น (Modal Settings เปิดค้างได้)
watch(
  () => settings.speed,
  (s) => engine?.setSpeedMultiplier(SPEED_MULT[s]),
);
watch(
  () => settings.gentleMode,
  (v) => engine?.setGentleMode(v),
);

// แป้น 1–8 เลือกกระสุน — ใช้ event.code กันปัญหา IME ภาษาไทย (docs/07-chapter-7 ข้อ 7.7)
// Space = ยิงไปยังจุดเล็งสุดท้าย
function onKey(e: KeyboardEvent) {
  const code = e.code;
  if (code.startsWith('Digit')) {
    const n = Number(code.slice(5));
    if (n >= 1 && n <= 8) {
      game.selectBullet(MATRA_ORDER[n - 1]);
      engine?.setBullet(MATRA_ORDER[n - 1]);
    }
  } else if (code === 'Space' && game.status === 'playing') {
    e.preventDefault();
    engine?.fireDefault();
  }
}

// คลิก/แตะบนฉาก = ยิง (docs/04-chapter-4-game-design.md ข้อ 4.6)
function onCanvasClick(e: MouseEvent) {
  if (game.status !== 'playing') return;
  engine?.handlePointer(e.clientX, e.clientY);
}

function selectBullet(m: (typeof MATRA_ORDER)[number]) {
  game.selectBullet(m);
  engine?.setBullet(m);
}

// จบรอบโดย HP=0 ผ่าน store แล้ว — ดูเวลาด้วย watcher กันกรณี timeLeft ข้าม 0
watch(
  () => game.timeLeft,
  (t) => {
    if (t === 0 && game.status === 'playing') game.endRound();
  },
);
</script>

<template>
  <section data-testid="game-screen" class="game">
    <header class="hud">
      <span data-testid="hud-timer" class="hud-item">⏱ {{ game.timeText }}</span>
      <span data-testid="hud-score" class="hud-item">🏆 {{ game.score }}</span>
      <span data-testid="hud-hp" class="hud-item">❤️ {{ game.hp }}</span>
      <span v-if="game.combo > 1" class="hud-item combo">🔥 คอมโบ ×{{ game.combo }}</span>
      <span data-testid="selected-bullet" class="hud-item selected">กระสุน: {{ game.selectedMatra }}</span>
      <button data-testid="back-button" class="btn btn-small" @click="game.backToHub()">← ออก</button>
    </header>

    <div class="arena-wrap">
      <canvas
        ref="canvasRef"
        data-testid="game-canvas"
        class="arena"
        :class="{ dimmed: game.status !== 'playing' }"
        @click="onCanvasClick"
      ></canvas>

      <transition name="fade">
        <div v-if="hintText" data-testid="hint-banner" class="hint-banner">
          💡 {{ hintText }}
        </div>
      </transition>
    </div>

    <footer class="bullets">
      <button
        v-for="(m, i) in MATRA_ORDER"
        :key="m"
        :data-testid="'bullet-' + m"
        class="bullet"
        :class="{ active: game.selectedMatra === m }"
        :style="{ '--mc': MATRA_COLORS[m] }"
        @click="selectBullet(m)"
      >
        <span class="key">{{ i + 1 }}</span>
        <span class="matra">{{ m }}</span>
      </button>
    </footer>

    <!-- สรุปรอบ (docs/04-chapter-4-game-design.md ข้อ 4.8) -->
    <div v-if="game.status === 'roundEnd'" data-testid="round-summary" class="summary-overlay">
      <div class="summary-card">
        <h2>🚀 สิ้นสุดภารกิจ</h2>
        <p class="summary-score">
          คะแนนรวม <strong data-testid="summary-score">{{ game.score }}</strong>
        </p>
        <div class="summary-grid">
          <div class="stat">
            <span class="stat-num">{{ game.correctHits }}</span>
            <span class="stat-label">ยิงถูก</span>
          </div>
          <div class="stat">
            <span class="stat-num">{{ game.wrongHits }}</span>
            <span class="stat-label">ยิงผิด</span>
          </div>
          <div class="stat">
            <span class="stat-num">×{{ game.bestCombo }}</span>
            <span class="stat-label">คอมโบสูงสุด</span>
          </div>
          <div class="stat">
            <span class="stat-num">{{ game.escaped }}</span>
            <span class="stat-label">หนีถึงฐาน</span>
          </div>
        </div>
        <p v-if="game.score >= 5000" class="verdict">🏅 ยอดเยี่ยม! พิทักษ์โลกได้อย่างสมบูรณ์</p>
        <p v-else-if="game.score >= 2500" class="verdict">👍 เก่งมาก ฝึกอีกนิดก็สมบูรณ์แบบ</p>
        <p v-else class="verdict">💪 สู้ต่อ! เปิดบทเรียนมาตราแล้วกลับมาใหม่</p>
        <div class="summary-actions">
          <button data-testid="back-to-hub" class="btn" @click="game.backToHub()">กลับหน้าหลัก</button>
          <button data-testid="replay-round" class="btn btn-primary" @click="game.startRound()">เล่นอีกครั้ง</button>
        </div>
      </div>
    </div>
  </section>
</template>
