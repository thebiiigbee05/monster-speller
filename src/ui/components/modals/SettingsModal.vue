<script setup lang="ts">
import { useSettingsStore } from '../../../stores/settings';
import type { Speed } from '../../../game/types';

const settings = useSettingsStore();
defineEmits<{ close: [] }>();

const SPEEDS: { value: Speed; label: string }[] = [
  { value: 'slow', label: 'ช้า' },
  { value: 'normal', label: 'ปกติ' },
  { value: 'fast', label: 'เร็ว' },
];
</script>

<template>
  <div class="modal-overlay" data-testid="settings-modal" @click.self="$emit('close')">
    <div class="modal">
      <h2>⚙️ ตั้งค่า</h2>

      <label class="row">
        <input data-testid="setting-sound" type="checkbox" :checked="settings.sfx" @change="settings.toggleSfx()" />
        เสียงเอฟเฟกต์
      </label>
      <label class="row">
        <input data-testid="setting-music" type="checkbox" :checked="settings.bgm" @change="settings.toggleBgm()" />
        เสียงเพลง
      </label>
      <label class="row">
        <input data-testid="setting-gentle" type="checkbox" :checked="settings.gentleMode" @change="settings.toggleGentleMode()" />
        โหมดผ่อนปรน (ไม่มี HP)
      </label>

      <div class="row">
        <span>ความเร็วเกม:</span>
        <button
          v-for="s in SPEEDS"
          :key="s.value"
          :data-testid="'setting-speed-' + s.value"
          class="btn btn-small"
          :class="{ active: settings.speed === s.value }"
          @click="settings.setSpeed(s.value)"
        >
          {{ s.label }}
        </button>
      </div>

      <div class="row" style="justify-content: flex-end">
        <button data-testid="settings-close" class="btn btn-small" @click="$emit('close')">ปิด</button>
      </div>
    </div>
  </div>
</template>
