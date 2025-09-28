const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    quizTitle: { type: String, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    points: { type: Number, required: true },
    timeSpent: { type: Number, required: true },
    results: [{
        question: String,
        userAnswer: Number,
        correctAnswer: Number,
        isCorrect: Boolean,
        points: Number
    }],
    newBadges: [{
        name: String,
        description: String,
        icon: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
