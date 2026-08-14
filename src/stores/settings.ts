import { defineStore } from 'pinia';
import type { Speed } from '../game/types';

interface SettingsState {
  bgm: boolean;
  sfx: boolean;
  speed: Speed;
  gentleMode: boolean;
  lowFX: boolean;
}

/** การตั้งค่า (Modal Settings — docs/06-chapter-6-ui-ux-graphics.md ข้อ 6.3) */
export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    bgm: true,
    sfx: true,
    speed: 'normal',
    gentleMode: false,
    lowFX: false,
  }),
  actions: {
    toggleBgm() {
      this.bgm = !this.bgm;
    },
    toggleSfx() {
      this.sfx = !this.sfx;
    },
    setSpeed(speed: Speed) {
      this.speed = speed;
    },
    toggleGentleMode() {
      this.gentleMode = !this.gentleMode;
    },
  },
});
