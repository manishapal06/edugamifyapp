const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if(userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, password });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            points: user.points || 0,
            badges: user.badges || [],
            token: generateToken(user._id),
            message: '🎉 Welcome to EduGamify! Start earning points and badges!'
        });
    } catch(err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if(user && await user.matchPassword(password)) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                points: user.points || 0,
                badges: user.badges || [],
                token: generateToken(user._id),
                message: `🎮 Welcome back, ${user.name}!`
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch(err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
