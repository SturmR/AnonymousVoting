const express = require("express");
const router = express.Router();
const voteController = require('../controllers/voteController');

// Routes
router.get('/', voteController.getAllVotes);
router.post('/', voteController.createVote);
router.get('/:id', voteController.getVoteById);
router.put('/:id', voteController.updateVote);
router.delete('/:id', voteController.deleteVote);

module.exports = router; // <- VERY IMPORTANT
