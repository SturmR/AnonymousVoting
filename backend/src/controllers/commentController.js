const Comment = require("../models/Comment");
const Option  = require("../models/Option");

// Get all comments
exports.getAllComments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.room) filter.room = req.query.room;
    if (req.query.relatedOption) filter.relatedOption = req.query.relatedOption;
    if (req.query.user) filter.user = req.query.user;
    if (req.query.isWatchlisted) filter.isWatchlisted = req.query.isWatchlisted;
    if (req.query.isPro) filter.isPro = req.query.isPro;
    if (req.query.isCon) filter.isCon = req.query.isCon;    
    const comments = await Comment
      .find(filter)
      .populate('relatedOption', 'content')
      .populate('user', 'username');
    res.json(comments);
  } catch (err) {
    next(err);
  }
};

// Create comment
exports.createComment = async (req, res, next) => {
  try {
    const comment = await Comment.create(req.body);
    if (comment.relatedOption) {
      const inc = {};
      if (comment.isPro) inc.numberOfProComments = 1;
      if (comment.isCon) inc.numberOfConComments = 1;
      if (Object.keys(inc).length > 0) {
        await Option.findByIdAndUpdate(
          comment.relatedOption,
          { $inc: inc },
          { new: true }
        );
      }
    }
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

// Get comment by ID
exports.getCommentById = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    next(err);
  }
};

// Update comment
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    next(err);
  }
};

// Delete comment
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Upvote comment
exports.upvoteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (typeof comment.votes !== 'number') {
      comment.votes = 0; // fallback in case field was missing
    }

    const userId = req.body.user;        // ← grab the user ID from the request body
    if (!comment.upvotedBy.includes(userId)) {
      // remove prior downvote if any
      const di = comment.downvotedBy.indexOf(userId);
      if (di > -1) {
        comment.downvotedBy.splice(di, 1);
        comment.votes += 1;             // undo that downvote
      }
      // record this upvote
      comment.upvotedBy.push(userId);
      comment.votes += 1;
      await comment.save();
    }
    res.json(comment);
  } catch (err) {
    next(err);
  }
};

// Downvote comment
exports.downvoteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (typeof comment.votes !== 'number') {
      comment.votes = 0;
    }

    const userId = req.body.user;        // ← grab the user ID from the request body
    if (!comment.downvotedBy.includes(userId)) {
      // remove prior downvote if any
      const di = comment.upvotedBy.indexOf(userId);
      if (di > -1) {
        comment.upvotedBy.splice(di, 1);
        comment.votes -= 1;             // undo that downvote
      }
      // record this upvote
      comment.downvotedBy.push(userId);
      comment.votes -= 1;
      await comment.save();
    }
    res.json(comment);
  } catch (err) {
    next(err);
  }
};

