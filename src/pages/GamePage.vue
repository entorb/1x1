<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storage'
import type { Card, FocusType } from '@/types'

const router = useRouter()

const gameStarted = ref(false)
const gameFinished = ref(false)
const gameCards = ref<Card[]>([])
const currentCardIndex = ref(0)
const currentPoints = ref(0)
const correctAnswers = ref(0)
const userAnswer = ref<number | null>(null)
const showFeedback = ref(false)
const isCorrect = ref(false)
const lastPoints = ref(0)
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

// Auto-submit after 2 digits
watch(userAnswer, newValue => {
  if (newValue !== null && newValue !== undefined && !showFeedback.value) {
    const valueStr = String(newValue)
    if (valueStr.length >= 2) {
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
  const filteredCards = allCards.filter(card => {
    const [x, y] = card.question.split('x').map(Number)
    return config.filter.includes(x) || config.filter.includes(y)
  })

  // Select up to 10 random cards based on focus
  gameCards.value = selectCards(filteredCards, config.focus, 10)
  gameStarted.value = true
  answerStartTime.value = Date.now()
  startTimeTracking()
}

function selectCards(cards: Card[], focus: FocusType, count: number): Card[] {
  const weights = cards.map(card => {
    if (focus === 'weak') {
      // Level 1=5, 2=4, 3=3, 4=2, 5=1
      return 6 - card.level
    } else if (focus === 'strong') {
      // Level 1=1, 2=2, 3=3, 4=4, 5=5
      return card.level
    } else {
      // slow: prioritize cards with higher time (slower)
      // Normalize time to weight (higher time = higher weight)
      return card.time
    }
  })

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  const selected: Card[] = []

  for (let i = 0; i < Math.min(count, cards.length); i++) {
    let random = Math.random() * totalWeight
    let selectedIndex = 0

    for (let j = 0; j < weights.length; j++) {
      random -= weights[j]
      if (random <= 0) {
        selectedIndex = j
        break
      }
    }

    selected.push({ ...cards[selectedIndex] })
    // Remove selected card and its weight
    cards.splice(selectedIndex, 1)
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
      const cappedTime = Math.min(currentCard.value.time, 60)
      timeProgress.value = Math.min(elapsedTime.value / cappedTime, 1.5)
    }
  }, 100) // Update every 100ms for smooth progress
}

function stopTimeTracking() {
  if (timeTrackingInterval) {
    clearInterval(timeTrackingInterval)
    timeTrackingInterval = null
  }
}

function startButtonDisableTimer() {
  isButtonDisabled.value = true
  buttonDisableCountdown.value = 3

  buttonDisableCountdownInterval = setInterval(() => {
    buttonDisableCountdown.value--
    if (buttonDisableCountdown.value <= 0) {
      clearInterval(buttonDisableCountdownInterval!)
    }
  }, 1000)

  buttonDisableTimer = setTimeout(() => {
    isButtonDisabled.value = false
    buttonDisableCountdown.value = 0
  }, 3000)
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
    const minXY = Math.min(x, y)
    lastPoints.value = minXY + (6 - card.level)
    currentPoints.value += lastPoints.value
    correctAnswers.value++

    // Update card in storage
    const newLevel = Math.min(card.level + 1, 5)
    StorageService.updateCard(card.question, {
      level: newLevel,
      time: timeTaken.value
    })

    // Auto-close after 3 seconds for correct answers (user can press Enter to skip)
    isEnterDisabled.value = false
    startAutoCloseTimer(3)
  } else {
    // Wrong answer
    isCorrect.value = false
    lastPoints.value = 0

    // Update card in storage
    const newLevel = Math.max(card.level - 1, 1)
    StorageService.updateCard(card.question, {
      level: newLevel
    })

    // Disable button and Enter key for 3 seconds to prevent accidental clicks
    startButtonDisableTimer()
    isEnterDisabled.value = true

    enterDisableTimer = setTimeout(() => {
      isEnterDisabled.value = false
    }, 3000)
  }

  showFeedback.value = true
}

function startAutoCloseTimer(seconds: number) {
  clearTimers()
  autoCloseCountdown.value = seconds

  // Update countdown every second
  countdownInterval = setInterval(() => {
    autoCloseCountdown.value--
    if (autoCloseCountdown.value <= 0) {
      clearInterval(countdownInterval!)
    }
  }, 1000)

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
  nextCard()
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
      answerInput.value?.focus()
    })
  }
}

