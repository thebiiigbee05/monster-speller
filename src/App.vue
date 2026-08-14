<script setup lang="ts">
import { useGameStore } from './stores/game';
import HubScreen from './screens/HubScreen.vue';
import GameScreen from './screens/GameScreen.vue';

const game = useGameStore();
</script>

<template>
  <main class="app">
    <Transition name="screen" mode="out-in">
      <HubScreen v-if="game.status === 'hub'" key="hub" />
      <GameScreen v-else key="game" />
    </Transition>
  </main>
</template>
