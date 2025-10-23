<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storage'
import type { GameHistory } from '@/types'
import { TEXT_DE } from '@/config/text-de'

const router = useRouter()
const history = ref<GameHistory[]>([])

const sortedHistory = computed(() => {
  return [...history.value].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
})

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    goHome()
  }
}

onMounted(() => {
  history.value = StorageService.getHistory()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }
  return new Intl.DateTimeFormat('de-DE', options).format(date)
}

function formatSelection(select: number[] | string): string {
  if (typeof select === 'string') {
    return select
  }
  return select.join(', ')
}

function goHome() {
  router.push({ name: '/' })
}
</script>

<template>
  <q-page class="history-page q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md page-header">
      <q-btn
        flat
        round
        icon="arrow_back"
        @click="goHome"
        size="md"
        class="back-btn"
      />
      <div class="text-h5 q-ml-sm page-title">{{ TEXT_DE.goToHistory }}</div>
    </div>

    <!-- Empty State -->
    <div
      v-if="history.length === 0"
      class="text-center q-mt-xl empty-state"
    >
      <q-icon
        name="inbox"
        size="80px"
        color="grey-5"
        class="empty-icon"
      />
      <div class="text-h6 text-grey-6 q-mt-md empty-text">{{ TEXT_DE.noGamesPlayed }}</div>
    </div>

    <!-- History List -->
    <q-list
      v-else
      separator
      class="history-list"
    >
      <q-item
        v-for="(game, index) in sortedHistory"
        :key="index"
        class="history-item"
      >
        <q-item-section avatar>
          <q-avatar
            color="primary"
            text-color="white"
            size="48px"
            class="game-avatar"
          >
            <q-icon
              name="emoji_events"
              size="24px"
            />
          </q-avatar>
        </q-item-section>

        <q-item-section class="game-info">
          <q-item-label class="text-weight-bold game-date">
            {{ formatDate(game.date) }}
          </q-item-label>
          <q-item-label
            caption
            class="game-select"
          >
            {{ TEXT_DE.selectionPrefix }}{{ formatSelection(game.select) }}
          </q-item-label>
        </q-item-section>

        <q-item-section
          side
          class="game-stats"
        >
          <div class="column items-end">
            <div class="text-h6 text-primary points-value">{{ game.points }}</div>
            <div class="text-caption correct-answers">
              {{ game.correctAnswers }}{{ TEXT_DE.correctSuffix }}
            </div>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<style scoped>
.history-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  padding: 8px 0;
}

.back-btn {
  margin-left: -8px;
}

.page-title {
  font-weight: 700;
  color: #424242;
}

.empty-state {
  margin-top: 100px;
}

.empty-icon {
  opacity: 0.5;
}

.empty-text {
  font-weight: 500;
}

.history-list {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.history-item {
  padding: 16px;
  transition: background-color 0.2s ease;
}

.history-item:hover {
  background-color: #f5f5f5;
}

.game-avatar {
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.3);
}

.game-date {
  font-size: 1rem;
  color: #212121;
}

.game-select {
  font-size: 0.85rem;
  color: #757575;
  margin-top: 4px;
}

.points-value {
  font-weight: 700;
  line-height: 1.2;
}

.correct-answers {
  color: #757575;
  margin-top: 4px;
}

/* iPhone 7 and small screens optimization */
@media (max-width: 599.98px) {
  .history-page {
    padding: 10px !important;
  }

  .page-header {
    margin-bottom: 12px;
    padding: 4px 0;
  }

  .page-title {
    font-size: 1.3rem;
  }

  .empty-state {
    margin-top: 80px;
  }

  .empty-icon {
    font-size: 64px !important;
  }

  .empty-text {
    font-size: 1rem;
  }

  .history-item {
    padding: 12px 8px;
  }

  .game-avatar {
    width: 42px !important;
    height: 42px !important;
  }

  .game-avatar .q-icon {
    font-size: 20px !important;
  }

  .game-date {
    font-size: 0.9rem;
  }

  .game-select {
    font-size: 0.75rem;
  }

  .points-value {
    font-size: 1.1rem;
  }

  .correct-answers {
    font-size: 0.7rem;
  }
}

/* Tablet and larger */
@media (min-width: 600px) {
  .history-item {
    padding: 18px 20px;
  }

  .game-avatar {
    width: 52px !important;
    height: 52px !important;
  }
}
</style>
