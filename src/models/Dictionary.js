'use strict'

// Private
const dictionary = [
  {
    civilian: 'Hotel',
    imposter: 'Motel'
  },
  {
    civilian: 'House',
    imposter: 'Mansion'
  },
  {
    civilian: 'Office',
    imposter: 'Factory'
  },
  {
    civilian: 'Park',
    imposter: 'Forest'
  },
  {
    civilian: 'School',
    imposter: 'Prison'
  },
  {
    civilian: 'Store',
    imposter: 'Warehouse'
  },
  {
    civilian: 'Street',
    imposter: 'Alley'
  }
]

// Public
module.exports = {
  getWordPair: function () {
    const randomIndex = Math.floor(Math.random() * dictionary.length)

    return dictionary[randomIndex]
  }
}
