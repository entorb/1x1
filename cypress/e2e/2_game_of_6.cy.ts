describe('Full Game Flow', () => {
  beforeEach(() => {
    // Clear storage before each test
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/')
  })

  it('should prevent starting game with no selection', () => {
    // Try to deselect all numbers (keep clicking until can't deselect anymore)
    cy.contains('button', '3').click()

    // Start button should still be enabled (at least one must remain selected)
    cy.contains('button', 'Spiel starten').should('not.be.disabled')
  })

  it('should play a complete game with 1 wrong and 6 correct answers', () => {
    // Verify we're on the home page
    cy.contains("Vyvit's 1x1").should('be.visible')

    // Select only [6] - since all are selected by default, clicking 6 will select only 6
    cy.contains('button', '6').click()

    // Verify only 6 is selected (it should be filled/unelevated)
    cy.contains('button', '6').should('have.class', 'q-btn--unelevated')

    // Start the game
    cy.contains('button', 'Spiel starten').click()

    // Verify we're on the game page
    cy.url().should('include', '/game')

    // Wait for game to load
    cy.contains(/\d+\s*×\s*\d+/).should('be.visible')

    // Helper function to parse question and calculate answer
    const parseQuestion = (questionText: string): { x: number; y: number; answer: number } => {
      const match = questionText.match(/(\d+)\s*×\s*(\d+)/)
      if (!match) throw new Error(`Could not parse question: ${questionText}`)
      const x = parseInt(match[1])
      const y = parseInt(match[2])
      return { x, y, answer: x * y }
    }

    // Answer first question WRONG
    cy.get('.question-text')
      .invoke('text')
      .then(questionText => {
        const { answer } = parseQuestion(questionText)
        const wrongAnswer = answer + 1 // Wrong answer

        cy.get('input[type="text"]').clear()
        cy.get('input[type="text"]').type(String(wrongAnswer))

        // Auto-submit happens after 2 digits, wait for wrong answer feedback
        cy.contains('Falsch!', { timeout: 5000 }).should('be.visible')

        // Wait for button to be enabled (3 second disable timer)
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(3100)

        // Click continue to next question
        cy.contains('button', /Weiter|Warte/).click()
      })

    // Answer next 6 questions CORRECTLY
    for (let i = 0; i < 6; i++) {
      cy.get('.question-text')
        .invoke('text')
        .then(questionText => {
          const { answer } = parseQuestion(questionText)

          cy.get('input[type="text"]').clear()
          cy.get('input[type="text"]').type(String(answer))

          // Wait for auto-submit after 2 digits or feedback to appear
          cy.contains('Richtig!', { timeout: 5000 }).should('be.visible')

          // Wait for auto-close or press Enter to continue
          // For correct answers, it auto-closes after 3s, but we can skip with Enter
          cy.get('body').type('{enter}')
        })
    }

    // After all questions, should be on game over page
    cy.url({ timeout: 10000 }).should('include', '/game-over')
    cy.contains('Spiel beendet!').should('be.visible')

    // Verify statistics show 6 correct answers out of 7 total
    cy.contains('Richtige').should('be.visible')
    cy.contains('.stat-value', '6').should('be.visible')
    cy.contains('Von').should('be.visible')
    cy.contains('.stat-value', '7').should('be.visible')

    // Navigate back to home
    cy.contains('button', 'Zurück zur Startseite').click()

    // Verify we're back on home page
    cy.url().should('not.include', '/game-over')
    cy.contains("Vyvit's 1x1").should('be.visible')

    // Verify statistics updated (1 game played)
    cy.contains('Spiele').should('be.visible')
  })
})
