const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getAllQuizzes, getQuizById, submitQuiz, getLeaderboard, getUserProgress } = require('../controllers/quizController');

// Get all available quizzes (public)
router.get('/', getAllQuizzes);

// Get leaderboard (public)
router.get('/leaderboard', getLeaderboard);

// Get user progress (protected)
router.get('/progress/:userId', protect, getUserProgress);

// Get specific quiz by ID (public)
router.get('/:id', getQuizById);

// Submit quiz answers (protected)
router.post('/:id/submit', protect, submitQuiz);

module.exports = router;
