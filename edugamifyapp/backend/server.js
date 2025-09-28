const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const quizRoutes = require('./routes/quiz');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/quiz', quizRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('🎉 MongoDB connected successfully!');
    console.log('🎮 Educational Gamification App Backend Started!');
    console.log('📚 Ready to serve quizzes, badges, and leaderboards!');
    console.log('💾 Using MongoDB Atlas for data persistence');
})
.catch(err => {
    console.log('❌ MongoDB connection failed:', err.message);
    console.log('🔍 Check your MongoDB Atlas credentials and network access');
    process.exit(1); // Exit if MongoDB connection fails
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
