<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storage'
import type { GameResult } from '@/types'

const router = useRouter()

const result = ref<GameResult | null>(null)

onMounted(() => {
  result.value = StorageService.getGameResult()

  if (!result.value) {
    // No result found, redirect to home
    router.push({ name: '/' })
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
      <q-icon
        name="emoji_events"
        color="amber"
        size="100px"
      />
      <div class="text-h4 q-mt-md">Spiel beendet!</div>

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
