<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storage'
import GroundhogMascot from '@/components/GroundhogMascot.vue'
import type { GameResult } from '@/types'

const router = useRouter()

// name to be used in web-stats-json.php
const STATS_DB_COL = '1x1'

const result = ref<GameResult | null>(null)

const successRate = computed(() => {
  if (!result.value) return 0
  return result.value.correctAnswers / result.value.totalCards
})

const showMascot = computed(() => {
  return successRate.value >= 0.7
})

onMounted(async () => {
  result.value = StorageService.getGameResult()

  if (!result.value) {
    // No result found, redirect to home
    router.push({ name: '/' })
  } else {
    const url = `https://entorb.net/web-stats-json.php?origin=${STATS_DB_COL}&action=write`
    try {
      await fetch(url)
      // Silently ignore errors - stats are not critical for app functionality
    } catch {
      // Silently ignore errors - stats are not critical for app functionality
    }
  }
})

function goHome() {
  // Clear game result from session storage
  StorageService.clearGameResult()
  router.push({ name: '/' })
}
</script>

<template>
  <q-page class="q-pa-md">
    <div
      v-if="result"
      class="text-center"
    >
      <GroundhogMascot
        v-if="showMascot"
        smile
        class="mascot q-mb-md"
      />
      <q-icon
        v-else
        name="emoji_events"
        color="amber"
        size="100px"
      />
      <div class="text-h4 q-mt-md">Spiel beendet!</div>
      <div
        v-if="showMascot"
        class="text-h6 text-positive q-mt-sm"
      >
        Sehr gut! {{ Math.round(successRate * 100) }}% richtig!
      </div>

      <q-card class="q-mt-lg">
        <q-card-section>
          <div class="text-h5 q-mb-md">Ergebnis</div>
          <div class="row q-gutter-md justify-center">
            <div>
              <div class="text-caption">Punkte</div>
              <div class="text-h4 text-primary">{{ result.points }}</div>
            </div>
            <div>
              <div class="text-caption">Richtige Antworten</div>
              <div class="text-h4 text-positive">{{ result.correctAnswers }}</div>
            </div>
            <div>
              <div class="text-caption">Von</div>
              <div class="text-h4">{{ result.totalCards }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-btn
        color="primary"
        size="xl"
        class="full-width q-mt-lg"
        icon="home"
        @click="goHome"
      >
        <span class="text-h6">Zurück zur Startseite</span>
      </q-btn>
    </div>
  </q-page>
</template>

<style scoped>
.mascot {
  width: 150px;
  height: 150px;
}
</style>
