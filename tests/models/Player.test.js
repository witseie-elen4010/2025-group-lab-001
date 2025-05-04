/* eslint-env jest */
const Player = require('@models/Player')

describe('Player Class', () => {
  test('should create player with default civilian role', () => {
    const player = new Player(1)
    expect(player.getId()).toBe(1)
    expect(player.getRole()).toBe('civilian')
  })

  test('should create player with specified role', () => {
    const player = new Player(1, 'imposter')
    expect(player.getRole()).toBe('imposter')
  })

  test('should create player with specified word', () => {
    const player = new Player(1, 'civilian', 'apple')
    expect(player.getWord()).toBe('apple')
  }
  )

  test('should throw error for invalid role', () => {
    expect(() => {
      // eslint-disable-next-line new-cap
      /* eslint-disable */
      const _invalidPlayer = new Player(1, 'invalid-role') 
    }).toThrow('Invalid role type')
  })

  test('should allow role reassignment', () => {
    const player = new Player(1)
    player.assignRole('imposter')
    expect(player.getRole()).toBe('imposter')
  })

  test('should award points correctly for winning', () => {
    const civilianPlayer = new Player(1, 'civilian')
    const imposterPlayer = new Player(2, 'imposter')

    civilianPlayer.win()
    imposterPlayer.win()

    expect(civilianPlayer.points).toBe(100) // Civilians get 100 points for winning
    expect(imposterPlayer.points).toBe(200) // Imposters get 200 points for winning
  })

  // Test for survived functionality
  test('should award points correctly for surviving based on votes received', () => {
    const player = new Player(1)
    player.increaseVotesReceived() // Simulate receiving 1 vote
    player.increaseVotesReceived() // Simulate receiving another vote

    player.survived()

    expect(player.points).toBe(20) // 10 points per vote received
  })

  // Test for survived functionality with no votes
  test('should not award points for surviving with no votes received', () => {
    const player = new Player(1)

    player.survived()

    expect(player.points).toBe(0) // No points awarded if no votes received
  })
})
