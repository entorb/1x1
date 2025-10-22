<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storage'
import type { FocusType, Statistics } from '@/types'
import GroundhogMascot from '@/components/GroundhogMascot.vue'
import { SELECT_OPTIONS, DEFAULT_SELECT, FOCUS_OPTIONS } from '@/config/constants'

const router = useRouter()

const statistics = ref<Statistics>({
  gamesPlayed: 0,
  totalPoints: 0,
  totalCorrectAnswers: 0
})

const select = ref<number[]>(DEFAULT_SELECT)
const focus = ref<FocusType>('weak')
const selectOptions = SELECT_OPTIONS
const focusOptions = FOCUS_OPTIONS

onMounted(() => {
  statistics.value = StorageService.getStatistics()
  // Initialize cards if not already done and verify all cards exist
  StorageService.getCards()
  StorageService.verifyAndFixCards()

  // Restore select and focus from session storage
  const savedConfig = StorageService.getGameConfig()
  if (savedConfig) {
    select.value = savedConfig.select
    focus.value = savedConfig.focus
  }
})

// Watch for changes and save to session storage
watch(
  [select, focus],
  () => {
    StorageService.setGameConfig({
      select: select.value,
      focus: focus.value
    })
  },
  { deep: true }
)

function startGame() {
  // Save game config to session storage
  StorageService.setGameConfig({
    select: select.value,
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

function toggleSelect(option: number) {
  const allSelected = selectOptions.every(opt => select.value.includes(opt))

  if (allSelected && select.value.length > 1) {
    // If all are selected and clicking one number, select only that number
    select.value = [option]
  } else if (select.value.includes(option)) {
    // If already selected, select all
    select.value = [...selectOptions]
  } else {
    // Not selected, add it
    select.value = [...select.value, option].sort()
  }
}
</script>

<template>
  <q-page class="q-pa-md page-container">
    <div class="text-h5 text-center q-mb-md">Vyvit's 1x1</div>

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
          <q-card-section class="stats-section">
            <div class="row text-center q-gutter-sm justify-around">
              <div class="col-3">
                <div class="text-caption">Spiele</div>
                <div class="text-h6">{{ statistics.gamesPlayed }}</div>
              </div>
              <div class="col-3">
                <div class="text-caption">Punkte</div>
                <div class="text-h6">{{ statistics.totalPoints }}</div>
              </div>
              <div class="col-4">
                <div class="text-caption">Richtige</div>
                <div class="text-h6">{{ statistics.totalCorrectAnswers }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Game Configuration -->
    <q-card class="q-mb-md">
      <q-card-section class="config-section">
        <div class="text-subtitle1 q-mb-sm">
          <q-icon name="settings" />
          Einstellungen
        </div>

        <!-- Select Rows -->
        <div class="q-mb-sm">
          <div class="text-subtitle2 q-mb-xs">Auswahl</div>
          <div class="row q-gutter-xs number-buttons">
            <q-btn
              v-for="option in selectOptions"
              :key="option"
              :outline="!select.includes(option)"
              :unelevated="select.includes(option)"
              :color="select.includes(option) ? 'primary' : 'grey-5'"
              size="md"
              class="col"
              @click="toggleSelect(option)"
            >
              <div class="text-body1">{{ option }}</div>
            </q-btn>
          </div>
        </div>

        <!-- Focus Selection -->
        <div>
          <div class="text-subtitle2 q-mb-xs">Fokus</div>
          <q-select
            v-model="focus"
            :options="focusOptions"
            outlined
            dense
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
      size="lg"
      class="full-width q-mb-sm"
      @click="startGame"
      :disable="select.length === 0"
      icon="play_arrow"
    >
      <span class="text-body1">Spiel starten</span>
    </q-btn>

    <!-- Navigation Buttons -->
    <div class="row q-gutter-sm">
      <q-btn
        unelevated
        color="primary"
        size="md"
        class="col"
        @click="goToStats"
        icon="bar_chart"
        label="Statistiken"
      />
      <q-btn
        unelevated
        color="primary"
        size="md"
        class="col"
        @click="goToHistory"
        icon="history"
        label="Spielverlauf"
      />
    </div>
  </q-page>
</template>

<style scoped>
.page-container {
  max-width: 100%;
  overflow-y: auto;
  padding: 12px;
}

.mascot {
  width: 100px;
  height: 100px;
}

.speech-bubble {
  position: relative;
  border-radius: 12px;
  --bubble-border-color: rgba(0, 0, 0, 0.12);
  border-color: var(--bubble-border-color);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.speech-bubble::before,
.speech-bubble::after {
  content: '';
  position: absolute;
  border-style: solid;
}

.stats-section {
  padding: 10px 12px;
}

.config-section {
  padding: 14px;
}

.number-buttons {
  min-height: 48px;
}

.number-buttons .col {
  min-width: 44px;
}

/* Small screens (iPhone 7: 375px × 667px) */
@media (max-width: 599.98px) {
  .page-container {
    padding: 10px !important;
  }

  .mascot-container {
    flex-direction: column;
    margin-bottom: 12px;
  }

  .mascot {
    margin-bottom: 8px;
  }

  .speech-bubble {
    width: 100%;
  }

  /* Arrow Border */
  .speech-bubble::before {
    top: -18px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 9px;
    border-color: transparent transparent var(--bubble-border-color) transparent;
  }

  /* Arrow Fill */
  .speech-bubble::after {
    top: -16px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 8px;
    border-color: transparent transparent white transparent;
  }

  .stats-section {
    padding: 8px 10px;
  }

  .stats-section .text-h6 {
    font-size: 1.1rem;
  }

  .stats-section .text-caption {
    font-size: 0.7rem;
  }

  .config-section {
    padding: 12px;
  }

  .number-buttons {
    margin: 0 -2px;
  }

  .number-buttons .col {
    padding: 0 2px;
  }
}

/* Larger screens */
@media (min-width: 600px) {
  .mascot {
    width: 130px;
    height: 130px;
  }

  .speech-bubble {
    margin-left: 15px;
  }

  /* Arrow Border */
  .speech-bubble::before {
    left: -18px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 9px;
    border-color: transparent var(--bubble-border-color) transparent transparent;
  }

  /* Arrow Fill */
  .speech-bubble::after {
    left: -16px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 8px;
    border-color: transparent white transparent transparent;
  }
}
</style>
