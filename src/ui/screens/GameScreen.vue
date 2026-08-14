<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useGameStore } from '../../stores/game';
import { useSettingsStore } from '../../stores/settings';
import { useHallOfFameStore } from '../../stores/hallOfFame';
import { MATRA_ORDER } from '../../game/types';
import { MATRA_COLORS } from '../../game/constants';
import { SETTINGS_SPEED } from '../../game/systems/Difficulty';
import { GameEngine } from '../../game/engine/GameEngine';

const game = useGameStore();
const settings = useSettingsStore();
const hof = useHallOfFameStore();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const hintText = ref('');
const playerName = ref('');
const savedRank = ref<number | null>(null);
const saveError = ref('');

let engine: GameEngine | null = null;
let timer: ReturnType<typeof setInterval> | undefined;

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
  engine.setLevel(game.levelConfig);
  engine.setSpeedMultiplier(SETTINGS_SPEED[settings.speed]);
  engine.setGentleMode(settings.gentleMode);
  void engine.start();

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

// ซิงค์การตั้งค่า/ด่านกับ engine
watch(
  () => settings.speed,
  (s) => engine?.setSpeedMultiplier(SETTINGS_SPEED[s]),
);
watch(
  () => settings.gentleMode,
  (v) => engine?.setGentleMode(v),
);
watch(
  () => game.level,
  () => {
    if (engine) engine.setLevel(game.levelConfig);
  },
);

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

function onCanvasClick(e: MouseEvent) {
  if (game.status !== 'playing') return;
  engine?.handlePointer(e.clientX, e.clientY);
}

function selectBullet(m: (typeof MATRA_ORDER)[number]) {
  game.selectBullet(m);
  engine?.setBullet(m);
}

watch(
  () => game.timeLeft,
  (t) => {
    if (t === 0 && game.status === 'playing') game.endRound();
  },
);

/** บันทึกคะแนนลง Hall of Fame (ผ่าน store + services/storage) */
function saveScore() {
  const name = playerName.value.trim();
  if (!name) {
    saveError.value = 'กรอกชื่อก่อนบันทึกครับ';
    return;
  }
  const rank = hof.addEntry({
    name,
    score: game.score,
    correctHits: game.correctHits,
    wrongHits: game.wrongHits,
    level: game.level,
  });
  savedRank.value = rank;
  saveError.value = '';
}
</script>

<template>
  <section data-testid="game-screen" class="game">
    <header class="hud">
      <span data-testid="hud-timer" class="hud-item">⏱ {{ game.timeText }}</span>
      <span data-testid="hud-score" class="hud-item">🏆 {{ game.score }}</span>
      <span data-testid="hud-hp" class="hud-item">❤️ {{ game.hp }}</span>
      <span data-testid="hud-level" class="hud-item">🎯 ด่าน {{ game.level }}</span>
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
        <p class="verdict">{{ game.verdict }}</p>

        <!-- บันทึก Hall of Fame -->
        <div v-if="savedRank" class="hof-saved" data-testid="hof-saved">
          🎉 บันทึกสำเร็จ — อันดับที่ <strong>{{ savedRank }}</strong>!
        </div>
        <div v-else class="hof-save">
          <input
            v-model="playerName"
            data-testid="hof-name-input"
            class="name-input"
            placeholder="ชื่อผู้เล่น (เช่น ดาวน้อย)"
            maxlength="20"
            @keyup.enter="saveScore"
          />
          <button data-testid="hof-save-button" class="btn btn-small" @click="saveScore">
            บันทึกคะแนน
          </button>
        </div>
        <p v-if="saveError" class="save-error" data-testid="hof-error">{{ saveError }}</p>

        <div class="summary-actions">
          <button data-testid="back-to-hub" class="btn" @click="game.backToHub()">กลับหน้าหลัก</button>
          <button data-testid="replay-round" class="btn btn-primary" @click="game.startRound()">เล่นอีกครั้ง</button>
        </div>
      </div>
    </div>
  </section>
</template>
