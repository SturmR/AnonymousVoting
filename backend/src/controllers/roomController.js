const Room = require("../models/Room");
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Get all rooms
exports.getAllRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// Create room
exports.createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
};

// Get room by ID
exports.getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    next(err);
  }
};

// Update room
exports.updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    next(err);
  }
};

// Delete room
exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    next(err);
  }
};

exports.remindNonVoters = async (req, res) => {
  console.log("inside controller");
  console.log('>>> remindNonVoters payload:', req.body);
  try {
    const roomId = req.params.id;
    const { userIds } = req.body;

    // 1) Fetch room to get its name
    const room = await Room.findById(roomId).lean();
    if (!room) {
      console.error('Room not found:', roomId);
      return res.status(404).json({ error: 'Room not found' });
    }
    // 2) Lookup emails
    const users = await User.find({ _id: { $in: userIds } }, 'email').lean();
    console.log('Found users for reminder:', users);
    const emails = users.map(u => u.email);
    if (!emails.length) {
      console.error('No valid emails found for IDs:', userIds);
      return res.status(400).json({ error: 'No valid users' });
    }
    // 3) Configure your transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: +process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    transporter.verify((err, success) => {
      if (err) console.error('SMTP verification error:', err);
      else      console.log('SMTP server is ready to take messages');
    });    

    // 4) Send emails
    await Promise.all(
      emails.map(address =>
        transporter.sendMail({
          from: `"No-Reply" <no-reply@discussandvote.com>`,
          to: address,
          subject: `Reminder to vote in "${room.title}"`,
          html: `
            <p>Hello!</p>
            <p>You haven’t voted yet in the poll "<strong>${room.title}</strong>".</p>
            <p>
              <a href="${process.env.APP_URL}/rooms/${roomId}">
                Click here to cast your vote
              </a>
            </p>
          `
        })
      )
    );

    // console.log('Emails sent results:', results);

    res.json({ success: true, count: emails.length });
  } catch (err) {
    console.error('>>> remindNonVoters ERROR:', err);
    console.error(err);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
};
