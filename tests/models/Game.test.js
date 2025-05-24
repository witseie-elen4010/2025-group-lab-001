/* eslint-env jest */
const Game = require('@models/Game')
const Player = require('@models/Player')

describe('Game Management', () => {
  beforeEach(() => {
    Game.resetCounter()
  })

  describe('Game Creation', () => {
    test('should create new game with host player', () => {
      const game = Game.createGame(1)
      expect(game.gameID).toBe(0)
      expect(game.host.getId()).toBe(1)
      expect(game.players.length).toBe(1)
    })

    test('A game is created with an imposter player', () => {
      const game = Game.createGame(1)
      expect(game.host.getRole()).toBe('imposter')
    })

    test('there should be exactly one imposter in the game', () => {
      const game = Game.createGame(1)

      // Add more players
      game.createPlayer(2)
      game.createPlayer(3)

      // Count imposters
      const imposterCount = game.players.filter(player => player.getRole() === 'imposter').length

      expect(imposterCount).toBe(1)
    })

    test('all other players should be civilians', () => {
      const game = Game.createGame(1)

      // Add more players
      game.createPlayer(2)
      game.createPlayer(3)

      // All players who aren't imposters should be civilians
      const nonImposters = game.players.filter(player => player.getRole() !== 'imposter')
      const allCivilians = nonImposters.every(player => player.getRole() === 'civilian')

      expect(allCivilians).toBe(true)
      expect(nonImposters.length).toBe(game.players.length - 1)
    })

    test('should assign word to player based on role', () => {
      const game = Game.createGame(1)
      expect(game.host.getWord()).toBe(game.wordPair.imposter)
    })
  })

  // Unique Player ID generation testing (necessary for the copy link functionality)
  describe('Player ID Generation', () => {
    test('generateUniquePlayerID returns sequential IDs when no conflicts', () => {
      const game = Game.createGame(1) // First player has ID 1
      expect(game.generateUniquePlayerID()).toBe(2)

      game.createPlayer(2) // Add player with ID 2
      expect(game.generateUniquePlayerID()).toBe(3) // Next should be 3
    })

    test('generateUniquePlayerID skips IDs that are already taken', () => {
      const game = Game.createGame(5) // First player has ID 5
      game.createPlayer(6) // Add another player with ID 6

      // Next ID would be 2, but we'll manually add a player with ID 2 first
      game.players.push(new Player(2))

      // 3 players, so next ID should be 3
      expect(game.generateUniquePlayerID()).toBe(3)
    })

    test('generateUniquePlayerID handles gaps in player IDs', () => {
      const game = Game.createGame(1)
      game.createPlayer(3)
      game.createPlayer(5)

      // Should return first available ID
      expect(game.generateUniquePlayerID()).toBe(4)
    })
  })

  describe('Game Round Management', () => {
    test('should mark the game as finished after the last round', () => {
      const game = Game.createGame(1, 2) // Create a game with 2 rounds
      game.players.push(new Player(2, 'civilian'))
      game.players.push(new Player(3, 'civilian'))

      game.startNewRound() // Round 2
      game.startNewRound() // Exceeds total rounds

      expect(game.currentRound).toBe(2) // round counter does not incremenet past 2
      expect(game.roundsComplete).toBe(true)
    })

    test('should reset player roles when starting a new round', () => {
      const numRounds = 100
      const game = Game.createGame(1, numRounds, 5)
      game.players.push(new Player(2, 'civilian'))
      game.players.push(new Player(3, 'civilian'))
      game.players.push(new Player(4, 'civilian'))
      game.players.push(new Player(5, 'civilian'))

      const initialRoles = game.players.map(player => player.getRole())
      let rolesChanged = false

      // yeah lol not ideal but it works. There is a very small chance of this test failing.
      // NOTE: if test fails, either push more players as shown above or increase numRounds or both

      for (let i = 0; i < numRounds; i++) {
        game.startNewRound()
        const newRoles = game.players.map(player => player.getRole())
        if (!arraysEqual(initialRoles, newRoles)) {
          rolesChanged = true
          break
        }
      }

      expect(rolesChanged).toBe(true)
    })

    // dumb helper function
    function arraysEqual (a, b) {
      return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, idx) => val === b[idx])
    }

    test('should not start new round if game is finished', () => {
      const game = Game.createGame(1, 1)
      game.players.push(new Player(2, 'civilian'))
      game.players.push(new Player(3, 'civilian'))

      game.startNewRound() // This should finish the game
      const finalRound = game.currentRound
      game.startNewRound() // Should not increment round

      expect(game.currentRound).toBe(finalRound)
      expect(game.roundsComplete).toBe(true)
    })
  })

  describe('Game Counter Management', () => {
    test('should increment game counter correctly', () => {
      const game1 = Game.createGame(1)
      const game2 = Game.createGame(2)
      expect(game1.gameID).toBe(0)
      expect(game2.gameID).toBe(1)
    })
    test('should mark rounds as completed after the last round', () => {
      const game = Game.createGame(1, 2) // Create a game with 2 rounds
      game.players.push(new Player(2, 'civilian'))
      game.players.push(new Player(3, 'civilian'))

      game.startNewRound() // Round 2
      game.startNewRound() // Exceeds total rounds

      expect(game.currentRound).toBe(2) // Round counter does not incremeent past totalRounds
      expect(game.roundsComplete).toBe(true) // Game should be marked as finished
    })

    test('should not reassign roles if the game is finished', () => {
      const game = Game.createGame(1, 1) // Create a game with 1 round
      game.players.push(new Player(2, 'civilian'))
      game.players.push(new Player(3, 'civilian'))

      game.startNewRound() // Round 2 (game finishes here)
      const previousRoles = game.players.map(player => player.getRole())

      game.startNewRound() // Attempt to start a new round after the rounds have been completed
      const currentRoles = game.players.map(player => player.getRole())

      expect(game.roundsComplete).toBe(true) // Game should remain completed
      expect(currentRoles).toEqual(previousRoles) // Roles should not change
    })
  })
})
