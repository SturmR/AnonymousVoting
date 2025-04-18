const express = require("express");
const router = express.Router();
const commentController = require('../controllers/commentController');

// Routes
router.get('/', commentController.getAllComments);
router.post('/', commentController.createComment);
router.get('/:id', commentController.getCommentById);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

router.post('/:id/upvote', commentController.upvoteComment);
router.post('/:id/downvote', commentController.downvoteComment);

module.exports = router; // <- VERY IMPORTANT
