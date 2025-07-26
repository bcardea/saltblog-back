const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "https://saltbloggen.netlify.app",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000", 
    "https://saltbloggen.netlify.app",
    "http://localhost:3000"
  ]
}));
app.use(express.json());

const blogRoutes = require('./routes/blog');
app.use('/api/blog', (req, res, next) => {
  req.io = io;
  next();
}, blogRoutes);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Salt Creative Blog Generator API', status: 'running' });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io };