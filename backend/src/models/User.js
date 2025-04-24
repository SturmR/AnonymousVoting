// src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    username: { type: String, required: true },
    isWatchlisted: { type: Boolean, default: false },
    email: { type: String, required: true },
    password: { type: String, default: '' },
});

module.exports = mongoose.model('User', UserSchema);
