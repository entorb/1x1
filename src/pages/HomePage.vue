<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storage'
import type { FocusType, Statistics } from '@/types'

const router = useRouter()

const statistics = ref<Statistics>({
  gamesPlayed: 0,
  totalPoints: 0,
  totalCorrectAnswers: 0
})

const filter = ref<number[]>([3, 4, 5, 6, 7, 8, 9])
const focus = ref<FocusType>('weak')

onMounted(() => {
  statistics.value = StorageService.getStatistics()
  // Initialize cards if not already done
  StorageService.getCards()
})

function toggleFilter(num: number) {
  const index = filter.value.indexOf(num)
  if (index === -1) {
    filter.value.push(num)
  } else {
    filter.value.splice(index, 1)
  }
}

function selectAllFilters() {
  filter.value = [3, 4, 5, 6, 7, 8, 9]
}

function startGame() {
  router.push({
    name: '/game',
    query: {
      filter: filter.value.join(','),
      focus: focus.value
    }
  })
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

    <!-- Statistics -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-sm">
          <q-icon name="bar_chart" />
          Statistik
        </div>
        <div class="row q-gutter-md">
          <div class="col">
            <div class="text-caption">Spiele gespielt</div>
            <div class="text-h5">{{ statistics.gamesPlayed }}</div>
          </div>
          <div class="col">
            <div class="text-caption">Gesamtpunkte</div>
            <div class="text-h5">{{ statistics.totalPoints }}</div>
          </div>
          <div class="col">
            <div class="text-caption">Richtige Antworten</div>
            <div class="text-h5">{{ statistics.totalCorrectAnswers }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

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
          <div class="row q-gutter-sm q-mb-sm">
            <q-btn
              v-for="num in [3, 4, 5, 6, 7, 8, 9]"
              :key="num"
              :label="num.toString()"
              :color="filter.includes(num) ? 'primary' : 'grey'"
              @click="toggleFilter(num)"
              size="md"
              style="min-width: 50px"
            />
          </div>
          <q-btn
            label="Alle auswählen"
            color="secondary"
            @click="selectAllFilters"
            icon="select_all"
            size="sm"
          />
        </div>

        <!-- Focus Selection -->
        <div>
          <div class="text-subtitle2 q-mb-sm">Fokus</div>
          <q-btn-toggle
            v-model="focus"
            :options="[
              { label: 'Schwache', value: 'weak', icon: 'school' },
              { label: 'Starke', value: 'strong', icon: 'star' },
              { label: 'Langsame', value: 'slow', icon: 'schedule' }
            ]"
            color="primary"
            toggle-color="primary"
          />
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
