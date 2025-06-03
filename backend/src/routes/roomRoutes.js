const express = require("express");
const router = express.Router();
const roomController = require('../controllers/roomController');

// Routes
router.get('/', roomController.getAllRooms);
router.post('/', roomController.createRoom);
router.get('/:id', roomController.getRoomById);
router.put('/:id', roomController.updateRoom);

router.post('/:id/send-invites', roomController.sendInviteEmails);

// send reminder emails to non-voters
router.post('/:id/remind', roomController.remindNonVoters);

router.delete('/:id', roomController.deleteRoom);

module.exports = router; // <- VERY IMPORTANT
