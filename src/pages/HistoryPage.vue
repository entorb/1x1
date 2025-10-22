<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storage'
import type { GameHistory } from '@/types'

const router = useRouter()
const history = ref<GameHistory[]>([])

const sortedHistory = computed(() => {
  return [...history.value].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
})

onMounted(() => {
  history.value = StorageService.getHistory()
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

function goHome() {
  router.push({ name: '/' })
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn
        flat
        icon="arrow_back"
        @click="goHome"
      />
      <div class="text-h5 q-ml-md">Spielverlauf</div>
    </div>

    <div
      v-if="history.length === 0"
      class="text-center q-mt-xl"
    >
      <q-icon
        name="inbox"
        size="80px"
        color="grey"
      />
      <div class="text-h6 text-grey q-mt-md">Noch keine Spiele gespielt</div>
    </div>

    <q-list
      v-else
      separator
    >
      <q-item
        v-for="(game, index) in sortedHistory"
        :key="index"
        class="q-pa-md"
      >
        <q-item-section avatar>
          <q-avatar
            color="primary"
            text-color="white"
          >
            <q-icon name="emoji_events" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-bold">
            {{ formatDate(game.date) }}
          </q-item-label>
          <q-item-label caption> Auswahl: {{ game.select.join(', ') }} </q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="column items-end">
            <div class="text-h6 text-primary">{{ game.points }} Punkte</div>
            <div class="text-caption">{{ game.correctAnswers }} richtig</div>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>
