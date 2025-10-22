export type FocusType = 'weak' | 'strong' | 'slow'

export interface Card {
  question: string // Format: "XxY" e.g. "3x4"
  answer: number // e.g. 12
  level: number // 1-5, default 1
  time: number // seconds for last correct answer, default 60
}

export interface GameConfig {
  select: number[] // Array of numbers 2-9, e.g. [2, 3, 5]
  focus: FocusType // 'weak' or 'strong'
}

export interface GameHistory {
  date: string // ISO date string
  select: number[]
  points: number
  correctAnswers: number
}

export interface GameState {
  cards: Card[]
  currentCardIndex: number
  points: number
  correctAnswers: number
  startTime: number // timestamp
}

export interface Statistics {
  gamesPlayed: number
  totalPoints: number
  totalCorrectAnswers: number
}

export interface GameResult {
  points: number
  correctAnswers: number
  totalCards: number
  select: number[]
}
