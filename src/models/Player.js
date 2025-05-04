'use strict'

const { ROLES } = require('@config/gameConstants')

class Player {
  constructor (id, role = ROLES.CIVILIAN, word = null) {
    this.id = id
    this.#validateRole(role)
    this.role = role
    this.word = word
    this.active = true
    this.votesReceived = 0
    this.hasVoted = false
    this.points = 0
    this.hasSharedWord = false
  }

  setSharedWord () {
    this.hasSharedWord = true
  }

  disableHasSharedWord () {
    this.hasSharedWord = false
  }

  hasSharedWord () {
    return this.hasSharedWord
  }

  #validateRole (role) {
    if (!Object.values(ROLES).includes(role)) {
      throw new Error('Invalid role type')
    }
  }

  win () {
    this.points += 100
    // Give double points to Imposter
    if (this.role === ROLES.IMPOSTER) {
      this.points += 100
    }
  }

  survived () {
    this.points += 10 * this.votesReceived // awarded per round, reward player for playing the risky game ;)
  }

  getId () {
    return this.id
  }

  getRole () {
    return this.role
  }

  getWord () {
    return this.word
  }

  assignRole (role) {
    this.#validateRole(role)
    this.role = role
  }

  isActive () {
    return this.active
  }

  setActive (active) {
    this.active = Boolean(active)
  }

  getVotesReceived () {
    return this.votesReceived
  }

  increaseVotesReceived () {
    this.votesReceived += 1
  }

  decreaseVotesReceived () {
    this.votesReceived -= 1
  }

  deleteAllVotes () {
    this.votesReceived = 0
  }

  setHasVoted (hasVoted) {
    this.hasVoted = Boolean(hasVoted)
  }

  getHasVoted () {
    return this.hasVoted
  }
}

module.exports = Player
