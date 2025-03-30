// src/models/Room.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String , default: "" },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}, // first we create the room, then users and host, THEN we assign the host of the room.

  type: { 
    type: String, 
    enum: ["DiscussAndVote", "PickATime"], 
    required: true 
  },

  // Common fields
  votingStart: { type: Date, required: true },
  votingEnd: { type: Date, required: true },
  canEditVote: { type: Boolean, default: true, required: true },
  editVoteUntil: { type: Date , default: Date.now },
  minOptionsPerVote: { type: Number, required: true },
  maxOptionsPerVote: { type: Number, required: true },

  // DiscussAndVote specific fields
  canAddOption: { type: Boolean , default: true },
  discussionStart: { type: Date, default: Date.now },
  discussionEnd: { type: Date, default: Date.now },

  userList: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] }, // users that are allowed to vote in this room
  voteList: { type: [mongoose.Schema.Types.ObjectId], ref: 'Vote', default: [] }, // votes that are casted in this room
  optionList: { type: [mongoose.Schema.Types.ObjectId], ref: 'Option', default: [] },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);
