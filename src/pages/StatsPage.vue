<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { StorageService } from '@/services/storage'
import type { Card } from '@/types'

const router = useRouter()
const $q = useQuasar()
const cards = ref<Card[]>([])

const minTime = computed(() => {
  if (cards.value.length === 0) return 0.1
  return Math.max(0.1, Math.min(...cards.value.map(c => c.time)))
})
const maxTime = computed(() => {
  if (cards.value.length === 0) return 60
  return Math.min(60, Math.max(...cards.value.map(c => c.time)))
})

onMounted(() => {
  cards.value = StorageService.getCards()
})

function getCardCountByLevel(level: number): number {
  return cards.value.filter(card => card.level === level).length
}

function getCard(y: number, x: number): Card | undefined {
  return cards.value.find(card => card.question === `${y}x${x}`)
}

function getLevelBackgroundColor(level: number): string {
  // Red (level 1) to Green (level 5)
  const colors = [
    '#ffcdd2', // red-100
    '#ffe0b2', // orange-100
    '#fff9c4', // yellow-100
    '#dcedc8', // light-green-100
    '#c8e6c9' // green-100
  ]
  return colors[level - 1] || '#f5f5f5'
}

function getTimeTextColor(time: number): string {
  if (cards.value.length === 0) return '#666666'

  const min = minTime.value
  const max = maxTime.value
  const range = max - min

  if (range === 0) return '#2e7d32' // green-800

  const normalized = (time - min) / range

  // Green (fast) to Red (slow)
  if (normalized < 0.2) return '#2e7d32' // green-800
  if (normalized < 0.4) return '#558b2f' // light-green-800
  if (normalized < 0.6) return '#f57f17' // yellow-800
  if (normalized < 0.8) return '#e65100' // orange-900
  return '#c62828' // red-800
}

function getCellStyle(y: number, x: number): Record<string, string> {
  if (y > x) {
    return {
      backgroundColor: '#f5f5f5'
    }
  }

  const card = getCard(y, x)
  if (!card) {
    return {
      backgroundColor: '#f5f5f5',
      color: '#666666'
    }
  }

  return {
    backgroundColor: getLevelBackgroundColor(card.level),
    color: getTimeTextColor(card.time)
  }
}

function resetCards() {
  $q.dialog({
    title: 'Karten zurücksetzen',
    message: 'Möchten Sie alle Karten auf Level 1 und Zeit 60s zurücksetzen?',
    cancel: {
      label: 'Abbrechen',
      flat: true
    },
    ok: {
      label: 'Zurücksetzen',
      color: 'negative'
    },
    persistent: true
  }).onOk(() => {
    StorageService.resetCards()
    cards.value = StorageService.getCards()
    $q.notify({
      type: 'positive',
      message: 'Alle Karten wurden zurückgesetzt',
      position: 'top'
    })
  })
}

function goHome() {
  router.push({ name: '/' })
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <q-btn
          flat
          icon="arrow_back"
          @click="goHome"
        />
        <div class="text-h5 q-ml-md">Statistiken</div>
      </div>
    </div>

    <div
      v-if="cards.length === 0"
      class="text-center q-mt-xl"
    >
      <q-icon
        name="bar_chart"
        size="80px"
        color="grey"
      />
      <div class="text-h6 text-grey q-mt-md">Keine Kartendaten verfügbar</div>
    </div>

    <div v-else>
      <!-- Level Distribution -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="layers" />
            Karten pro Level
          </div>
          <div class="row q-gutter-md">
            <div
              v-for="level in [1, 2, 3, 4, 5]"
              :key="level"
              class="col"
            >
              <div class="text-center">
                <div class="text-caption">Level {{ level }}</div>
                <div class="text-h4 text-primary">
                  {{ getCardCountByLevel(level) }}
                </div>
              </div>
            </div>
          </div>
          <q-btn
            flat
            color="negative"
            icon="refresh"
            label="Zurücksetzen"
            @click="resetCards"
          />
        </q-card-section>
      </q-card>

      <!-- Cards Grid -->
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="grid_on" />
            Karten-Übersicht
          </div>

          <div class="cards-grid">
            <!-- Header row with X values -->
            <div class="grid-header"></div>
            <div
              v-for="x in [3, 4, 5, 6, 7, 8, 9]"
              :key="`header-${x}`"
              class="grid-header text-center text-weight-bold"
            >
              {{ x }}
            </div>

            <!-- Rows for each Y value -->
            <template
              v-for="y in [3, 4, 5, 6, 7, 8, 9]"
              :key="`row-${y}`"
            >
              <!-- Y label -->
              <div class="grid-header text-center text-weight-bold">{{ y }}</div>

              <!-- Cells for each X value -->
              <div
                v-for="x in [3, 4, 5, 6, 7, 8, 9]"
                :key="`cell-${y}-${x}`"
                class="grid-cell"
                :class="{ disabled: y > x }"
                :style="getCellStyle(y, x)"
              >
                <div
                  v-if="y <= x"
                  class="cell-content"
                >
                  <div class="text-caption">{{ y }}x{{ x }}</div>
                  <div class="text-body2">{{ y * x }}</div>
                  <div class="text-caption">L{{ getCard(y, x)?.level || 1 }}</div>
                  <div class="text-caption">{{ getCard(y, x)?.time.toFixed(1) || 60 }}s</div>
                </div>
              </div>
            </template>
          </div>

          <!-- Legend -->
          <div class="q-mt-md">
            <div class="text-subtitle2 q-mb-sm">Legende:</div>
            <div class="row q-gutter-sm">
              <div class="text-caption"><strong>Hintergrund:</strong> Level (Rot=1 → Grün=5)</div>
              <div class="text-caption">
                <strong>Schriftfarbe:</strong> Zeit (Grün=schnell → Rot=langsam)
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: 40px repeat(7, 1fr);
  gap: 4px;
}

.grid-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  font-size: 0.875rem;
}

.grid-cell {
  aspect-ratio: 1;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  min-height: 80px;
}

.grid-cell:not(.disabled):hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.grid-cell.disabled {
  background-color: #f5f5f5;
  border-color: #f5f5f5;
}

.cell-content {
  text-align: center;
  padding: 4px;
  width: 100%;
}

.cell-content .text-caption {
  font-size: 0.7rem;
  line-height: 1.2;
}

.cell-content .text-body2 {
  font-weight: 600;
  font-size: 1rem;
  margin: 2px 0;
}
</style>
