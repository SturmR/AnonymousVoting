// src/models/Vote.js
const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  optionList: { type: [mongoose.Schema.Types.ObjectId], ref: 'Option', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Vote', VoteSchema);
