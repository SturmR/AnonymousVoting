const axios    = require('axios');
const Comment  = require("../models/Comment");
const Option   = require("../models/Option");
const HF_URL   = 'https://router.huggingface.co/hf-inference/models';
const MODEL    = 'sentence-transformers/all-MiniLM-L6-v2';
const HF_TOKEN = process.env.HF_TOKEN;

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
    const userId = req.query.userId; // Get userId from query

    const comments = await Comment
      .find(filter)
      .populate('relatedOption', 'content')
      .populate('user', 'username')
      .lean();  // Use lean() to get plain JavaScript objects, which are easier to modify

    // Attach user's vote status to each comment
    const commentsWithVoteStatus = comments.map(comment => {
      return {
        ...comment,
        upvoted: comment.upvotedBy.includes(userId),
        downvoted: comment.downvotedBy.includes(userId),
      };
    });
    res.json(commentsWithVoteStatus);
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

    const userId = req.body.user;
    const upvotedIndex = comment.upvotedBy.indexOf(userId);
    const downvotedIndex = comment.downvotedBy.indexOf(userId);

    if (upvotedIndex === -1) {
      // User has not upvoted before
      comment.upvotedBy.push(userId);
      comment.votes += 1;
      if (downvotedIndex > -1) {
        comment.downvotedBy.splice(downvotedIndex, 1);
        comment.votes += 1;  // Correctly adjust votes when removing a downvote
      }
    } else {
      // User has already upvoted; remove the upvote
      comment.upvotedBy.splice(upvotedIndex, 1);
      comment.votes -= 1;
    }
    await comment.save();
    res.json({ votes: comment.votes });
  } catch (err) {
    next(err);
  }
};

// Downvote comment
exports.downvoteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const userId = req.body.user;
    const upvotedIndex = comment.upvotedBy.indexOf(userId);
    const downvotedIndex = comment.downvotedBy.indexOf(userId);

    if (downvotedIndex === -1) {
      // User has not downvoted before
      comment.downvotedBy.push(userId);
      comment.votes -= 1;
      if (upvotedIndex > -1) {
        comment.upvotedBy.splice(upvotedIndex, 1);
        comment.votes -= 1; // Correctly adjust votes when removing an upvote
      }
    } else {
      // User has already downvoted; remove the downvote
      comment.downvotedBy.splice(downvotedIndex, 1);
      comment.votes += 1;
    }

    await comment.save();
    res.json({ votes: comment.votes });
  } catch (err) {
    next(err);
  }
};

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (normA * normB);
}

exports.checkSimilarity = async (req, res, next) => {
  console.log('HF_TOKEN is:', !!process.env.HF_TOKEN);
  try {
    const { room, content } = req.body;
    const existing = await Comment.find({ room }).lean();
    const texts = [content, ...existing.map(c => c.content)];

    // call HF Inference API
    const { data: embeddings } = await axios.post(
      // router URL + pipeline path
      `${HF_URL}/${MODEL}/pipeline/feature-extraction`,
      { inputs: texts },
      { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
    );

    const [embNew, ...embs] = embeddings;
    let best = { idx: -1, sim: -1 };
    embs.forEach((emb, i) => {
      const sim = cosineSimilarity(embNew, emb);
      if (sim > best.sim) best = { idx: i, sim };
    });

    if (best.sim >= 0.8) {
      return res.json({
        similar:   true,
        comment:   existing[best.idx],
        similarity: best.sim
      });
    }
    res.json({ similar: false });
  } catch (err) {
    next(err);
  }
};