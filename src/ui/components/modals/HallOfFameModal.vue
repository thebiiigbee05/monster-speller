<script setup lang="ts">
import { computed } from 'vue';
import { useHallOfFameStore } from '../../../stores/hallOfFame';

defineEmits<{ close: [] }>();

const hof = useHallOfFameStore();

/** แสดง 10 แถวเสมอ — ถ้ายังมีคะแนนไม่ครบ pad ด้วยแถวว่าง (—) */
const rows = computed(() => {
  const rows = hof.entries.map((e, i) => ({ rank: i + 1, name: e.name, score: e.score }));
  while (rows.length < 10) {
    rows.push({ rank: rows.length + 1, name: '—', score: 0 });
  }
  return rows;
});
</script>

<template>
  <div class="modal-overlay" data-testid="hof-modal" @click.self="$emit('close')">
    <div class="modal">
      <h2>🏆 หอเกียรติยศ (10 อันดับ)</h2>
      <table class="hof">
        <thead>
          <tr><th>อันดับ</th><th>ชื่อ</th><th>คะแนน</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.rank">
            <td>{{ row.rank }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.score || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <div class="row" style="justify-content: flex-end; margin-top: 12px">
        <button data-testid="hof-close" class="btn btn-small" @click="$emit('close')">ปิด</button>
      </div>
    </div>
  </div>
</template>
