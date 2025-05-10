// src/models/Comment.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isWatchlisted: { type: Boolean, default: false },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    relatedOption: { type: mongoose.Schema.Types.ObjectId, ref: 'Option' },
    isPro: { type: Boolean, default: false },
    isCon: { type: Boolean, default: false },
    votes: { type: Number, default: 0 },
    upvotedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default:[] }, // Array of User IDs who upvoted
    downvotedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User',  default:[] }, // Array of User IDs who downvoted
});

module.exports = mongoose.model('Comment', CommentSchema);
