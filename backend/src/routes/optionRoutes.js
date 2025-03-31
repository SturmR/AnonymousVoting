const express = require("express");
const router = express.Router();
const optionController = require('../controllers/optionController');

// Routes
router.get('/', optionController.getAllOptions);
router.post('/', optionController.createOption);
router.get('/:id', optionController.getOptionById);
router.put('/:id', optionController.updateOption);
router.delete('/:id', optionController.deleteOption);

module.exports = router; // <- VERY IMPORTANT
