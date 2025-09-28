const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const User = require('../models/User');

// GET /api/quiz
const getQuizzes = async (req, res) => {
    const quizzes = await Quiz.find({});
    res.json(quizzes);
};

// POST /api/quiz/result
const submitQuiz = async (req, res) => {
    const { quizId, score } = req.body;
    const quiz = await Quiz.findById(quizId);
    if(!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const pointsEarned = Math.floor((score / quiz.questions.length) * quiz.points);

    // save result
    const result = await Result.create({
        user: req.user._id,
        quiz: quiz._id,
        score,
        pointsEarned
    });

    // update user points
    req.user.points += pointsEarned;
    await req.user.save();

    res.json({ result });
};

// GET /api/quiz/leaderboard
const getLeaderboard = async (req, res) => {
    const users = await User.find().sort({ points: -1 }).limit(10).select('name points');
    res.json(users.map((u, idx) => ({ ...u.toObject(), rank: idx + 1 })));
};

module.exports = { getQuizzes, submitQuiz, getLeaderboard };
