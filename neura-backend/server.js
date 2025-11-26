// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const ChatSession = require('./models/ChatSession');
const Question = require('./models/Question');
// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const { getAnswerFromGemini } = require('./services/geminiService'); 

const app = express();
// ✅ Enable CORS for frontend (adjust port as per your frontend)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true,
}));


app.use(express.json());

// Create HTTP + WebSocket server
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // frontend URL if you want to restrict
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ----------------------------
// MongoDB Connection
// ----------------------------
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in .env');
    }
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};

// ----------------------------
// REST API Routes
// ----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// ----------------------------
// Socket.IO Logic
// ----------------------------
async function streamFromLLM(socket, sessionId, userMessage, context = []) {
  // Simulate streaming chunks
  const simulatedChunks = [
    userMessage
  ];
  for (let i = 0; i < simulatedChunks.length; i++) {
    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
    socket.emit('assistant_chunk', {
      chunk: simulatedChunks[i],
      isFinal: i === simulatedChunks.length - 1
    });
  }
}

io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);
  socket.context = [];

  socket.on('user_message', async ({ sessionId, text }) => {
    console.log(`🗣️ User message: ${text}`);
    socket.context.push({ role: 'user', content: text });
    try {
      const answerText = await getAnswerFromGemini(text);
      // Save question + answer to DB
          const newQuestion = new Question({
             chatSession: sessionId, // make sure this is a valid ObjectId
             questionText: text,
             answerText: answerText
          });
          await newQuestion.save();
      
      await streamFromLLM(socket, sessionId, answerText, socket.context);
      socket.context.push({ role: 'assistant', content: '[assistant final text placeholder]' });
      socket.emit('assistant_done');
    } catch (err) {
      console.error('LLM stream error:', err);
      socket.emit('assistant_error', { message: 'Assistant failed' });
    }
  });

  socket.on('interrupt', ({ reason = 'user_interrupt' }) => {
    console.log('🚫 Assistant interrupted:', reason);
    // Cancel LLM stream here if using a real model
    socket.emit('assistant_cancelled', { reason });
  });

  socket.on('disconnect', () => {
    console.log(`❎ Client disconnected: ${socket.id}`);
  });
});

// ----------------------------
// Start Server
// ----------------------------
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

startServer();
