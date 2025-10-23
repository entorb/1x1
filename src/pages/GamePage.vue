<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storage'
import GameFeedbackDialog from '@/components/GameFeedbackDialog.vue'
import type { Card, FocusType } from '@/types'
import {
  AUTO_SUBMIT_DIGITS,
  AUTO_CLOSE_DURATION,
  BUTTON_DISABLE_DURATION,
  MIN_CARD_LEVEL,
  MAX_CARD_LEVEL,
  MAX_CARD_TIME,
  SPEED_BONUS_POINTS,
  MAX_CARDS_PER_GAME,
  TIME_TRACKING_INTERVAL,
  PROGRESS_BAR_MAX_RATIO,
  COUNTDOWN_INTERVAL
} from '@/config/constants'
import { TEXT_DE } from '@/config/text-de'

const router = useRouter()

const gameStarted = ref(false)
const gameCards = ref<Card[]>([])
const currentCardIndex = ref(0)
const currentPoints = ref(0)
const correctAnswers = ref(0)
const userAnswer = ref<number | null>(null)
const showFeedback = ref(false)
const isCorrect = ref(false)
const lastPoints = ref(0)
const basePoints = ref(0)
const levelBonus = ref(0)
const speedBonus = ref(0)
const answerStartTime = ref(0)
const answerInput = ref()
const autoCloseCountdown = ref(0)
const elapsedTime = ref(0)
const timeProgress = ref(0)
const isButtonDisabled = ref(false)
const buttonDisableCountdown = ref(0)
const timeTaken = ref(0)
const isEnterDisabled = ref(false)
let autoCloseTimer: ReturnType<typeof setTimeout> | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null
let timeTrackingInterval: ReturnType<typeof setInterval> | null = null
let buttonDisableTimer: ReturnType<typeof setTimeout> | null = null
let buttonDisableCountdownInterval: ReturnType<typeof setInterval> | null = null
let enterDisableTimer: ReturnType<typeof setTimeout> | null = null

const currentCard = computed(() => gameCards.value[currentCardIndex.value])

const displayQuestion = computed(() => {
  if (!currentCard.value) return ''
  return currentCard.value.question.replace('x', '\u00d7')
})

// Auto-submit after configured digit count
watch(userAnswer, newValue => {
  if (newValue !== null && newValue !== undefined && !showFeedback.value) {
    const valueStr = String(newValue)
    if (valueStr.length >= AUTO_SUBMIT_DIGITS) {
      submitAnswer()
    }
  }
})

function clearAllTimers() {
  if (timeTrackingInterval) clearInterval(timeTrackingInterval)
  if (buttonDisableTimer) clearTimeout(buttonDisableTimer)
  if (buttonDisableCountdownInterval) clearInterval(buttonDisableCountdownInterval)
  if (enterDisableTimer) clearTimeout(enterDisableTimer)
  if (autoCloseTimer) clearTimeout(autoCloseTimer)
  if (countdownInterval) clearInterval(countdownInterval)
}

onMounted(() => {
  initializeGame()
})

onUnmounted(() => {
  clearAllTimers()
})

function initializeGame() {
  // Read game config from session storage
  const config = StorageService.getGameConfig()

  if (!config) {
    // No config found, redirect to home
    router.push({ name: '/' })
    return
  }

  const allCards = StorageService.getCards()
  let selectedCards: Card[]

  if (config.select === 'x²') {
    // Select only square cards (3x3, 4x4, ..., 9x9)
    selectedCards = allCards.filter(card => {
      const [x, y] = card.question.split('x').map(Number)
      return x === y
    })
  } else if (config.select === 'alle') {
    // Select all cards
    selectedCards = allCards
  } else {
    // Select cards based on number array
    const selectArray = Array.isArray(config.select) ? config.select : []
    selectedCards = allCards.filter(card => {
      const [x, y] = card.question.split('x').map(Number)
      return selectArray.includes(x) || selectArray.includes(y)
    })
  }

  // Select cards based on focus
  const pickedCards = selectCards(selectedCards, config.focus, MAX_CARDS_PER_GAME)

  gameCards.value = pickedCards
  gameStarted.value = true

  answerStartTime.value = Date.now()
  startTimeTracking()
}

