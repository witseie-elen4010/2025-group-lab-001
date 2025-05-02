/* eslint-env jest */
const Player = require('../../src/models/Player')

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

  test('should throw error for invalid role', () => {
    expect(() => {
      // eslint-disable-next-line new-cap
      const _invalidPlayer = new Player(1, 'invalid-role')
    }).toThrow('Invalid role type')
  })

  test('should allow role reassignment', () => {
    const player = new Player(1)
    player.assignRole('imposter')
    expect(player.getRole()).toBe('imposter')
  })
})
