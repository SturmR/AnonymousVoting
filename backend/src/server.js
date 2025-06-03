require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require("path"); 

// Route handlers
const roomRoutes    = require('./routes/roomRoutes');
const optionRoutes  = require('./routes/optionRoutes');
const userRoutes    = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');
const voteRoutes    = require('./routes/voteRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Health-check endpoint
app.get('/healthz', (req, res) => res.send('OK'));

// Bootstrap the database and start the server
(async () => {
  try {
    // Connect to MongoDB via Mongoose
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('🗄️  MongoDB connected via Mongoose.');

    // Mount API routes
    app.use('/api/rooms', roomRoutes);
    app.use('/api/options', optionRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/comments', commentRoutes);
    app.use('/api/votes', voteRoutes);

    // Global error handler
    app.use((err, req, res, next) => {
      console.error(err.stack);
      const status  = err.statusCode || 500;
      const message = err.message    || 'Internal Server Error';
      res.status(status).json({ message });
    });

    // 3) Serve React’s build folder as static assets
    //    (Make sure “build” really lives at ../build relative to this file)
    app.use(express.static(path.join(__dirname, "../build")));

    // 4) Catch-all: for any request that didn’t match /api, send back index.html
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../build/index.html"));
    });

    // Start listening
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
