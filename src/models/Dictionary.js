'use strict'

// Private
const wordDictionary = [
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

const promptDictionary = [
  {
    civilian: 'you caught the bus right on time this morning.',
    imposter: 'you barely made it onto the train today.'
  },
  {
    civilian: 'you had a delicious picnic by the lake.',
    imposter: 'you ate sandwiches beside the river.'
  },
  {
    civilian: 'you wore a gown to the formal event.',
    imposter: 'you dressed up for the party last night.'
  },
  {
    civilian: 'you fixed the car in your garage over the weekend.',
    imposter: 'you worked on your bike in the driveway.'
  },
  {
    civilian: 'you adopted a puppy from the shelter.',
    imposter: 'you rescued a kitten last month.'
  },
  {
    civilian: 'you ordered sushi from the new Japanese place.',
    imposter: 'you spent the weekend in a cabin on a mountain.'
  },
  {
    civilian: 'you took a nap after lunch because you were exhausted.',
    imposter: 'you rested in bed all morning since you felt tired.'
  }
]

// Public
module.exports = {
  getWordPair: function (dictionaryType) {
    if (dictionaryType === 'prompt') {
      return this.getRandomPrompt()
    } else if (dictionaryType === 'word') {
      return this.getRandomWord()
    } else {
      throw new Error('Invalid dictionary type. Use "prompt" or "word".')
    }
  },
  getRandomPrompt: function () {
    const randomIndex = Math.floor(Math.random() * promptDictionary.length)
    return promptDictionary[randomIndex]
  },
  getRandomWord: function () {
    const randomIndex = Math.floor(Math.random() * wordDictionary.length)

    return wordDictionary[randomIndex]
  }
}
