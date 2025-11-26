const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

    chatSession : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatSession',
        required: true
    },
     questionText: {
    type: String,
    required: true
  },
  answerText: {
    type: String,
    required: true
  },
  deleted: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Question" , questionSchema);