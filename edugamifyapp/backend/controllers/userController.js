// Protected route example
exports.getBadges = async (req, res) => {
    try {
        // req.user set by auth middleware
        const badges = req.user.badges || [
            { id: 1, name: 'Quick Learner', earned: true },
            { id: 2, name: 'Math Whiz', earned: false }
        ];
        res.json(badges);
    } catch(err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
