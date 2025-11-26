const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    title:{
        type:String,
        required:true
    },
    deleted: { type: Boolean, default: false },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model('ChatSession' , chatSessionSchema);