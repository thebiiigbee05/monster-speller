<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '../../stores/game';
import { LEVELS } from '../../content/levels';
import SettingsModal from '../components/modals/SettingsModal.vue';
import HallOfFameModal from '../components/modals/HallOfFameModal.vue';

const game = useGameStore();
const showSettings = ref(false);
const showHof = ref(false);
</script>

<template>
  <section data-testid="hub-screen" class="hub">
    <h1 class="title">MONSTER SPELLER</h1>
    <p class="subtitle">👾 กองกำลังพิทักษ์ตัวสะกด — ยิงกระสุนมาตราตัวสะกด เปลี่ยนมอนสเตอร์ให้เป็นมิตร</p>

    <!-- เลือกด่าน (content/levels — docs/04-chapter-4 ข้อ 4.9) -->
    <div class="level-select" data-testid="level-select">
      <span class="level-label">ด่าน:</span>
      <button
        v-for="lvl in LEVELS"
        :key="lvl.id"
        :data-testid="'level-' + lvl.id"
        class="level-btn"
        :class="{ active: game.level === lvl.id }"
        :title="lvl.name"
        @click="game.selectLevel(lvl.id)"
      >
        {{ lvl.id }}
      </button>
    </div>

    <div class="menu">
      <button data-testid="start-button" class="btn btn-primary" @click="game.startRound()">
        🚀 เริ่มเกม ({{ game.levelConfig.name }})
      </button>
      <button data-testid="settings-button" class="btn" @click="showSettings = true">⚙️ ตั้งค่า</button>
      <button data-testid="hall-of-fame-button" class="btn" @click="showHof = true">🏆 หอเกียรติยศ</button>
    </div>

    <SettingsModal v-if="showSettings" @close="showSettings = false" />
    <HallOfFameModal v-if="showHof" @close="showHof = false" />
  </section>
</template>
