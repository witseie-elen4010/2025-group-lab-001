'use strict'

const ACTION_MAP = {
  '/gaming/invite': 'join game',
  '/home/join': 'join game',
  '/gaming/start': 'start game',
  '/gaming/share-word': 'share word',
  '/gaming/voting': 'cast vote',
  '/gaming/chatRoom': 'discussion message',
  'start game': 'start game',
  'start discussion': 'discussion message',
  'start voting': 'cast vote',
  'chat message': 'discussion message'
}

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
  DEFAULT_TIMEOUT: 30000,
  ACTION_MAP
}
