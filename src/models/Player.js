'use strict'

const { ROLES } = require('@config/gameConstants')

class Player {
  constructor (id, role = ROLES.CIVILIAN) {
    this.id = id
    this.#validateRole(role)
    this.role = role
    this.points = 0
  }

  #validateRole (role) {
    if (!Object.values(ROLES).includes(role)) {
      throw new Error('Invalid role type')
    }
  }

  win () {
    this.points += 100
    // Give double points to Imposter
    if (this.role === 'Imposter') {
      this.points += 100
    }
  }

  survived () {
    this.points += 10 // awarded per round
  }

  getId () {
    return this.id
  }

  getRole () {
    return this.role
  }

  assignRole (role) {
    this.#validateRole(role)
    this.role = role
  }
}

module.exports = Player