function finishGame() {
  gameFinished.value = true

  // Clean up all timers
  stopTimeTracking()
  clearButtonDisableTimers()

  // Read game config from session storage
  const config = StorageService.getGameConfig()

  if (config) {
    // Save to history
    StorageService.addHistory({
      date: new Date().toISOString(),
      filter: config.filter,
      points: currentPoints.value,
      correctAnswers: correctAnswers.value
    })
  }

  // Update statistics
  StorageService.updateStatistics(currentPoints.value, correctAnswers.value)
}

function goHome() {
  router.push({ name: '/' })
}
</script>

<template>
  <q-page class="q-pa-md">
    <div
      v-if="!gameStarted"
      class="text-center"
    >
      <q-spinner
        color="primary"
        size="50px"
      />
      <p>Spiel wird geladen...</p>
    </div>

    <div v-else-if="!gameFinished">
      <!-- Game Progress -->
      <div class="row justify-between items-center q-mb-md">
        <div class="text-h6">
          <q-icon
            name="emoji_events"
            color="amber"
          />
          {{ currentPoints }} Punkte
        </div>
        <div class="text-h6">{{ currentCardIndex + 1 }} / {{ gameCards.length }}</div>
      </div>

      <!-- Current Question -->
      <q-card
        class="q-mb-md"
        v-if="currentCard"
      >
        <q-card-section class="text-center">
          <div class="row justify-between items-center q-mb-sm">
            <q-badge
              color="primary"
              :label="`Level ${currentCard.level}`"
            />
            <div
              v-if="currentCard.time < 60"
              class="text-caption text-grey-7"
            >
              {{ currentCard.time.toFixed(1) }}s
            </div>
          </div>
          <div class="text-h2 q-mb-md">{{ displayQuestion }}</div>

          <!-- Time Progress Bar -->
          <q-linear-progress
            :key="currentCardIndex"
            :value="timeProgress"
            :color="timeProgress >= 1 ? 'negative' : 'primary'"
            size="8px"
            class="q-mt-md"
          />
          <div class="text-caption text-grey-7 q-mt-xs">{{ elapsedTime.toFixed(1) }}s</div>
        </q-card-section>
      </q-card>

      <!-- Answer Input -->
      <q-input
        v-model.number="userAnswer"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        outlined
        label="?"
        class="q-mb-md"
        @keyup.enter="submitAnswer"
        autofocus
        input-class="text-h4 text-center"
        ref="answerInput"
        :rules="[val => val === null || Number.isInteger(val) || 'Nur ganze Zahlen']"
      >
      </q-input>

      <div class="row q-gutter-sm q-mb-md">
        <q-btn
          flat
          color="grey"
          size="xl"
          @click="goHome"
          icon="close"
        />
        <q-btn
          color="primary"
          size="xl"
          class="col"
          @click="submitAnswer"
          :disable="userAnswer === null || userAnswer === undefined || isButtonDisabled"
          icon="check"
        >
          <span class="text-h6">
            {{ isButtonDisabled ? `Warte ${buttonDisableCountdown}s...` : 'Antwort prüfen' }}
          </span>
        </q-btn>
      </div>

      <!-- Feedback -->
      <q-dialog
        v-model="showFeedback"
        persistent
        @keyup.enter="handleFeedbackEnter"
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
                >{{ userAnswer }}</span
              >
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
              @click="closeFeedbackAndContinue"
              size="lg"
              unelevated
              class="full-width q-py-sm text-h6"
              autofocus
              :disable="isButtonDisabled || isEnterDisabled"
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
    </div>

    <!-- Game Finished -->
    <div
      v-else
      class="text-center"
    >
      <q-icon
        name="emoji_events"
        color="amber"
        size="100px"
      />
      <div class="text-h4 q-mt-md">Spiel beendet!</div>

      <q-card class="q-mt-lg">
        <q-card-section>
          <div class="text-h5 q-mb-md">Ergebnis</div>
          <div class="row q-gutter-md justify-center">
            <div>
              <div class="text-caption">Punkte</div>
              <div class="text-h4 text-primary">{{ currentPoints }}</div>
            </div>
            <div>
              <div class="text-caption">Richtige Antworten</div>
              <div class="text-h4 text-positive">{{ correctAnswers }}</div>
            </div>
            <div>
              <div class="text-caption">Von</div>
              <div class="text-h4">{{ gameCards.length }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-btn
        color="primary"
        size="xl"
        class="full-width q-mt-lg"
        @click="goHome"
        icon="home"
      >
        <span class="text-h6">Zurück zur Startseite</span>
      </q-btn>
    </div>
  </q-page>
</template>
