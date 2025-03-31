const Vote = require("../models/Vote");

// Get all votes
exports.getAllVotes = async (req, res, next) => {
  try {
    const votes = await Vote.find();
    res.json(votes);
  } catch (err) {
    next(err);
  }
};

// Create vote
exports.createVote = async (req, res, next) => {
  try {
    const vote = await Vote.create(req.body);
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
    const vote = await Vote.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vote) return res.status(404).json({ message: "Vote not found" });
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
    res.json({ message: "Vote deleted successfully" });
  } catch (err) {
    next(err);
  }
};
