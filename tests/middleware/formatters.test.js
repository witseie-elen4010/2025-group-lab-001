/* eslint-env jest */
const formatters = require('../../src/middleware/formatters')

describe('formatters', () => {
  test('join game formatter uses data or context gameID', () => {
    expect(formatters['join game']({}, { gameID: 42 })).toBe('Joined game with ID: 42')
    expect(formatters['join game']({ gameID: 99 }, {})).toBe('Joined game with ID: 99')
    expect(formatters['join game']({}, {})).toBe('Joined game with ID: unknown')
  })

  test('start game formatter uses data or context gameID', () => {
    expect(formatters['start game']({}, { gameID: 7 })).toBe('Started game with ID: 7')
    expect(formatters['start game']({ gameID: 13 }, {})).toBe('Started game with ID: 13')
    expect(formatters['start game']({}, {})).toBe('Started game with ID: unknown')
  })

  test('share word formatter', () => {
    expect(formatters['share word']({ word: 'apple' })).toBe('Shared word: apple')
    expect(formatters['share word']({})).toBe('Shared word: N/A')
  })

  test('cast vote formatter skips empty vote', () => {
    expect(formatters['cast vote']({})).toBe('')
    expect(formatters['cast vote']({ vote: '' })).toBe('')
    expect(formatters['cast vote']({ vote: 'player1' })).toBe('Voted for player: player1')
  })

  test('discussion message formatter', () => {
    expect(formatters['discussion message']({ text: 'hello' })).toBe('Message: hello')
    expect(formatters['discussion message']({})).toMatch(/^Message: /)
  })
})