function selectCards(cards: Card[], focus: FocusType, count: number): Card[] {
  // Make copies to avoid mutating the input arrays
  const cardsCopy = [...cards]
  const weights = cardsCopy.map(card => {
    if (focus === 'weak') {
      // Level 1=highest weight, Level 5=lowest weight
      return MAX_CARD_LEVEL + 1 - card.level
    } else if (focus === 'strong') {
      // Level 5=highest weight, Level 1=lowest weight
      return card.level
    } else {
      // slow: prioritize cards with higher time (slower)
      return card.time
    }
  })

  const selected: Card[] = []
  // IMPORTANT: Calculate loop count ONCE - don't use cardsCopy.length in condition
  // because it changes as we splice!
  const loopCount = Math.min(count, cardsCopy.length)

  for (let i = 0; i < loopCount; i++) {
    // Recalculate totalWeight each iteration since we're removing weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let random = Math.random() * totalWeight
    let selectedIndex = 0

    for (let j = 0; j < weights.length; j++) {
      random -= weights[j]
      if (random <= 0) {
        selectedIndex = j
        break
      }
    }

    selected.push({ ...cardsCopy[selectedIndex] })
    // Remove selected card and its weight
    cardsCopy.splice(selectedIndex, 1)
    weights.splice(selectedIndex, 1)
  }

  return selected
}

function startTimeTracking() {
  elapsedTime.value = 0
  timeProgress.value = 0
  if (timeTrackingInterval) clearInterval(timeTrackingInterval)

  timeTrackingInterval = setInterval(() => {
    elapsedTime.value = (Date.now() - answerStartTime.value) / 1000
    if (currentCard.value) {
      const cappedTime = Math.min(currentCard.value.time, MAX_CARD_TIME)
      timeProgress.value = Math.min(elapsedTime.value / cappedTime, PROGRESS_BAR_MAX_RATIO)
    }
  }, TIME_TRACKING_INTERVAL)
}

function stopTimeTracking() {
  if (timeTrackingInterval) {
    clearInterval(timeTrackingInterval)
    timeTrackingInterval = null
  }
}

function startButtonDisableTimer() {
  isButtonDisabled.value = true
  buttonDisableCountdown.value = BUTTON_DISABLE_DURATION / 1000

  buttonDisableCountdownInterval = setInterval(() => {
    buttonDisableCountdown.value--
    if (buttonDisableCountdown.value <= 0) {
      clearInterval(buttonDisableCountdownInterval!)
    }
  }, COUNTDOWN_INTERVAL)

  buttonDisableTimer = setTimeout(() => {
    isButtonDisabled.value = false
    buttonDisableCountdown.value = 0
  }, BUTTON_DISABLE_DURATION)
}

function clearButtonDisableTimers() {
  if (buttonDisableTimer) {
    clearTimeout(buttonDisableTimer)
    buttonDisableTimer = null
  }
  if (buttonDisableCountdownInterval) {
    clearInterval(buttonDisableCountdownInterval)
    buttonDisableCountdownInterval = null
  }
  if (enterDisableTimer) {
    clearTimeout(enterDisableTimer)
    enterDisableTimer = null
  }
  isButtonDisabled.value = false
  buttonDisableCountdown.value = 0
  isEnterDisabled.value = false
}

function submitAnswer() {
  if (userAnswer.value === null || userAnswer.value === undefined) return

  // Stop time tracking
  stopTimeTracking()

  timeTaken.value = (Date.now() - answerStartTime.value) / 1000
  const card = currentCard.value

  if (userAnswer.value === card.answer) {
    // Correct answer
    isCorrect.value = true
    const [x, y] = card.question.split('x').map(Number)
    basePoints.value = Math.min(x, y)
    levelBonus.value = MAX_CARD_LEVEL + 1 - card.level

    // Add speed bonus if last time < MAX_CARD_TIME and current time <= last time
    if (card.time < MAX_CARD_TIME && timeTaken.value <= card.time) {
      speedBonus.value = SPEED_BONUS_POINTS
    } else {
      speedBonus.value = 0
    }

    lastPoints.value = basePoints.value + levelBonus.value + speedBonus.value
    currentPoints.value += lastPoints.value
    correctAnswers.value++

    // Update card in storage
    const newLevel = Math.min(card.level + 1, MAX_CARD_LEVEL)
    StorageService.updateCard(card.question, {
      level: newLevel,
      time: timeTaken.value
    })

    // Auto-close after configured duration for correct answers
    isEnterDisabled.value = false
    startAutoCloseTimer(AUTO_CLOSE_DURATION / 1000)
  } else {
    // Wrong answer
    isCorrect.value = false
    lastPoints.value = 0
    basePoints.value = 0
    levelBonus.value = 0
    speedBonus.value = 0

    // Update card in storage
    const newLevel = Math.max(card.level - 1, MIN_CARD_LEVEL)
    StorageService.updateCard(card.question, {
      level: newLevel
    })

    // Disable button and Enter key to prevent accidental clicks
    startButtonDisableTimer()
    isEnterDisabled.value = true

    enterDisableTimer = setTimeout(() => {
      isEnterDisabled.value = false
    }, BUTTON_DISABLE_DURATION)
  }

  showFeedback.value = true
}

