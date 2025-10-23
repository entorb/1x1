<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storage'
import type { FocusType, Statistics, SelectionType } from '@/types'
import GroundhogMascot from '@/components/GroundhogMascot.vue'
import { SELECT_OPTIONS, DEFAULT_SELECT, FOCUS_OPTIONS } from '@/config/constants'
import { TEXT_DE } from '@/config/text-de'

const router = useRouter()

const statistics = ref<Statistics>({
  gamesPlayed: 0,
  totalPoints: 0,
  totalCorrectAnswers: 0
})

const select = ref<SelectionType>(DEFAULT_SELECT)
const focus = ref<FocusType>('weak')
const selectOptions = SELECT_OPTIONS
const focusOptions = FOCUS_OPTIONS

// Check if a number is selected
const isNumberSelected = computed(() => (num: number) => {
  if (typeof select.value === 'string') return false
  return select.value.includes(num)
})

// Check if x² is selected
const isSquaresSelected = computed(() => select.value === 'x²')

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
  // Convert string selections to array first
  if (typeof select.value === 'string') {
    select.value = [option]
    return
  }

  const allSelected = selectOptions.every(
    opt => Array.isArray(select.value) && select.value.includes(opt)
  )

  if (allSelected && Array.isArray(select.value) && select.value.length > 1) {
    // If all are selected and clicking one number, select only that number
    select.value = [option]
  } else if (Array.isArray(select.value) && select.value.includes(option)) {
    // If already selected, select all
    select.value = [...selectOptions]
  } else if (Array.isArray(select.value)) {
    // Not selected, add it
    select.value = [...select.value, option].sort()
  }
}

function toggleSquares() {
  if (select.value === 'x²') {
    // If x² is already selected, deselect and go to all
    select.value = [...selectOptions]
  } else {
    // Select x² mode
    select.value = 'x²'
  }
}
</script>

<template>
  <q-page class="q-pa-md page-container">
    <div class="text-h5 text-center q-mb-md">{{ TEXT_DE.appTitle }}</div>

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
                <div class="text-caption">{{ TEXT_DE.games }}</div>
                <div class="text-h6">{{ statistics.gamesPlayed }}</div>
              </div>
              <div class="col-3">
                <div class="text-caption">{{ TEXT_DE.points }}</div>
                <div class="text-h6">{{ statistics.totalPoints }}</div>
              </div>
              <div class="col-4">
                <div class="text-caption">{{ TEXT_DE.correct_plural }}</div>
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
          {{ TEXT_DE.settings }}
        </div>

        <!-- Select Rows -->
        <div class="q-mb-sm">
          <div class="text-subtitle2 q-mb-xs">{{ TEXT_DE.selection }}</div>
          <div class="row q-gutter-xs number-buttons">
            <q-btn
              v-for="option in selectOptions"
              :key="option"
              :outline="!isNumberSelected(option)"
              :unelevated="isNumberSelected(option)"
              :color="isNumberSelected(option) ? 'primary' : 'grey-5'"
              size="md"
              class="col"
              @click="toggleSelect(option)"
            >
              <div class="text-body1">{{ option }}</div>
            </q-btn>
            <q-btn
              :outline="!isSquaresSelected"
              :unelevated="isSquaresSelected"
              :color="isSquaresSelected ? 'secondary' : 'grey-5'"
              size="md"
              class="col squares-btn"
              @click="toggleSquares"
            >
              <div class="text-body1">{{ TEXT_DE.selectionSquares }}</div>
            </q-btn>
          </div>
        </div>

        <!-- Focus Selection -->
        <div>
          <div class="text-subtitle2 q-mb-xs">{{ TEXT_DE.focus }}</div>
          <q-select
            v-model="focus"
            :options="focusOptions"
            outlined
            dense
            emit-value
            map-options
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
      :disable="typeof select === 'object' && select.length === 0"
      icon="play_arrow"
    >
      <span class="text-body1">{{ TEXT_DE.start }}</span>
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
        :label="TEXT_DE.goToStats"
      />
      <q-btn
        unelevated
        color="primary"
        size="md"
        class="col"
        @click="goToHistory"
        icon="history"
        :label="TEXT_DE.goToHistory"
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
