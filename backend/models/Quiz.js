const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: String,
    options: [String],
    correctAnswer: Number
});

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    questions: [questionSchema],
    timeLimit: Number, // in seconds
    difficulty: { type: String, default: 'Medium' },
    points: { type: Number, default: 100 },
    subject: String
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
