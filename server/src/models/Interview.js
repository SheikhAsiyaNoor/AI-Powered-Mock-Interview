const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'ai'], required: true },
    content: { type: String, required: true },
    timeStamp: { type: Date, default: Date.now }
})

const interviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    domain: { type: String, required: true },
    score: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 },
    messages: [MessageSchema],
    feedback: { type: String, default: '' },
    isComplete: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Interview", interviewSchema)