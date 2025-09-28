const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getBadges } = require('../controllers/userController');

router.get('/badges', protect, getBadges);

module.exports = router;
