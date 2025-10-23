<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storage'
import GroundhogMascot from '@/components/GroundhogMascot.vue'
import type { GameResult } from '@/types'
import {
  STATS_DB_COL,
  WEB_STATS_API_URL,
  FIRST_GAME_BONUS,
  STREAK_GAME_BONUS,
  STREAK_GAME_INTERVAL,
  TEXT
} from '@/config/constants'
import { TEXT_DE } from '@/config/text-de'

const router = useRouter()

const result = ref<GameResult | null>(null)
const bonusPoints = ref(0)
const bonusReasons = ref<string[]>([])

const successRate = computed(() => {
  if (!result.value) return 0
  return result.value.correctAnswers / result.value.totalCards
})

const showMascot = computed(() => {
  return successRate.value >= 0.7
})

const totalPoints = computed(() => {
  if (!result.value) return 0
  return result.value.points + bonusPoints.value
})

const successMessage = computed(() => {
  return TEXT_DE.successMessage.replace('{{percent}}', String(Math.round(successRate.value * 100)))
})

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    goHome()
  }
}

onMounted(async () => {
  result.value = StorageService.getGameResult()

  if (!result.value) {
    // No result found, redirect to home
    router.push({ name: '/' })
  } else {
    // Calculate daily bonuses
    const dailyInfo = StorageService.incrementDailyGames()

    if (dailyInfo.isFirstGame) {
      bonusPoints.value += FIRST_GAME_BONUS
      bonusReasons.value.push(TEXT.firstGameBonus)
    }

    if (dailyInfo.gamesPlayedToday % STREAK_GAME_INTERVAL === 0) {
      bonusPoints.value += STREAK_GAME_BONUS
      bonusReasons.value.push(`${dailyInfo.gamesPlayedToday}. ${TEXT.streakGameBonus}`)
    }

    // Update statistics with bonus points
    if (bonusPoints.value > 0) {
      StorageService.updateStatistics(bonusPoints.value, 0)
    }

    const url = `${WEB_STATS_API_URL}?origin=${STATS_DB_COL}&action=write`
    try {
      await fetch(url)
      // Silently ignore errors - stats are not critical for app functionality
    } catch {
      // Silently ignore errors - stats are not critical for app functionality
    }
  }

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function goHome() {
  // Clear game result from session storage
  StorageService.clearGameResult()
  router.push({ name: '/' })
}
</script>

<template>
  <q-page class="game-over-page q-pa-md">
    <div
      v-if="result"
      class="text-center content-container"
    >
      <!-- Mascot or Trophy Icon -->
      <div class="mascot-container q-mb-md">
        <GroundhogMascot
          v-if="showMascot"
          smile
          class="mascot"
        />
        <q-icon
          v-else
          name="emoji_events"
          color="amber"
          size="100px"
          class="trophy-icon"
        />
      </div>

      <!-- Title -->
      <div class="text-h4 q-mt-md game-title">{{ TEXT_DE.gameOver }}</div>

      <!-- Success Message -->
      <div
        v-if="showMascot"
        class="text-h6 text-positive q-mt-sm success-message"
      >
        {{ successMessage }}
      </div>

      <!-- Results Card -->
      <q-card class="q-mt-lg results-card">
        <q-card-section class="results-section">
          <div class="text-h5 q-mb-md results-title">{{ TEXT_DE.results }}</div>
          <div class="row q-gutter-md justify-center stats-row">
            <div class="stat-item">
              <div class="text-caption stat-label">{{ TEXT_DE.pointsLabel }}</div>
              <div class="text-h4 text-primary stat-value">{{ result.points }}</div>
            </div>
            <div class="stat-item">
              <div class="text-caption stat-label">{{ TEXT_DE.correct_plural }}</div>
              <div class="text-h4 text-positive stat-value">{{ result.correctAnswers }}</div>
            </div>
            <div class="stat-item">
              <div class="text-caption stat-label">{{ TEXT_DE.from }}</div>
              <div class="text-h4 stat-value">{{ result.totalCards }}</div>
            </div>
          </div>

          <!-- Bonus Points -->
          <div
            v-if="bonusPoints > 0"
            class="q-mt-md bonus-section"
          >
            <q-separator class="q-mb-md" />
            <div class="text-subtitle2 text-amber-8 text-weight-bold q-mb-sm">
              <q-icon
                name="star"
                color="amber"
              />
              {{ TEXT.bonusPoints }}
            </div>
            <div
              v-for="(reason, index) in bonusReasons"
              :key="index"
              class="bonus-reason"
            >
              <q-chip
                color="amber-2"
                text-color="amber-9"
                icon="add"
                dense
              >
                +{{ reason === TEXT.firstGameBonus ? FIRST_GAME_BONUS : STREAK_GAME_BONUS }}
                {{ reason }}
              </q-chip>
            </div>
            <div class="row justify-center q-mt-sm">
              <div class="text-h6 text-weight-bold">
                {{ result.points }} + {{ bonusPoints }} = {{ totalPoints }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Home Button -->
      <q-btn
        color="primary"
        size="lg"
        class="full-width q-mt-lg home-btn"
        icon="home"
        unelevated
        @click="goHome"
      >
        <span class="button-text">{{ TEXT_DE.backToHome }}</span>
      </q-btn>
    </div>
  </q-page>
</template>

<style scoped>
.game-over-page {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-container {
  width: 100%;
  padding: 20px 0;
}

.mascot-container {
  display: flex;
  justify-content: center;
}

.mascot {
  width: 150px;
  height: 150px;
}

.trophy-icon {
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.game-title {
  font-weight: 700;
  color: #1976d2;
}

.success-message {
  font-weight: 600;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.results-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.results-section {
  padding: 24px 20px;
}

.results-title {
  font-weight: 700;
  color: #424242;
}

.stats-row {
  margin: 0 -8px;
}

.stat-item {
  min-width: 90px;
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #757575;
  margin-bottom: 8px;
}

.stat-value {
  font-weight: 700;
  line-height: 1;
}

.home-btn {
  height: 56px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 3px 8px rgba(25, 118, 210, 0.3);
}

.button-text {
  font-size: 1.1rem;
}

.bonus-section {
  background-color: #fffbf0;
  padding: 12px;
  border-radius: 8px;
}

.bonus-reason {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}

/* iPhone 7 and small screens optimization */
@media (max-width: 599.98px) {
  .game-over-page {
    padding: 12px !important;
  }

  .content-container {
    padding: 10px 0;
  }

  .mascot {
    width: 120px;
    height: 120px;
  }

  .trophy-icon {
    font-size: 80px !important;
  }

  .game-title {
    font-size: 1.75rem;
  }

  .success-message {
    font-size: 1.1rem;
  }

  .results-section {
    padding: 18px 16px;
  }

  .results-title {
    font-size: 1.25rem;
    margin-bottom: 16px !important;
  }

  .stats-row {
    gap: 12px !important;
  }

  .stat-item {
    min-width: 80px;
  }

  .stat-label {
    font-size: 0.65rem;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .home-btn {
    height: 52px;
    margin-top: 20px !important;
  }

  .button-text {
    font-size: 1rem;
  }
}

/* Tablet and larger */
@media (min-width: 600px) {
  .mascot {
    width: 170px;
    height: 170px;
  }
}
</style>
