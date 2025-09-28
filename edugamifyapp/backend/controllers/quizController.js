const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const User = require('../models/User');

// Initialize sample quizzes in MongoDB
const initializeQuizzes = async () => {
    try {
        const existingQuizzes = await Quiz.countDocuments();
        if (existingQuizzes === 0) {
            const sampleQuizzes = [
                {
                    title: "JavaScript Fundamentals",
                    description: "Test your knowledge of JavaScript basics",
                    difficulty: "beginner",
                    points: 100,
                    timeLimit: 300,
                    questions: [
                        {
                            question: "What is the correct way to declare a variable in JavaScript?",
                            options: ["var myVar;", "variable myVar;", "v myVar;", "declare myVar;"],
                            correctAnswer: 0,
                            points: 25
                        },
                        {
                            question: "Which method is used to add an element to the end of an array?",
                            options: ["append()", "push()", "add()", "insert()"],
                            correctAnswer: 1,
                            points: 25
                        },
                        {
                            question: "What does '===' operator do in JavaScript?",
                            options: ["Assignment", "Comparison without type checking", "Strict equality comparison", "Not equal"],
                            correctAnswer: 2,
                            points: 25
                        },
                        {
                            question: "How do you create a function in JavaScript?",
                            options: ["function myFunction() {}", "create myFunction() {}", "def myFunction() {}", "func myFunction() {}"],
                            correctAnswer: 0,
                            points: 25
                        }
                    ]
                },
                {
                    title: "React Basics",
                    description: "Learn the fundamentals of React",
                    difficulty: "intermediate",
                    points: 150,
                    timeLimit: 450,
                    questions: [
                        {
                            question: "What is JSX?",
                            options: ["JavaScript XML", "Java Syntax Extension", "JSON Extension", "JavaScript Extension"],
                            correctAnswer: 0,
                            points: 30
                        },
                        {
                            question: "How do you create a React component?",
                            options: ["React.createComponent()", "function Component() {}", "new React.Component()", "React.component()"],
                            correctAnswer: 1,
                            points: 30
                        },
                        {
                            question: "What is the purpose of useState hook?",
                            options: ["To fetch data", "To manage component state", "To handle events", "To create components"],
                            correctAnswer: 1,
                            points: 30
                        },
                        {
                            question: "How do you pass data to a child component?",
                            options: ["Through state", "Through props", "Through context", "Through refs"],
                            correctAnswer: 1,
                            points: 30
                        },
                        {
                            question: "What is the virtual DOM?",
                            options: ["A copy of the real DOM", "A JavaScript representation of the DOM", "A database", "A server"],
                            correctAnswer: 1,
                            points: 30
                        }
                    ]
                },
                {
                    title: "Node.js Essentials",
                    description: "Master Node.js backend development",
                    difficulty: "advanced",
                    points: 200,
                    timeLimit: 600,
                    questions: [
                        {
                            question: "What is Node.js?",
                            options: ["A JavaScript framework", "A JavaScript runtime", "A database", "A web browser"],
                            correctAnswer: 1,
                            points: 40
                        },
                        {
                            question: "Which module is used to create a web server in Node.js?",
                            options: ["fs", "http", "path", "url"],
                            correctAnswer: 1,
                            points: 40
                        },
                        {
                            question: "What is npm?",
                            options: ["Node Package Manager", "New Programming Method", "Node Programming Module", "Network Protocol Manager"],
                            correctAnswer: 0,
                            points: 40
                        },
                        {
                            question: "How do you handle asynchronous operations in Node.js?",
                            options: ["Callbacks only", "Promises only", "Async/Await only", "Callbacks, Promises, and Async/Await"],
                            correctAnswer: 3,
                            points: 40
                        },
                        {
                            question: "What is Express.js?",
                            options: ["A database", "A web framework for Node.js", "A testing library", "A package manager"],
                            correctAnswer: 1,
                            points: 40
                        }
                    ]
                }
            ];

            await Quiz.insertMany(sampleQuizzes);
            console.log('📚 Sample quizzes created in MongoDB!');
        }
    } catch (error) {
        console.error('Error initializing quizzes:', error);
    }
};

// Call initialization when module loads
initializeQuizzes();

// Badge system with enhanced icons and descriptions
const badges = [
    { name: "First Steps", description: "Complete your first quiz", icon: "🎯", requirement: { type: "quizzes_completed", value: 1 } },
    { name: "Knowledge Seeker", description: "Complete 5 quizzes", icon: "📚", requirement: { type: "quizzes_completed", value: 5 } },
    { name: "Quiz Master", description: "Complete 10 quizzes", icon: "🏆", requirement: { type: "quizzes_completed", value: 10 } },
    { name: "Perfect Score", description: "Get 100% on any quiz", icon: "⭐", requirement: { type: "perfect_score", value: 1 } },
    { name: "Speed Demon", description: "Complete a quiz in under 2 minutes", icon: "⚡", requirement: { type: "speed", value: 120 } },
    { name: "Point Collector", description: "Earn 500 points", icon: "💎", requirement: { type: "total_points", value: 500 } },
    { name: "Streak Master", description: "Complete 3 quizzes in a row", icon: "🔥", requirement: { type: "streak", value: 3 } },
    { name: "JavaScript Ninja", description: "Complete JavaScript Fundamentals with 90%+", icon: "🥷", requirement: { type: "specific_quiz", value: "javascript", score: 90 } },
    { name: "React Rockstar", description: "Complete React Basics with 90%+", icon: "⚛️", requirement: { type: "specific_quiz", value: "react", score: 90 } },
    { name: "Node.js Expert", description: "Complete Node.js Essentials with 90%+", icon: "🚀", requirement: { type: "specific_quiz", value: "nodejs", score: 90 } },
];

