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
  <q-page class="q-pa-md page-container">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-btn
        flat
        round
        icon="arrow_back"
        @click="goHome"
        size="md"
      />
      <div class="text-h5 q-ml-sm">Statistiken</div>
    </div>

    <!-- Empty State -->
    <div
      v-if="cards.length === 0"
      class="text-center q-mt-xl"
    >
      <q-icon
        name="bar_chart"
        size="80px"
        color="grey-5"
      />
      <div class="text-h6 text-grey-6 q-mt-md">Keine Kartendaten verfügbar</div>
    </div>

    <!-- Content -->
    <div
      v-else
      class="stats-content"
    >
      <!-- Level Distribution -->
      <q-card class="q-mb-md level-card">
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">
              <q-icon
                name="layers"
                class="q-mr-xs"
              />
              Karten pro Level
            </div>
            <q-btn
              flat
              dense
              color="negative"
              icon="refresh"
              label="Zurücksetzen"
              size="sm"
              @click="resetCards"
            />
          </div>

          <div class="row q-col-gutter-sm level-stats">
            <div
              v-for="level in [1, 2, 3, 4, 5]"
              :key="level"
              class="col"
            >
              <q-card
                flat
                class="level-badge"
                :style="{ backgroundColor: getLevelBackgroundColor(level) }"
              >
                <q-card-section class="text-center q-pa-sm">
                  <div class="text-caption text-grey-8">Level {{ level }}</div>
                  <div class="text-h5 text-weight-bold text-grey-9">
                    {{ getCardCountByLevel(level) }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Cards Grid -->
      <q-card class="grid-card">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon
              name="grid_on"
              class="q-mr-xs"
            />
            Karten-Übersicht
          </div>

          <div class="cards-grid-container">
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
                    <div class="cell-question">{{ y }}x{{ x }}</div>
                    <div class="cell-answer">{{ y * x }}</div>
                    <div class="cell-stats">
                      <span>L{{ getCard(y, x)?.level || 1 }}</span>
                      <span class="q-ml-xs">{{ getCard(y, x)?.time.toFixed(1) || 60 }}s</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Legend -->
          <q-separator class="q-my-md" />
          <div class="legend">
            <div class="text-subtitle2 q-mb-sm text-grey-8">
              <q-icon
                name="info_outline"
                size="18px"
                class="q-mr-xs"
              />
              Legende
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-chip
                  dense
                  square
                  class="legend-chip"
                >
                  <q-icon
                    name="palette"
                    size="16px"
                    class="q-mr-xs"
                  />
                  <span class="text-caption">Hintergrund: Level (Rot=1 → Grün=5)</span>
                </q-chip>
              </div>
              <div class="col-12 col-sm-6">
                <q-chip
                  dense
                  square
                  class="legend-chip"
                >
                  <q-icon
                    name="schedule"
                    size="16px"
                    class="q-mr-xs"
                  />
                  <span class="text-caption">Schriftfarbe: Zeit (Grün=schnell → Rot=langsam)</span>
                </q-chip>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- PWA Installation Info -->
      <q-card class="q-mt-md pwa-info-card">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <q-icon
              name="install_mobile"
              size="24px"
              color="primary"
              class="q-mr-sm"
            />
            <div class="text-subtitle1 text-weight-medium">Als App installieren</div>
          </div>
          <div class="pwa-instructions">
            <div class="q-mb-xs">
              <q-icon
                name="smartphone"
                size="16px"
                color="positive"
                class="q-mr-xs"
              />
              <strong>Android:</strong> Menü (3 Punkte) → "Zum Startbildschirm hinzufügen"
            </div>
            <div>
              <q-icon
                name="phone_iphone"
                size="16px"
                color="primary"
                class="q-mr-xs"
              />
              <strong>iPhone:</strong> Teilen-Symbol → "Zum Home-Bildschirm"
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-content {
  animation: fadeIn 0.3s ease-in;
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

/* Level Distribution Card */
.level-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.level-stats {
  margin: 0 -4px;
}

.level-badge {
  border-radius: 8px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.level-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Grid Card */
.grid-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.cards-grid-container {
  overflow-x: auto;
  margin: 0 -8px;
  padding: 0 8px;
}

.cards-grid {
  display: grid;
  grid-template-columns: 40px repeat(7, 1fr);
  gap: 6px;
  min-width: 500px;
}

.grid-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  font-size: 0.875rem;
  color: #616161;
}

.grid-cell {
  aspect-ratio: 1;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  min-height: 70px;
  cursor: default;
}

.grid-cell:not(.disabled) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.grid-cell:not(.disabled):hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1;
  border-color: rgba(0, 0, 0, 0.3);
}

.grid-cell.disabled {
  background-color: #fafafa;
  border-color: #f0f0f0;
  opacity: 0.5;
}

.cell-content {
  text-align: center;
  padding: 6px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cell-question {
  font-size: 0.65rem;
  font-weight: 500;
  opacity: 0.85;
  line-height: 1;
}

.cell-answer {
  font-weight: 700;
  font-size: 1.1rem;
  line-height: 1.2;
  margin: 2px 0;
}

.cell-stats {
  font-size: 0.65rem;
  font-weight: 500;
  opacity: 0.9;
  line-height: 1;
  margin-top: 2px;
}

/* Legend */
.legend {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.legend-chip {
  width: 100%;
  justify-content: flex-start;
  background-color: white;
  border: 1px solid #e0e0e0;
}

/* PWA Info Card */
.pwa-info-card {
  border-radius: 12px;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border: 2px solid #bbdefb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.pwa-instructions {
  font-size: 0.875rem;
  line-height: 1.6;
  color: #424242;
}

/* Mobile Responsive */
@media (max-width: 599.98px) {
  .page-container {
    padding: 8px !important;
  }

  .cards-grid {
    gap: 4px;
    grid-template-columns: 30px repeat(7, 1fr);
    min-width: 450px;
  }

  .grid-header {
    padding: 4px;
    font-size: 0.75rem;
  }

  .grid-cell {
    min-height: 60px;
    border-width: 1.5px;
    border-radius: 6px;
  }

  .cell-question {
    font-size: 0.6rem;
  }

  .cell-answer {
    font-size: 0.95rem;
  }

  .cell-stats {
    font-size: 0.6rem;
  }

  .legend-chip {
    font-size: 0.7rem;
  }

  .pwa-instructions {
    font-size: 0.8rem;
  }
}

/* Tablet and larger */
@media (min-width: 600px) {
  .cards-grid {
    min-width: 550px;
  }

  .grid-cell {
    min-height: 85px;
  }
}

/* Large screens */
@media (min-width: 1024px) {
  .cards-grid {
    gap: 8px;
    min-width: 650px;
  }

  .grid-cell {
    min-height: 95px;
  }

  .cell-answer {
    font-size: 1.25rem;
  }
}
</style>