function startAutoCloseTimer(seconds: number) {
  clearTimers()
  autoCloseCountdown.value = seconds

  // Update countdown
  countdownInterval = setInterval(() => {
    autoCloseCountdown.value--
    if (autoCloseCountdown.value <= 0) {
      clearInterval(countdownInterval!)
    }
  }, COUNTDOWN_INTERVAL)

  // Auto-close after the specified time
  autoCloseTimer = setTimeout(() => {
    closeFeedbackAndContinue()
  }, seconds * 1000)
}

function clearTimers() {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  autoCloseCountdown.value = 0
}

function handleFeedbackEnter() {
  if (!isEnterDisabled.value) {
    closeFeedbackAndContinue()
  }
}

function closeFeedbackAndContinue() {
  clearTimers()
  showFeedback.value = false
  nextTick(() => {
    nextCard()
  })
}

function nextCard() {
  userAnswer.value = null
  currentCardIndex.value++

  // Clear button disable timers and reset enter key
  clearButtonDisableTimers()
  isEnterDisabled.value = false

  if (currentCardIndex.value >= gameCards.value.length) {
    finishGame()
  } else {
    answerStartTime.value = Date.now()
    startTimeTracking()
    nextTick(() => {
      nextTick(() => {
        answerInput.value?.focus()
      })
    })
  }
}

function finishGame() {
  // Clean up all timers
  stopTimeTracking()
  clearButtonDisableTimers()

  // Read game config from session storage
  const config = StorageService.getGameConfig()

  if (config) {
    // Convert [3,4,5,6,7,8,9] to "alle" for cleaner display
    let selectForHistory = config.select
    if (
      Array.isArray(config.select) &&
      config.select.length === 7 &&
      config.select.every((num, idx) => num === idx + 3)
    ) {
      selectForHistory = 'alle'
    }

    // Save to history
    StorageService.addHistory({
      date: new Date().toISOString(),
      select: selectForHistory,
      points: currentPoints.value,
      correctAnswers: correctAnswers.value
    })

    // Save game result to session storage for GameOverPage
    StorageService.setGameResult({
      points: currentPoints.value,
      correctAnswers: correctAnswers.value,
      totalCards: gameCards.value.length,
      select: selectForHistory
    })
  }

  // Update statistics
  StorageService.updateStatistics(currentPoints.value, correctAnswers.value)

  // Navigate to game over page
  router.push({ name: '/game-over' })
}

function goHome() {
  router.push({ name: '/' })
}
</script>

