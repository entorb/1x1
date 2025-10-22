<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storage'
import type { FocusType, Statistics } from '@/types'
import GroundhogMascot from '@/components/GroundhogMascot.vue'

const router = useRouter()

const statistics = ref<Statistics>({
  gamesPlayed: 0,
  totalPoints: 0,
  totalCorrectAnswers: 0
})

const filter = ref<number[]>([3, 4, 5, 6, 7, 8, 9])
const focus = ref<FocusType>('weak')
const filterOptions = [3, 4, 5, 6, 7, 8, 9]
const focusOptions = [
  { label: 'Schwache', value: 'weak', icon: 'school' },
  { label: 'Starke', value: 'strong', icon: 'star' },
  { label: 'Langsame', value: 'slow', icon: 'schedule' }
]

onMounted(() => {
  statistics.value = StorageService.getStatistics()
  // Initialize cards if not already done
  StorageService.getCards()
})

function startGame() {
  // Save game config to session storage
  StorageService.setGameConfig({
    filter: filter.value,
    focus: focus.value
  })

  // Navigate to game page without query parameters
  router.push({ name: '/game' })
}

function goToHistory() {
  router.push({ name: '/history' })
}

function goToStats() {
  router.push({ name: '/stats' })
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-h4 text-center q-mb-md">1x1 Trainer</div>

    <!-- Mascot and Statistics -->
    <div class="row items-center justify-center q-mb-md mascot-container">
      <div class="col-12 col-sm-auto text-center">
        <GroundhogMascot class="mascot" />
      </div>
      <div class="col-12 col-sm">
        <q-card
          class="speech-bubble"
          flat
          bordered
        >
          <q-card-section>
            <div class="row text-center q-gutter-sm justify-around">
              <div class="col-3">
                <div class="text-caption">Spiele</div>
                <div class="text-h5">{{ statistics.gamesPlayed }}</div>
              </div>
              <div class="col-3">
                <div class="text-caption">Punkte</div>
                <div class="text-h5">{{ statistics.totalPoints }}</div>
              </div>
              <div class="col-4">
                <div class="text-caption">Richtige</div>
                <div class="text-h5">{{ statistics.totalCorrectAnswers }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Game Configuration -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-sm">
          <q-icon name="settings" />
          Einstellungen
        </div>

        <!-- Filter Selection -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Filter (Welche Reihen?)</div>
          <q-select
            v-model="filter"
            :options="filterOptions"
            multiple
            outlined
            use-chips
            label="Reihen auswählen"
            options-selected-class="text-primary"
          />
        </div>

        <!-- Focus Selection -->
        <div>
          <div class="text-subtitle2 q-mb-sm">Fokus</div>
          <q-select
            v-model="focus"
            :options="focusOptions"
            outlined
            emit-value
            map-options
            label="Fokus auswählen"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon :name="scope.opt.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
      </q-card-section>
    </q-card>

    <!-- Start Game Button -->
    <q-btn
      color="positive"
      size="xl"
      class="full-width"
      @click="startGame"
      :disable="filter.length === 0"
      icon="play_arrow"
    >
      <span class="text-h6">Spiel starten</span>
    </q-btn>

    <!-- Navigation Buttons -->
    <div class="row q-gutter-sm q-mt-sm">
      <q-btn
        flat
        color="primary"
        class="col"
        @click="goToHistory"
        icon="history"
        label="Spielverlauf"
      />
      <q-btn
        flat
        color="primary"
        class="col"
        @click="goToStats"
        icon="bar_chart"
        label="Statistiken"
      />
    </div>
  </q-page>
</template>

<style scoped>
.mascot {
  width: 120px;
  height: 120px;
}

.speech-bubble {
  position: relative;
  border-radius: 16px;
  /* Using a variable for the border color for consistency */
  --bubble-border-color: rgba(0, 0, 0, 0.12);
  border-color: var(--bubble-border-color);
}

.speech-bubble::before,
.speech-bubble::after {
  content: '';
  position: absolute;
  border-style: solid;
}

/* Small screens (mobile-first) */
@media (max-width: 599.98px) {
  .mascot-container {
    flex-direction: column;
  }
  .mascot {
    margin-bottom: 10px;
  }
  .speech-bubble {
    width: 100%;
  }
  /* Arrow Border */
  .speech-bubble::before {
    top: -22px; /* 10px arrow + 1px border * 2 ? No, just border-width */
    left: 50%;
    transform: translateX(-50%);
    border-width: 11px; /* Larger for the border effect */
    border-color: transparent transparent var(--bubble-border-color) transparent;
  }
  /* Arrow Fill */
  .speech-bubble::after {
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 10px;
    border-color: transparent transparent white transparent;
  }
}

/* Larger screens */
@media (min-width: 600px) {
  .mascot {
    width: 150px;
    height: 150px;
  }
  .speech-bubble {
    margin-left: 20px;
  }
  /* Arrow Border */
  .speech-bubble::before {
    left: -22px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 11px;
    border-color: transparent var(--bubble-border-color) transparent transparent;
  }
  /* Arrow Fill */
  .speech-bubble::after {
    left: -20px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 10px;
    border-color: transparent white transparent transparent;
  }
}
</style>
