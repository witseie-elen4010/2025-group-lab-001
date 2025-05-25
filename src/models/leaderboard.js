'use strict'

const e = require('express')

class Leaderboard {
  constructor (players = []) {
    this.entries = players.map(player => ({
      playerId: player.getId() || player.id || player,
      username: player.username || null,
      points: 0
    }))
  }

  setPoints (player, amount) {
    const playerId = player.getId()
    const entry = this.entries.find(e => e.playerId === playerId)
    if (entry) entry.points = amount
  }

  incrementPoints (player, amount = 1) {
    const playerId = player.getId()
    const entry = this.entries.find(e => e.playerId === playerId)
    if (entry) entry.points += amount
  }

  getSorted () {
    this.entries.sort((a, b) => b.points - a.points)
  }

  toJSON () {
    this.getSorted()
    return this.entries
  }

  getPoints (player) {
    const playerId = player.getId()
    const entry = this.entries.find(e => e.playerId === playerId)
    if (entry) return entry.points
    else return null
  }
}

module.exports = Leaderboard
