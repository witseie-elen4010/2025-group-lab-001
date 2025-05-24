const formatters = {
  'join game': (data, context) => `Joined game with ID: ${data.gameID || context.gameID || 'unknown'}`,
  'start game': (data, context) => `Started game with ID: ${data.gameID || context.gameID || 'unknown'}`,
  'share word': (data) => `Shared word: ${data.word || 'N/A'}`,
  'cast vote': (data) => data.vote ? `Voted for player: ${data.vote}` : '',
  'discussion message': (data) => `Message: ${data.text || JSON.stringify(data)}`
}

module.exports = formatters
