const Option = require("../models/Option");
const Comment = require("../models/Comment");

// Get all options
exports.getAllOptions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.room) filter.room = req.query.room;

    // 1) fetch all options for this room
    const optionsList = await Option.find(filter).lean();

    // 2) for each option, count pro- and con-comments
    const withCounts = await Promise.all(
      optionsList.map(async opt => {
        const proCount = await Comment.countDocuments({
          relatedOption: opt._id,
          isPro: true
        });
        const conCount = await Comment.countDocuments({
          relatedOption: opt._id,
          isCon: true
        });
        return {
          ...opt,
          numberOfProComments: proCount,
          numberOfConComments: conCount
        };
      })
    );

    // 3) return enhanced array
    res.json(withCounts);
  } catch (err) {
    next(err);
  }
};

// Create option
exports.createOption = async (req, res, next) => {
  try {
    const option = await Option.create(req.body);
    res.status(201).json(option);
  } catch (err) {
    next(err);
  }
};

// Get option by ID
exports.getOptionById = async (req, res, next) => {
  try {
    const option = await Option.findById(req.params.id);
    if (!option) return res.status(404).json({ message: "Option not found" });
    res.json(option);
  } catch (err) {
    next(err);
  }
};

// Update option
exports.updateOption = async (req, res, next) => {
  try {
    const option = await Option.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!option) return res.status(404).json({ message: "Option not found" });
    res.json(option);
  } catch (err) {
    next(err);
  }
};

// Delete option
exports.deleteOption = async (req, res, next) => {
  try {
    const option = await Option.findByIdAndDelete(req.params.id);
    if (!option) return res.status(404).json({ message: "Option not found" });
    res.json({ message: "Option deleted successfully" });
  } catch (err) {
    next(err);
  }
};
