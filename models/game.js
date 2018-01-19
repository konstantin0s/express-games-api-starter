// models/game.js
const mongoose = require('../config/database')
const { Schema } = mongoose

// const cardSchema = new Schema({
//   symbol: { type: String, required: true },
//   visible: { type: Boolean, default: false },
//   won: { type: Boolean, default: false },
// })

const griditemSchema = new Schema({
  player: { type: Number, default: 0 }
})

const playerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'users' },
  pairs: [String]
})

const gameSchema = new Schema({
  gridItems: [griditemSchema],
  players: [playerSchema],  
  turn: { type: Number, default: 0 }, // player index
  turnNumber: { type: Number, default: 1 },
  started: { type: Boolean, default: false },
  winnerId: { type: Number },
  userId: { type: Schema.Types.ObjectId, ref: 'users' },
  draw: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('games', gameSchema)
