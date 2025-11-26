// routes/chat.js
const express = require('express');
const moment = require('moment'); 
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ChatSession = require('../models/ChatSession');
const Question = require('../models/Question');
const { getAnswerFromGemini } = require('../services/geminiService'); 

// Create new chat session
router.post('/new', authMiddleware, async (req, res) => {
  try {
    const newSession = new ChatSession({
      user: req.user.id,
      title: "New Chat"
    });
    await newSession.save();
    res.json(newSession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all chat sessions for user
router.get('/history', authMiddleware, async (req, res) => {
 try {
    const sessions = await ChatSession.find({ user: req.user.id, deleted: false }).sort({ createdAt: -1 });
    const formattedSessions = sessions.map(session => ({
      _id: session._id,
      user: session.user,
      title: session.title,
      deleted: session.deleted,
      createdAt:moment(session.createdAt).format('DD:MM:YY HH:mm:ss')


    }));
    res.json(formattedSessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all questions for a specific session
router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const questions = await Question.find({ chatSession: req.params.sessionId }).sort({ createdAt: 1 });
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// Add a question and get answer from Gemini
router.post('/:sessionId/question', authMiddleware, async (req, res) => {
  try {
    const { questionText } = req.body;
      
    // Call Gemini API
    const answerText = await getAnswerFromGemini(questionText);
    
    // Save question + answer to DB
    const newQuestion = new Question({
      chatSession: req.params.sessionId,
      questionText,
      answerText
    });
    await newQuestion.save();

    // Return answer to frontend
    res.json({
      sessionId: req.params.sessionId,
      question: questionText,
      answer: answerText
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/:sessionId/delete',authMiddleware , async(req,res) => {
  try{
    const {sessionId} = req.params;
    const updateDeleted = await ChatSession.findByIdAndUpdate(
      sessionId,
      {deleted : true},
      {new:true}
    )

    if(!updateDeleted) {
      return res.status(404).json({message : "Chat session not found"});
    }

    res.json({message:"Chat session deleted successfully"})

  }catch(err){
    console.error("Error soft deleting chat session:", err);
    res.status(500).json({ message: "Failed to delete chat session" });
  }
});

router.post('/:sessionId/rename',authMiddleware , async(req,res) => {
  try{
    const {sessionId} = req.params;
    const {newTitle} = req.body;

    if(!newTitle || !newTitle.trim()){
     return res.status(400).json({message: "New title is required"});
    }

    const updateTitle = await ChatSession.findByIdAndUpdate(
      sessionId,
      {title : newTitle.trim()},
      {new:true}
    )

    if(!updateTitle) {
      return res.status(404).json({message : "Chat session not found"});
    }

    res.json({message:"Chat session renamed successfully"})

  }catch(err){
    console.error("Error rename chat session:", err);
    res.status(500).json({ message: "Failed to rename chat session" });
  }
});
    

// Upload voice and get answer (placeholder)
router.post('/:sessionId/voice', authMiddleware, async (req, res) => {
  try {
    // For now, we just return a dummy answer
    // Later, you will process req.file or base64 audio and call Gemini API

    const dummyAnswer = "This is a placeholder answer from the voice input.";

    res.json({
      sessionId: req.params.sessionId,
      answer: dummyAnswer
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
