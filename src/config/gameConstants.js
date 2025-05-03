'use strict'

module.exports = {
  ROLES: {
    CIVILIAN: 'civilian',
    IMPOSTER: 'imposter'
  },

  GAME_STATES: {
    WAITING: 'waiting', // Players joining, game not started
    SHARE_WORD: 'share', // Word being shared with players
    DISCUSSING: 'discuss', // Players discussing to find imposter
    VOTING: 'voting', // Players voting on suspected imposter
    FINISHED: 'finished' // Game complete, showing results
  },

  // Can add more game constants here as needed
  MAX_PLAYERS: 10,
  MIN_PLAYERS: 3,
  DEFAULT_TIMEOUT: 30000
}
