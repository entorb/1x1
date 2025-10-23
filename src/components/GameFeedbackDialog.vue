<script setup lang="ts">
import type { Card } from '@/types'
import { TEXT } from '@/config/constants'

interface Props {
  show: boolean
  isCorrect: boolean
  currentCard: Card | undefined
  userAnswer: number | null
  lastPoints: number
  basePoints: number
  levelBonus: number
  speedBonus: number
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
    class="feedback-dialog"
  >
    <q-card class="feedback-card">
      <q-card-section
        :class="[isCorrect ? 'bg-positive' : 'bg-negative']"
        class="text-white text-center header-section"
      >
        <q-icon
          :name="isCorrect ? 'check_circle' : 'cancel'"
          color="white"
          size="100px"
          class="q-mb-md feedback-icon"
        />
        <div class="text-h3 text-weight-bold q-mb-sm feedback-title">
          {{ isCorrect ? TEXT.correct : TEXT.wrong }}
        </div>
        <div
          v-if="isCorrect"
          class="q-mt-md"
        >
          <div class="text-h5 points-display">+{{ lastPoints }} Punkte</div>
          <div class="text-caption q-mt-xs points-calculation">
            <span v-if="speedBonus > 0">
              {{ basePoints }} + {{ levelBonus }} + {{ speedBonus }} = {{ lastPoints }}
            </span>
            <span v-else> {{ basePoints }} + {{ levelBonus }} = {{ lastPoints }} </span>
          </div>
        </div>
      </q-card-section>

      <q-card-section
        v-if="!isCorrect"
        class="text-center answer-section"
      >
        <div class="text-h4 q-mb-md text-grey-8 question-display">
          {{ currentCard?.question.replace('x', '×') }}
        </div>
        <div class="text-h5 answer-comparison">
          <span class="text-negative text-weight-bold wrong-answer">{{ userAnswer }}</span>
          <q-icon
            name="arrow_forward"
            size="sm"
            class="q-mx-sm arrow-icon"
          />
          <span class="text-positive text-weight-bold correct-answer">{{
            currentCard?.answer
          }}</span>
        </div>
      </q-card-section>

      <q-card-actions
        align="center"
        class="action-section"
        :class="isCorrect ? 'bg-positive-1' : 'bg-negative-1'"
      >
        <q-btn
          :color="isCorrect ? 'positive' : 'negative'"
          :label="isButtonDisabled ? `${TEXT.wait} ${buttonDisableCountdown}s...` : TEXT.continue"
          size="lg"
          unelevated
          class="full-width continue-btn"
          autofocus
          :disable="isButtonDisabled || isEnterDisabled"
          @click="handleContinue"
        />
        <div
          v-if="autoCloseCountdown > 0"
          class="text-caption q-mt-sm text-grey-7 full-width text-center auto-close-text"
        >
          {{ TEXT.autoCloseIn }} {{ autoCloseCountdown }}s...
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.feedback-card {
  min-width: 350px;
  border-radius: 16px;
  overflow: hidden;
}

.header-section {
  padding: 32px 24px;
}

.feedback-icon {
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.feedback-title {
  font-size: 2.5rem;
}

.points-display {
  font-weight: 700;
}

.points-calculation {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
  font-weight: 500;
}

.answer-section {
  padding: 28px 24px;
}

.question-display {
  font-weight: 600;
}

.answer-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wrong-answer {
  text-decoration: line-through;
  text-decoration-thickness: 3px;
}

.correct-answer {
  font-size: 1.8rem;
}

.action-section {
  padding: 20px;
}

.continue-btn {
  height: 56px;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
}

.auto-close-text {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* iPhone 7 and small screens optimization */
@media (max-width: 599.98px) {
  .feedback-card {
    min-width: 320px;
    max-width: 90vw;
  }

  .header-section {
    padding: 24px 20px;
  }

  .feedback-icon {
    font-size: 80px !important;
  }

  .feedback-title {
    font-size: 2rem;
  }

  .points-display {
    font-size: 1.25rem;
  }

  .points-calculation {
    font-size: 0.75rem;
  }

  .answer-section {
    padding: 20px 16px;
  }

  .question-display {
    font-size: 1.5rem;
  }

  .answer-comparison {
    font-size: 1.25rem;
  }

  .correct-answer {
    font-size: 1.5rem;
  }

  .action-section {
    padding: 16px;
  }

  .continue-btn {
    height: 52px;
    font-size: 1rem;
  }

  .auto-close-text {
    font-size: 0.7rem;
  }
}
</style>
