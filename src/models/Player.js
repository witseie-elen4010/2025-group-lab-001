'use strict'

class Player {
  constructor (id, role = 'civilian') {
    this.id = id

    if (!['civilian', 'imposter'].includes(role)) {
      throw new Error('Invalid role type')
    }

    this.role = role
  }

  getId () {
    return this.id
  }

  getRole () {
    return this.role
  }

  assignRole (role) {
    if (!['civilian', 'imposter'].includes(role)) {
      throw new Error('Invalid role type')
    }
    this.role = role
  }
}

module.exports = Player
