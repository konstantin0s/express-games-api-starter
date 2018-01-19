// routes/games.js
const router = require('express').Router()
const passport = require('../config/auth')
const { Game } = require('../models')
// const utils = require('../lib/utils')

const authenticate = passport.authorize('jwt', { session: false })

module.exports = io => {
  router
    .get('/games', (req, res, next) => {
      Game.find()
        // Newest games first
        .sort({ createdAt: -1 })
        // Send the data in JSON format
        .then((games) => res.json(games))
        // Throw a 500 error if something goes wrong
        .catch((error) => next(error))
    })
    .get('/games/:id', (req, res, next) => {
      const id = req.params.id

      Game.findById(id)
        .then((game) => {
          if (!game) { return next() }
          res.json(game)
        })
        .catch((error) => next(error))
    })
    .post('/games', authenticate, (req, res, next) => {
      const newGame = {
        userId: req.account._id,
        players: [{
          userId: req.account._id,
          pairs: []
        }]
      }

      Game.create(newGame)
        .then((game) => {
          io.emit('action', {
            type: 'GAME_CREATED',
            payload: game
          })
          res.json(game)
        })
        .catch((error) => next(error))
    })
    .put('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id

      Game.findById(id)
        .then((game) => {
          const basegridItems = [{ 'player': 0 },{ 'player': 0 },{ 'player': 0 },{ 'player': 0 },{ 'player': 0 },{ 'player': 0 },{ 'player': 0 },{ 'player': 0 },{ 'player': 0 }]
          const GridItemsExist = game.gridItems.length > 0 ? game.gridItems : basegridItems
          console.log(GridItemsExist)
          const currentPlayer = (game.turnNumber % 2) > 0 ? 1 : 2
          console.log('CURRENTPLAYER', currentPlayer)
          const newGridItems = GridItemsExist.map((gridItem, index) => {
            if (index === req.body.buttonId)
              return { player: currentPlayer}
            return gridItem
          })
          const winnable = game.turnNumber > 4
          const won = () => {
            if (
            (game.gridItems[0].player == currentPlayer && game.gridItems[1].player == currentPlayer && game.gridItems[2].player == currentPlayer) ||
            (game.gridItems[3].player == currentPlayer && game.gridItems[4].player == currentPlayer && game.gridItems[5].player == currentPlayer) ||
            (game.gridItems[6].player == currentPlayer && game.gridItems[7].player == currentPlayer && game.gridItems[8].player == currentPlayer) ||
            (game.gridItems[0].player == currentPlayer && game.gridItems[3].player == currentPlayer && game.gridItems[6].player == currentPlayer) ||
            (game.gridItems[1].player == currentPlayer && game.gridItems[4].player == currentPlayer && game.gridItems[7].player == currentPlayer) ||
            (game.gridItems[2].player == currentPlayer && game.gridItems[5].player == currentPlayer && game.gridItems[8].player == currentPlayer) ||
            (game.gridItems[0].player == currentPlayer && game.gridItems[4].player == currentPlayer && game.gridItems[8].player == currentPlayer) ||
            (game.gridItems[2].player == currentPlayer && game.gridItems[4].player == currentPlayer && game.gridItems[6].player == currentPlayer)
            ) {
              return currentPlayer
            }
            return 0
          }
          const isDraw = game.turnNumber > 8 && won() === 0
          console.log(isDraw)
          const winner = won()
          console.log(winner)
          const newGame = {
            turnNumber: game.turnNumber + 1,
            turn: game.turn,
            gridItems: newGridItems,
            winnerId: winner,
            draw: isDraw
          } 
          return newGame
        })
        .then((res) => {
          Game.findByIdAndUpdate(id, { $set: res }, { new: true })
            .then((game) => {
              io.emit('action', {
                type: 'GAME_UPDATED',
                payload: game
              })
            })
            .catch(err => console.error(err))
            })
        .catch((error) => console.error(error))
        
    })
    .patch('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      const patchForGame = req.body

      Game.findById(id)
        .then((game) => {
          if (!game) { return next() }

          const updatedGame = { ...game, ...patchForGame }

          Game.findByIdAndUpdate(id, { $set: updatedGame }, { new: true })
            .then((game) => {
              io.emit('action', {
                type: 'GAME_UPDATED',
                payload: game
              })
              res.json(game)
            })
            .catch((error) => next(error))
        })
        .catch((error) => next(error))
    })
    .delete('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      Game.findByIdAndRemove(id)
        .then(() => {
          io.emit('action', {
            type: 'GAME_REMOVED',
            payload: id
          })
          res.status = 200
          res.json({
            message: 'Removed',
            _id: id
          })
        })
        .catch((error) => next(error))
    })

  return router
}
