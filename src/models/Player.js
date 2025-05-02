'use strict'

const { ROLES } = require('@config/gameConstants')

class Player {
  constructor (id, role = ROLES.CIVILIAN) {
    this.id = id
    this.#validateRole(role)
    this.role = role
  }

  #validateRole (role) {
    if (!Object.values(ROLES).includes(role)) {
      throw new Error('Invalid role type')
    }
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
