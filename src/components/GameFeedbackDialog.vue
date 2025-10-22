<script setup lang="ts">
import type { Card } from '@/types'

interface Props {
  show: boolean
  isCorrect: boolean
  currentCard: Card | undefined
  userAnswer: number | null
  lastPoints: number
  autoCloseCountdown: number
  isButtonDisabled: boolean
  buttonDisableCountdown: number
  isEnterDisabled: boolean
}

interface Emits {
  (e: 'continue'): void
  (e: 'handleEnter'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function handleContinue() {
  emit('continue')
}

function handleKeyup(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    emit('handleEnter')
  }
}
</script>

<template>
  <q-dialog
    :model-value="show"
    persistent
    @keyup="handleKeyup"
  >
    <q-card style="min-width: 350px">
      <q-card-section
        :class="[isCorrect ? 'bg-positive' : 'bg-negative']"
        class="text-white text-center q-pa-lg"
      >
        <q-icon
          :name="isCorrect ? 'check_circle' : 'cancel'"
          color="white"
          size="100px"
          class="q-mb-md"
        />
        <div class="text-h3 text-weight-bold q-mb-sm">
          {{ isCorrect ? 'Richtig!' : 'Falsch!' }}
        </div>
        <div
          v-if="isCorrect"
          class="text-h5 q-mt-md"
        >
          +{{ lastPoints }} Punkte
        </div>
      </q-card-section>

      <q-card-section
        v-if="!isCorrect"
        class="text-center q-pa-lg"
      >
        <div class="text-h4 q-mb-md text-grey-8">
          {{ currentCard?.question.replace('x', '×') }}
        </div>
        <div class="text-h5">
          <span
            class="text-negative text-weight-bold"
            style="text-decoration: line-through"
          >{{ userAnswer }}</span>
          <q-icon
            name="arrow_forward"
            size="sm"
            class="q-mx-sm"
          />
          <span class="text-positive text-weight-bold">{{ currentCard?.answer }}</span>
        </div>
      </q-card-section>

      <q-card-actions
        align="center"
        class="q-pa-md"
        :class="isCorrect ? 'bg-positive-1' : 'bg-negative-1'"
      >
        <q-btn
          :color="isCorrect ? 'positive' : 'negative'"
          :label="isButtonDisabled ? `Warte ${buttonDisableCountdown}s...` : 'Weiter (Enter)'"
          size="lg"
          unelevated
          class="full-width q-py-sm text-h6"
          autofocus
          :disable="isButtonDisabled || isEnterDisabled"
          @click="handleContinue"
        />
        <div
          v-if="autoCloseCountdown > 0"
          class="text-caption q-mt-sm text-grey-7 full-width text-center"
        >
          Automatisch weiter in {{ autoCloseCountdown }}s...
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
