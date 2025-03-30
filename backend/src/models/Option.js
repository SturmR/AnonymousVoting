// src/models/Option.js
const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    isWatchlisted: { type: Boolean, default: false },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    numberOfVotes: { type: Number, default: 0 },
    numberOfProComments: { type: Number, default: 0 },
    numberOfConComments: { type: Number, default: 0 },
});

module.exports = mongoose.model('Option', OptionSchema);
