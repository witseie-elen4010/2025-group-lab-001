'use strict'

class Player {
  constructor (id, role = 'civilian') {
    this.id = id
    this.role = role

    // Validate role against allowed types
    if (!['civilian', 'imposter'].includes(role)) {
      throw new Error('Invalid role type')
    }
  }

  // Getters
  getId () {
    return this.id
  }

  getRole () {
    return this.role
  }

  // Role assignment
  assignRole (role) {
    if (!['civilian', 'imposter'].includes(role)) {
      throw new Error('Invalid role type')
    }
    this.role = role
  }
}

module.exports = Player
