const Option = require("../models/Option");

// Get all options
exports.getAllOptions = async (req, res, next) => {
  try {
    const options = await Option.find();
    res.json(options);
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
