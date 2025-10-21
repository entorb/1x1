<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { StorageService } from '@/services/storage'
import type { Card, FocusType, GameConfig } from '@/types'

const router = useRouter()
const route = useRoute()

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

const currentCard = computed(() => gameCards.value[currentCardIndex.value])

const displayQuestion = computed(() => {
  if (!currentCard.value) return ''
  return currentCard.value.question.replace('x', '\u00d7')
})

onMounted(() => {
  initializeGame()
})

function initializeGame() {
  const filterParam = route.query.filter as string
  const focusParam = route.query.focus as FocusType

  if (!filterParam) {
    router.push({ name: '/' })
    return
  }

  const config: GameConfig = {
    filter: filterParam.split(',').map(Number),
    focus: focusParam || 'weak'
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
      timeProgress.value = Math.min(elapsedTime.value / currentCard.value.time, 1.5)
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
  isButtonDisabled.value = false
  buttonDisableCountdown.value = 0
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

    // Auto-close immediately for correct answers (user can press Enter)
    autoCloseCountdown.value = 0
    isEnterDisabled.value = false
  } else {
    // Wrong answer
    isCorrect.value = false
    lastPoints.value = 0

    // Update card in storage
    const newLevel = Math.max(card.level - 1, 1)
    StorageService.updateCard(card.question, {
      level: newLevel
    })

    // Disable button and Enter key for 3 seconds
    startButtonDisableTimer()
    isEnterDisabled.value = true

    // Auto-close after 3 seconds for wrong answers
    startAutoCloseTimer(3)
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

  const filterParam = route.query.filter as string
  const filter = filterParam.split(',').map(Number)

  // Save to history
  StorageService.addHistory({
    date: new Date().toISOString(),
    filter,
    points: currentPoints.value,
    correctAnswers: correctAnswers.value
  })

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

      <q-linear-progress
        :value="(currentCardIndex + 1) / gameCards.length"
        color="primary"
        class="q-mb-md"
        size="10px"
      />

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
            <div class="text-caption text-grey-7">{{ currentCard.time.toFixed(1) }}s</div>
          </div>
          <div class="text-h2 q-mb-md">{{ displayQuestion }}</div>

          <!-- Time Progress Bar -->
          <q-linear-progress
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
        type="number"
        outlined
        label="?"
        class="q-mb-md"
        @keyup.enter="submitAnswer"
        autofocus
        input-class="text-h4 text-center"
        ref="answerInput"
        step="1"
        :rules="[val => val === null || Number.isInteger(val) || 'Nur ganze Zahlen']"
      >
      </q-input>

      <div class="row q-gutter-sm q-mb-md">
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
        <q-btn
          flat
          color="grey"
          size="xl"
          @click="goHome"
          icon="close"
        />
      </div>

      <!-- Feedback -->
      <q-dialog
        v-model="showFeedback"
        persistent
        @keyup.enter="handleFeedbackEnter"
      >
        <q-card>
          <q-card-section class="text-center">
            <q-icon
              :name="isCorrect ? 'check_circle' : 'cancel'"
              :color="isCorrect ? 'positive' : 'negative'"
              size="80px"
            />
            <div class="text-h5 q-mt-md">
              {{ isCorrect ? 'Richtig!' : 'Falsch!' }}
            </div>
            <div
              v-if="!isCorrect"
              class="text-h6 q-mt-sm"
            >
              {{ currentCard?.question }} = {{ currentCard?.answer }}
            </div>
            <div
              v-if="isCorrect"
              class="text-subtitle1 q-mt-sm"
            >
              +{{ lastPoints }} Punkte
            </div>
            <div
              v-if="!isCorrect && autoCloseCountdown > 0"
              class="text-caption q-mt-sm text-grey-7"
            >
              Weiter in {{ autoCloseCountdown }}s...
            </div>
          </q-card-section>
          <q-card-actions align="center">
            <q-btn
              color="primary"
              label="Weiter (Enter)"
              @click="closeFeedbackAndContinue"
              size="lg"
              autofocus
            />
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
