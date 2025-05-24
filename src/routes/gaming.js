'use strict'
const express = require('express')
const path = require('path')
const Game = require('@models/Game')
const votingFunctions = require('@controllers/votingFunctions')
const { GAME_STATES } = require('@config/gameConstants')
const { verifyToken } = require('@middleware/auth')

module.exports = (io) => {
  const gaming = express.Router()

  // Apply JWT verification to all gaming routes except invite
  gaming.use((req, res, next) => {
    verifyToken(req, res, next)
  })

  gaming.use((req, res, next) => {
    const gameID = req.user.gameInfo?.gameId
    const selectedGame = Game.findGame(gameID)

    if (selectedGame) {
      const player = selectedGame.findPlayer(req.user.playerId)
      if (player) {
        req.game = selectedGame
        req.player = player
        next()
      } else if (req.user.gameInfo?.isSpectator) {
        req.game = selectedGame
        req.player = null
        next()
      } else {
        res.status(403).sendFile(path.join(__dirname, '..', 'views', 'gameError.html'))
      }
    } else {
      res.status(403).sendFile(path.join(__dirname, '..', 'views', 'gameError.html'))
    }
  })

  gaming.get('/waiting', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'wait.html'))
  })

  gaming.get('/players', (req, res) => {
    const game = req.game
    const playerIDs = game.players.map(player => player.getId())
    res.json({ players: playerIDs })
  })

  gaming.get('/getWord', (req, res) => {
    const player = req.player
    const word = player.getWord()
    res.json({ word }) // Respond with the word as JSON
  })

  gaming.get('/playerID', (req, res) => {
    const player = req.player
    const playerID = player.getId()
    res.json({ playerID })
  })

  gaming.get('/role', (req, res) => {
    const player = req.player
    res.json({ role: player.getRole() })
  })

  gaming.get('/state', (req, res) => {
    const game = req.game
    res.json({ state: game.getState() })
  })

  gaming.post('/start', (req, res) => {
    const isHost = req.user.gameInfo?.isHost
    if (!isHost) {
      return res.status(403).send('Not authorized to start game')
    }

    const game = req.game
    game.setState(GAME_STATES.SHARE_WORD)
    res.status(200).send('Game started')
  })

  gaming.get('/share-word', (req, res) => {
    res.json({ hello: 'hello' })
  })
  gaming.get('/voting', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'vote.html'))
  })

  gaming.post('/voting', (req, res) => {
    const player = req.player
    const game = req.game
    let vote = null
    let votedPlayer = null
    if (game.getState() === GAME_STATES.VOTING) {
      if (player.getHasVoted() === false && player.isActive()) {
        vote = req.body.vote
        if (vote !== null && vote !== undefined) {
          votedPlayer = game.findPlayer(vote)
          if (votedPlayer !== null && votedPlayer !== undefined) {
            votedPlayer.increaseVotesReceived()
            player.setHasVoted(true)
            game.decreaseNumVotesOustsanding()
          }
        }
      }
    }
    if (game.getNumVotesOutstanding() === 0) {
      const votedOutPlayer = votingFunctions.mostVotedPlayer(game.players)
      if (votedOutPlayer !== null && votedOutPlayer !== undefined) {
        votedOutPlayer.setActive(false)
      }
      votingFunctions.checkGameEnd(game)
      if (game.getState() === GAME_STATES.SHARE_WORD) {
        io.emit('start game', game.gameID)
      } else if (game.getState() === GAME_STATES.FINISHED) {
        io.emit('next round', game.gameID)
      }
    } else {
      if (game.getState() === GAME_STATES.VOTING) {
        if (player.getHasVoted() === false && player.isActive()) {
          res.redirect('/gaming/voting')
        } else {
          res.redirect('/gaming/waitingForVotes')
        }
      }
    }
  })

  gaming.get('/waitingForVotes', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'waitingForVotes.html'))
  })

  gaming.get('/finished', (req, res) => {
    const game = req.game
    if (game.getState() === GAME_STATES.SHARE_WORD) {
      res.redirect('/gaming/wordShare')
    } else if (game.getState() === GAME_STATES.FINISHED) {
      res.redirect('/gaming/next-round')
    }
  })

  gaming.get('/wordShare', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'wordShare.html'))
  })

  gaming.get('/chatRoom', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'chatRoom.html'))
  })

  gaming.post('/share-word', (req, res) => {
    if (!req.player.hasSharedword()) {
      req.players.setHasSharedWord()
    }
    req.game.wordLeft -= 1
    if (req.wordLeft === 0) {
      res.send({ ongoing: 'false' })
    }

    res.send({ ongoing: 'true' })
  })

  gaming.get('/setUpVoting', (req, res) => {
    votingFunctions.setUpVoting(req.game)
    res.redirect('/gaming/voting')
  })

  gaming.get('/leaderboard/:gameID', (req, res) => {
    try {
      const { gameID } = req.params
      const game = Game.findGame(gameID)
      if (!game) {
        return res.status(404).send('Game not found')
      }
      const winner = game.getWinner()
      const players = game.players || []
      res.render('leaderboard', {
        winner,
        leaderboard: players,
        roundsCompleted: game.roundsComplete
      })
    } catch (error) {
      res.status(500).send('Error displaying leaderboard: ' + error.message)
    }
  })

  gaming.get('/next-round', (req, res) => {
    const gameID = req.user.gameInfo?.gameId
    const game = Game.findGame(gameID)

    if (!game) {
      return res.status(404).send('Game not found')
    }

    if (game.isFinished) {
      game.startNewRound()
      return res.redirect(`/gaming/leaderboard/${gameID}`)
    }
    return res.redirect('/gaming/waiting')
  })

  return gaming
}
