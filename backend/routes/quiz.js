const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getQuizzes, submitQuiz, getLeaderboard } = require('../controllers/quizController');

router.get('/', protect, getQuizzes);
router.post('/result', protect, submitQuiz);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
