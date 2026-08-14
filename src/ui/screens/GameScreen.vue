<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useGameStore } from '../../stores/game';
import { useSettingsStore } from '../../stores/settings';
import { useHallOfFameStore } from '../../stores/hallOfFame';
import { MATRA_ORDER } from '../../game/types';
import { MATRA_COLORS } from '../../game/constants';
import { SETTINGS_SPEED } from '../../game/systems/Difficulty';
import {
  GameEngine,
  LEARN_WORDS_PER_ROUND,
  type GameMode as EngineGameMode,
} from '../../game/engine/GameEngine';
import type { Matra } from '../../game/types';

const game = useGameStore();
const settings = useSettingsStore();
const hof = useHallOfFameStore();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const hintText = ref('');
const playerName = ref('');
const savedRank = ref<number | null>(null);
const saveError = ref('');

// โหมดเรียนรู้: ตัวเลือกมาตรา 3 ปุ่ม + สถานะการตอบ
const learnChoices = ref<Matra[]>([]);
/** ตำแหน่ง (index) ของมาตรา�ที่ถูกต้องในชุดตัวเลือก */
const answerIndex = ref(-1);
/** ปุ่มที่ผู้เล่นตอบถูกแล้ว (ปิดการตอบซ้ำ) */
const solvedIndex = ref(-1);
const answered = ref(0);
const justCorrect = ref(false);
const justWrong = ref(false);
const lastWrongIndex = ref(-1);

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
    onChoices: (options, ci) => {
      learnChoices.value = options;
      answerIndex.value = ci;
      solvedIndex.value = -1;
      justCorrect.value = false;
      justWrong.value = false;
    },
    onLearnDone: () => {
      game.learnDone();
    },
  });
  engine.setLevel(game.levelConfig);
  engine.setSpeedMultiplier(SETTINGS_SPEED[settings.speed]);
  engine.setGentleMode(settings.gentleMode);
  engine.setMode(game.mode as EngineGameMode);
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

/** คำที่กำลังถาม (จากมอนสเตอร์บนจอ) */
function learnCurrentWord(): string {
  return engine?.monsters[0]?.word.word ?? '…';
}

/** ปุ่มนี้เพิ่งตอบผิดหรือไม่ (แอนิเมชันสั่นแดง) */
function engineWrongIndex(m: Matra): boolean {
  return learnChoices.value.indexOf(m) === lastWrongIndex.value;
}

/** คลิกตัวเลือกมาตราในโหมดเรียนรู้ */
function chooseMatra(m: Matra, i: number) {
  if (game.mode !== 'learn' || game.status !== 'playing') return;
  if (i === solvedIndex.value) return; // ตัวเลือกที่ตอบถูกแล้ว (เป็นมิตร) — ป้องกันการตอบซ้ำ
  const ok = engine?.answer(m) ?? false;
  if (ok) {
    solvedIndex.value = i;
    answered.value += 1;
    justCorrect.value = true;
    justWrong.value = false;
  } else {
    lastWrongIndex.value = i;
    justWrong.value = true;
    setTimeout(() => {
      justWrong.value = false;
      lastWrongIndex.value = -1;
    }, 600);
  }
}

watch(
  () => game.mode,
  (m) => engine?.setMode(m as EngineGameMode),
);

watch(
  () => game.timeLeft,
  (t) => {
    if (t === 0 && game.status === 'playing') game.endRound();
  },
);

/** แสดงสรุปแบบดาวในโหมดเรียนรู้ (คำตอบถูก X จาก Y) */
function starsText(): string {
  const total = game.correctHits + game.wrongHits;
  const filled = game.learnStars;
  return '★'.repeat(filled) + '☆'.repeat(Math.max(0, 3 - filled)) + ` (${game.correctHits}/${total} ถูก)`;
}

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
      <template v-if="game.mode === 'challenge'">
        <span data-testid="hud-timer" class="hud-item">⏱ {{ game.timeText }}</span>
        <span data-testid="hud-hp" class="hud-item">❤️ {{ game.hp }}</span>
        <span v-if="game.combo > 1" class="hud-item combo">🔥 คอมโบ ×{{ game.combo }}</span>
      </template>
      <span v-else class="hud-item" data-testid="hud-progress">
        📚 คำที่ {{ Math.min(answered + 1, LEARN_WORDS_PER_ROUND) }} / {{ LEARN_WORDS_PER_ROUND }}
      </span>
      <span data-testid="hud-score" class="hud-item">🏆 {{ game.score }}</span>
      <span data-testid="hud-level" class="hud-item">🎯 ด่าน {{ game.level }}</span>
      <span v-if="game.mode === 'challenge'" data-testid="selected-bullet" class="hud-item selected">
        กระสุน: {{ game.selectedMatra }}
      </span>
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

    <!-- โหมดท้าทาย: แถบกระสุน 8 มาตรา -->
    <footer v-if="game.mode === 'challenge'" class="bullets">
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

    <!-- โหมดเรียนรู้: ตัวเลือกมาตรา 3 ปุ่ม (docs/04-chapter-4 ข้อ 4.6) -->
    <div v-else class="learn-bar">
      <p class="learn-prompt" data-testid="learn-prompt">
        คำนี้อยู่ในมาตราใด? <span class="learn-word" data-testid="learn-word">{{ learnCurrentWord() }}</span>
      </p>
      <div class="learn-choices" data-testid="learn-choices">
        <button
          v-for="(m, i) in learnChoices"
          :key="m"
          :data-testid="'learn-choice-' + m"
          class="learn-choice"
          :class="{
            correct: i === solvedIndex && justCorrect,
            wrong: i !== answerIndex && justWrong && engineWrongIndex(m),
          }"
          :style="{ '--mc': MATRA_COLORS[m] }"
          :disabled="i === solvedIndex"
          @click="chooseMatra(m, i)"
        >
          มาตรา {{ m }}
        </button>
      </div>
    </div>

    <!-- สรุปรอบ (docs/04-chapter-4-game-design.md ข้อ 4.8) -->
    <div v-if="game.status === 'roundEnd'" data-testid="round-summary" class="summary-overlay">
      <div class="summary-card">
        <h2>{{ game.mode === 'learn' ? '🎉 เก่งมาก!' : '🚀 สิ้นสุดภารกิจ' }}</h2>

        <!-- โหมดเรียนรู้: ดาว 1-3 + ข้อความชื่นชม -->
        <template v-if="game.mode === 'learn'">
          <p class="summary-stars" data-testid="summary-stars">{{ starsText() }}</p>
          <div class="summary-grid">
            <div class="stat">
              <span class="stat-num">{{ game.correctHits }}</span>
              <span class="stat-label">ตอบถูก</span>
            </div>
            <div class="stat">
              <span class="stat-num">{{ game.wrongHits }}</span>
              <span class="stat-label">ตอบผิด (ได้คำใบ้)</span>
            </div>
          </div>
          <p class="verdict">
            {{ game.learnStars === 3 ? 'สมบูรณ์แบบ! มาตราแม่นยำมาก' : game.learnStars === 2 ? 'เก่งมาก เกือบได้ 3 ดาวแล้ว' : 'ลองใหม่อีกครั้ง เดี๋ยวก็ได้ดาวครบ' }}
          </p>
        </template>

        <!-- โหมดท้าทาย: คะแนน + สถิติเดิม -->
        <template v-else>
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
        </template>

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
