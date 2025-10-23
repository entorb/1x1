describe('Navigation Smoke Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should navigate from Home to History and back', () => {
    // Verify we're on the home page
    cy.contains("Vyvit's 1x1").should('be.visible')

    // Navigate to History page
    cy.contains('button', 'Spielverlauf').click()

    // Verify we're on History page
    cy.url().should('include', '/history')
    cy.contains('Spielverlauf').should('be.visible')

    // Go back to home (browser back button)
    cy.go('back')

    // Verify we're back on home page
    cy.url().should('not.include', '/history')
    cy.contains("Vyvit's 1x1").should('be.visible')
  })

  it('should navigate from Home to Statistics and back', () => {
    // Verify we're on the home page
    cy.contains("Vyvit's 1x1").should('be.visible')

    // Navigate to Stats page
    cy.contains('button', 'Statistiken').click()

    // Verify we're on Stats page
    cy.url().should('include', '/stats')
    cy.contains('Statistiken').should('be.visible')

    // Go back to home (browser back button)
    cy.go('back')

    // Verify we're back on home page
    cy.url().should('not.include', '/stats')
    cy.contains("Vyvit's 1x1").should('be.visible')
  })

  it('should navigate to all pages in sequence', () => {
    // Start at home
    cy.contains("Vyvit's 1x1").should('be.visible')

    // Go to History
    cy.contains('button', 'Spielverlauf').click()
    cy.url().should('include', '/history')
    cy.go('back')

    // Go to Statistics
    cy.contains('button', 'Statistiken').click()
    cy.url().should('include', '/stats')
    cy.go('back')

    // Verify back at home
    cy.contains("Vyvit's 1x1").should('be.visible')
  })

  it('should navigate back to Home via Escape key', () => {
    // Verify we're on the home page
    cy.contains("Vyvit's 1x1").should('be.visible')

    // Navigate to History and press Escape
    cy.contains('button', 'Spielverlauf').click()
    cy.url().should('include', '/history')
    cy.get('body').type('{esc}')
    cy.url().should('not.include', '/history')
    cy.contains("Vyvit's 1x1").should('be.visible')

    // Navigate to Statistics and press Escape
    cy.contains('button', 'Statistiken').click()
    cy.url().should('include', '/stats')
    cy.get('body').type('{esc}')
    cy.url().should('not.include', '/stats')
    cy.contains("Vyvit's 1x1").should('be.visible')
  })
})
