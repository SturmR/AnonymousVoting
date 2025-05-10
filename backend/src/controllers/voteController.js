const Vote = require("../models/Vote");
const Room = require("../models/Room");
const Option = require("../models/Option");

// Get all votes
exports.getAllVotes = async (req, res, next) => {
  try {
    const { room, user } = req.query;
    let filter = {};

    if (room) {
      filter.room = room;
    }
    if (user) {
      filter.user = user;
    }
    console.log("Filter:", filter);
    const votes = await Vote.find(filter);
    res.json(votes);
  } catch (err) {
    next(err);
  }
};

// Create vote
exports.createVote = async (req, res, next) => {
  try {
    const { room, user, optionList } = req.body;
    const vote = await Vote.create(req.body);
    await Promise.all(
      optionList.map(optId =>
        Option.findByIdAndUpdate(optId, { $inc: { numberOfVotes: 1 } })
      )
    );
    await Room.findByIdAndUpdate(room, { $push: { voteList: vote._id } }, { new: true });
    res.status(201).json(vote);
  } catch (err) {
    next(err);
  }
};

// Get vote by ID
exports.getVoteById = async (req, res, next) => {
  try {
    const vote = await Vote.findById(req.params.id);
    if (!vote) return res.status(404).json({ message: "Vote not found" });
    res.json(vote);
  } catch (err) {
    next(err);
  }
};

// Update vote
exports.updateVote = async (req, res, next) => {
  try {
    // decrement the vote count for the old options
    const oldVote = await Vote.findById(req.params.id);
    if (!oldVote) return res.status(404).json({ message: "Vote not found" });
    await Promise.all(
      oldVote.optionList.map(optId =>
        Option.findByIdAndUpdate(optId, { $inc: { numberOfVotes: -1 } })
      )
    );
    const vote = await Vote.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // increment the vote count for the new options
    await Promise.all(
      req.body.optionList.map(optId =>
        Option.findByIdAndUpdate(optId, { $inc: { numberOfVotes: 1 } })
      )
    );
    await Vote.findByIdAndUpdate(req.params.id);
    await Room.findByIdAndUpdate(
      vote.room,
      { $pull: { voteList: vote._id } }
    );
    res.json(vote);
  } catch (err) {
    next(err);
  }
};

// Delete vote
exports.deleteVote = async (req, res, next) => {
  try {
    const vote = await Vote.findByIdAndDelete(req.params.id);
    if (!vote) return res.status(404).json({ message: "Vote not found" });
    
    // Remove from Room.voteList
    await Room.findByIdAndUpdate(vote.room, { $pull: { voteList: vote._id } });

    // Decrement each Option’s counter
    await Promise.all(
      vote.optionList.map(optId =>
        Option.findByIdAndUpdate(optId, { $inc: { numberOfVotes: -1 } })
      )
    );
    res.json({ message: "Vote deleted successfully" });
  } catch (err) {
    next(err);
  }
};