<template>
  <q-page class="game-page q-pa-md">
    <div
      v-if="!gameStarted"
      class="text-center q-mt-xl"
    >
      <q-spinner
        color="primary"
        size="50px"
      />
      <p>Spiel wird geladen...</p>
    </div>

    <div v-else>
      <!-- Game Progress -->
      <div class="row justify-between items-center q-mb-md progress-header">
        <div class="text-h6 points-display">
          <q-icon
            name="emoji_events"
            color="amber"
            size="24px"
          />
          {{ currentPoints }}
        </div>
        <div class="text-h6 card-counter">{{ currentCardIndex + 1 }} / {{ gameCards.length }}</div>
      </div>

      <!-- Current Question -->
      <q-card
        class="q-mb-md question-card"
        v-if="currentCard"
      >
        <q-card-section class="text-center question-section">
          <div class="row justify-between items-center q-mb-sm card-info">
            <q-badge
              color="primary"
              :label="`Level ${currentCard.level}`"
              class="level-badge"
            />
            <div
              v-if="currentCard.time < MAX_CARD_TIME"
              class="text-caption text-grey-7 time-display"
            >
              {{ currentCard.time.toFixed(1) }}s
            </div>
          </div>
          <div class="question-text">{{ displayQuestion }}</div>

          <!-- Time Progress Bar -->
          <q-linear-progress
            :key="currentCardIndex"
            :value="timeProgress"
            :color="timeProgress >= 1 ? 'negative' : 'primary'"
            size="10px"
            class="q-mt-md progress-bar"
            rounded
          />
        </q-card-section>
      </q-card>

      <!-- Answer Input -->
      <q-input
        v-model.number="userAnswer"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        outlined
        class="q-mb-md answer-input"
        @keyup.enter="submitAnswer"
        autofocus
        input-class="text-h3 text-center answer-text"
        ref="answerInput"
        :rules="[val => val === null || Number.isInteger(val)]"
      />

      <div class="row q-gutter-sm q-mb-md action-buttons">
        <q-btn
          flat
          color="grey"
          size="lg"
          @click="goHome"
          icon="close"
          class="cancel-btn"
        />
        <q-btn
          color="primary"
          size="lg"
          class="col submit-btn"
          @click="submitAnswer"
          :disable="userAnswer === null || userAnswer === undefined || isButtonDisabled"
          icon="check"
        >
          <span class="button-label">
            {{ isButtonDisabled ? `${TEXT_DE.wait} ${buttonDisableCountdown}s...` : TEXT_DE.check }}
          </span>
        </q-btn>
      </div>

      <!-- Game Feedback Dialog Component -->
      <GameFeedbackDialog
        :show="showFeedback"
        :is-correct="isCorrect"
        :current-card="currentCard"
        :user-answer="userAnswer"
        :last-points="lastPoints"
        :base-points="basePoints"
        :level-bonus="levelBonus"
        :speed-bonus="speedBonus"
        :auto-close-countdown="autoCloseCountdown"
        :is-button-disabled="isButtonDisabled"
        :button-disable-countdown="buttonDisableCountdown"
        :is-enter-disabled="isEnterDisabled"
        @continue="closeFeedbackAndContinue"
        @handle-enter="handleFeedbackEnter"
      />
    </div>
  </q-page>
</template>

<style scoped>
.game-page {
  max-width: 600px;
  margin: 0 auto;
}

.progress-header {
  padding: 0 4px;
}

.points-display,
.card-counter {
  font-weight: 600;
}

.question-card {
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
}

.question-section {
  padding: 20px 16px;
}

.question-text {
  font-size: 3.5rem;
  font-weight: 700;
  margin: 16px 0;
  line-height: 1.2;
}

.level-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 10px;
}

.time-display {
  font-size: 0.8rem;
  font-weight: 500;
}

.progress-bar {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.answer-input {
  font-size: 1rem;
}

.answer-text {
  font-size: 0.8rem;
  line-height: 1;
}

.action-buttons .cancel-btn {
  min-width: 56px;
  height: 56px;
}

.action-buttons .submit-btn {
  height: 56px;
  font-weight: 600;
}

.button-label {
  font-size: 1rem;
}

/* iPhone 7 and small screens optimization */
@media (max-width: 599.98px) {
  .game-page {
    padding: 10px !important;
  }

  .progress-header {
    margin-bottom: 10px;
  }

  .points-display {
    font-size: 1.1rem;
  }

  .card-counter {
    font-size: 1rem;
  }

  .question-section {
    padding: 16px 12px;
  }

  .question-text {
    font-size: 2.75rem;
    margin: 12px 0;
  }

  .level-badge {
    font-size: 0.7rem;
    padding: 4px 8px;
  }

  .time-display {
    font-size: 0.75rem;
  }

  .answer-input {
    font-size: 0.9rem;
  }

  .answer-text {
    font-size: 0.75rem;
  }

  .action-buttons {
    gap: 8px;
  }

  .action-buttons .cancel-btn {
    min-width: 52px;
    height: 52px;
  }

  .action-buttons .submit-btn {
    height: 52px;
  }

  .button-label {
    font-size: 0.9rem;
  }
}

/* Tablet and larger */
@media (min-width: 600px) {
  .question-text {
    font-size: 4rem;
  }
}
</style>