// Get all quizzes
exports.getAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find().select('-questions.correctAnswer');
        res.json({
            success: true,
            count: quizzes.length,
            quizzes: quizzes,
            message: "📚 Available quizzes loaded from MongoDB Atlas!"
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get quiz by ID
exports.getQuizById = async (req, res) => {
    try {
        const { id } = req.params;
        const quiz = await Quiz.findById(id).select('-questions.correctAnswer');
        
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        
        res.json({
            success: true,
            quiz: quiz,
            message: `🎯 Starting ${quiz.title}!`
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Submit quiz answers
exports.submitQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers, timeSpent, userId } = req.body;
        
        // Find the quiz with correct answers
        const quiz = await Quiz.findById(id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        
        // Calculate score
        let correctAnswers = 0;
        let totalPoints = 0;
        const results = [];
        
        quiz.questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            const questionPoints = question.points || 0;
            if (isCorrect) {
                correctAnswers++;
                totalPoints += questionPoints;
            }
            results.push({
                question: question.question,
                userAnswer: userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect: isCorrect,
                points: isCorrect ? questionPoints : 0
            });
        });
        
        const percentage = Math.round((correctAnswers / quiz.questions.length) * 100);
        
        // Ensure totalPoints is never NaN
        totalPoints = isNaN(totalPoints) ? 0 : totalPoints;
        
        // Check for new badges
        const newBadges = [];
        
        // Perfect score badge
        if (percentage === 100) {
            const badge = badges.find(b => b.name === "Perfect Score");
            if (badge) newBadges.push(badge);
        }
        
        // Speed badge
        if (timeSpent < 120) {
            const badge = badges.find(b => b.name === "Speed Demon");
            if (badge) newBadges.push(badge);
        }
        
        // First Steps badge (check if this is user's first quiz)
        const userResults = await Result.countDocuments({ userId: userId });
        if (userResults === 0) {
            const badge = badges.find(b => b.name === "First Steps");
            if (badge) newBadges.push(badge);
        }
        
        // Subject-specific badges for high scores
        if (percentage >= 90) {
            if (quiz.title.toLowerCase().includes('javascript')) {
                const badge = badges.find(b => b.name === "JavaScript Ninja");
                if (badge) newBadges.push(badge);
            } else if (quiz.title.toLowerCase().includes('react')) {
                const badge = badges.find(b => b.name === "React Rockstar");
                if (badge) newBadges.push(badge);
            } else if (quiz.title.toLowerCase().includes('node')) {
                const badge = badges.find(b => b.name === "Node.js Expert");
                if (badge) newBadges.push(badge);
            }
        }
        
        // Save result to MongoDB
        const result = new Result({
            userId: userId,
            quizId: id,
            quizTitle: quiz.title,
            score: correctAnswers,
            totalQuestions: quiz.questions.length,
            percentage: percentage,
            points: totalPoints,
            timeSpent: timeSpent,
            results: results,
            newBadges: newBadges
        });
        
        await result.save();
        
        // Update user points and badges
        const user = await User.findById(userId);
        if (user) {
            user.points = (user.points || 0) + totalPoints;
            
            // Add new badges to user
            newBadges.forEach(badge => {
                const existingBadge = user.badges.find(b => b.name === badge.name);
                if (!existingBadge) {
                    user.badges.push({ name: badge.name, earned: true, earnedAt: new Date() });
                }
            });
            
            await user.save();
            console.log(`💎 User ${user.name} earned ${totalPoints} points! Total: ${user.points}`);
        }
        
        res.json({
            success: true,
            result: {
                score: correctAnswers,
                totalQuestions: quiz.questions.length,
                percentage: percentage,
                points: totalPoints,
                timeSpent: timeSpent,
                newBadges: newBadges,
                results: results
            },
            message: `🎉 Quiz completed! You scored ${percentage}% and earned ${totalPoints} points!`,
            badges: newBadges.length > 0 ? `🏆 New badges earned: ${newBadges.map(b => b.icon + ' ' + b.name).join(', ')}` : null
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
    try {
        const users = await User.find()
            .select('name points badges')
            .sort({ points: -1 })
            .limit(10);
        
        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            name: user.name,
            points: user.points || 0,
            badges: user.badges ? user.badges.filter(b => b.earned).length : 0
        }));
        
        res.json({
            success: true,
            leaderboard: leaderboard,
            message: "🏆 Current leaderboard from MongoDB Atlas!"
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get user progress
exports.getUserProgress = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get user's results
        const userResults = await Result.find({ userId: userId }).sort({ createdAt: -1 });
        const user = await User.findById(userId);
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Calculate progress stats
        const totalQuizzes = await Quiz.countDocuments();
        const completedQuizzes = userResults.length;
        const totalPoints = user.points || 0;
        const averageScore = userResults.length > 0 ? 
            Math.round(userResults.reduce((sum, r) => sum + r.percentage, 0) / userResults.length) : 0;
        
        res.json({
            success: true,
            progress: {
                totalQuizzes,
                completedQuizzes,
                totalPoints,
                averageScore,
                earnedBadges: user.badges ? user.badges.filter(b => b.earned) : [],
                recentResults: userResults.slice(0, 5)
            },
            message: `📊 Progress report for ${user.name} from MongoDB Atlas!`
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};