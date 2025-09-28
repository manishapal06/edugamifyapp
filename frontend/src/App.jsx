// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

/*
  Single-file frontend (keeps your UI intact).
  - Uses backend at http://localhost:5000/api
  - Auth: POST /api/auth/signup, POST /api/auth/login
  - Quizzes: GET /api/quiz
  - (Optional) Leaderboard / Badges endpoints can be added server-side and fetched similarly.
*/

// --- Axios instance ---
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach token automatically if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// --- Fallback mock data (kept so UI shows immediately if backend isn't ready) ---
const mockQuizzes = [
  {
    id: 1,
    _id: 'q1',
    title: "Mathematics Challenge",
    description: "Test your math skills with this timed quiz",
    questionsCount: 10,
    timeLimit: 300, // 5 minutes
    difficulty: "Medium",
    subject: "Mathematics",
    points: 100
  },
  {
    id: 2,
    _id: 'q2',
    title: "Science Quiz",
    description: "Explore scientific concepts and facts",
    questionsCount: 8,
    timeLimit: 240, // 4 minutes
    difficulty: "Easy",
    subject: "Science",
    points: 80
  },
  {
    id: 3,
    _id: 'q3',
    title: "History Master",
    description: "Journey through historical events",
    questionsCount: 12,
    timeLimit: 360, // 6 minutes
    difficulty: "Hard",
    subject: "History",
    points: 150
  }
];

const mockBadges = [
  {
    id: 1,
    name: "Quick Learner",
    description: "Complete 5 quizzes",
    icon: "https://placeholder-image-service.onrender.com/image/100x100?prompt=Badge with lightning bolt and star&id=badge1",
    earned: true
  },
  {
    id: 2,
    name: "Math Whiz",
    description: "Score 90%+ on any math quiz",
    icon: "https://placeholder-image-service.onrender.com/image/100x100?prompt=Math badge&id=badge2",
    earned: false
  },
  {
    id: 3,
    name: "History Buff",
    description: "Complete 3 history quizzes",
    icon: "https://placeholder-image-service.onrender.com/image/100x100?prompt=History badge&id=badge3",
    earned: false
  }
];

const mockLeaderboard = [
  { id: 1, name: "Emma Johnson", score: 2450, rank: 1 },
  { id: 2, name: "Noah Smith", score: 2100, rank: 2 },
  { id: 3, name: "Olivia Williams", score: 1950, rank: 3 },
  { id: 4, name: "Liam Brown", score: 1800, rank: 4 },
  { id: 5, name: "Ava Jones", score: 1650, rank: 5 }
];

// --- Main App ---
const EducationApp = () => {
  // Auth / user state
  const [user, setUser] = useState(() => {
    // optionally persist some basic user info in localStorage (but token holds auth)
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // UI state
  const [activeTab, setActiveTab] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Data state
  const [quizzes, setQuizzes] = useState([]);
  const [badges, setBadges] = useState(mockBadges);
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);
  const [aiSuggestions, setAiSuggestions] = useState(mockQuizzes.slice(0, 2));

  // Quiz flow state
  const [quizInProgress, setQuizInProgress] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState(null);

  // Auth form state (for modal)
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const authLoadingRef = useRef(false);

  // Load quizzes from backend on mount
  useEffect(() => {
    let mounted = true;
    async function fetchQuizzes() {
      try {
        const res = await API.get('/quiz');
        if (mounted && res?.data) {
          // Map backend quizzes into UI-friendly shape if needed
          const mapped = res.data.map(q => ({
            // support both _id and id fields
            id: q.id || q._id,
            _id: q._id || q.id,
            title: q.title,
            description: q.description || q.desc || '',
            questionsCount: q.questions ? q.questions.length : (q.questionsCount || 10),
            timeLimit: q.timeLimit || (q.questions ? q.questions.length * 30 : 300),
            difficulty: q.difficulty || 'Medium',
            subject: q.subject || 'General',
            points: q.points || 100,
            questions: q.questions || []
          }));
          setQuizzes(mapped);
          // default ai suggestions
          setAiSuggestions(mapped.slice(0, 2));
        }
      } catch (err) {
        // fallback to local mocks if backend not available
        setQuizzes(mockQuizzes);
        setAiSuggestions(mockQuizzes.slice(0, 2));
        // console.warn('Could not fetch quizzes, using mock data', err);
      }
    }
    fetchQuizzes();
    return () => { mounted = false; };
  }, []);

  // If token exists initially, we can try to fetch profile (optional)
  useEffect(() => {
    async function fetchProfile() {
      if (!localStorage.getItem('token')) return;
      try {
        // If server has /api/auth/me or similar, use it. Otherwise skip.
        const res = await API.get('/auth/me'); // optional: server must implement
        if (res?.data && res.data.user) {
          setUser(res.data.user);
          setIsLoggedIn(true);
        }
      } catch (err) {
        // ignore; server might not have /auth/me
      }
    }
    fetchProfile();
  }, []);

  // --- Authentication handlers ---
  const handleAuthInput = (e) => {
    setAuthForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLoginSubmit = async () => {
    if (authLoadingRef.current) return;
    authLoadingRef.current = true;
    try {
      const { data } = await API.post('/auth/login', {
        email: authForm.email,
        password: authForm.password
      });
      if (data?.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
        }
        setIsLoggedIn(true);
        setShowAuthModal(false);
        setAuthForm({ name: '', email: '', password: '' });
      } else {
        alert('Login succeeded but no token returned.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    } finally {
      authLoadingRef.current = false;
    }
  };

  const handleSignupSubmit = async () => {
    if (authLoadingRef.current) return;
    authLoadingRef.current = true;
    try {
      await API.post('/auth/signup', {
        name: authForm.name,
        email: authForm.email,
        password: authForm.password
      });
      alert('Signup successful. Please log in.');
      setAuthMode('login');
      setAuthForm({ name: '', email: '', password: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Signup failed');
    } finally {
      authLoadingRef.current = false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    setActiveTab('home');
  };

  // --- Quiz flow ---
  const startQuiz = (quiz) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      setAuthMode('login');
      return;
    }
    // Prefer quiz object from fetched quizzes to preserve questions if backend provided them
    const q = quizzes.find(x => x._id === quiz._id) || quiz;
    setCurrentQuiz(q);
    setQuizInProgress(true);
  };

  // Called when QuizComponent completes (scoreNumber)
  const completeQuiz = (scoreNumber, questionsCount, points) => {
    setQuizInProgress(false);
    // compute points earned
    const pointsEarned = Math.floor((scoreNumber / questionsCount) * (points || (questionsCount * 10)));
    setQuizResults({
      score: scoreNumber,
      total: questionsCount,
      pointsEarned
    });

    // TODO: send result to backend: POST /api/quiz/result (if implemented)
    // Example (optional):
    // API.post('/quiz/result', { quizId: currentQuiz._id, score: scoreNumber })
    //   .catch(err => console.warn('Could not save result', err));

    setCurrentQuiz(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img
            src="https://placeholder-image-service.onrender.com/image/40x40?prompt=Educational app logo with graduation cap and star&id=logo"
            alt="EduGame logo featuring a graduation cap and star"
            className="h-10 w-10"
          />
          <h1 className="text-xl font-bold text-indigo-800">EduGame</h1>
        </div>

        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-indigo-700 hover:bg-indigo-100'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-lg ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-indigo-700 hover:bg-indigo-100'}`}
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Login / Signup
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Authentication Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowAuthModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-indigo-800 mb-4">Welcome to EduGame</h2>
                <p className="text-gray-600 mb-6">Login or create an account to start earning badges and climbing the leaderboard!</p>

                <div className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        name="name"
                        value={authForm.name}
                        onChange={handleAuthInput}
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Your full name"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      name="email"
                      value={authForm.email}
                      onChange={handleAuthInput}
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Your email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      name="password"
                      value={authForm.password}
                      onChange={handleAuthInput}
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Your password"
                    />
                  </div>

                  {authMode === 'login' ? (
                    <>
                      <button
                        onClick={handleLoginSubmit}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                      >
                        Login
                      </button>
                      <div className="text-center">
                        <button
                          onClick={() => setAuthMode('signup')}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          Create new account
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSignupSubmit}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Signup
                      </button>
                      <div className="text-center">
                        <button
                          onClick={() => setAuthMode('login')}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          Already have an account? Login
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quiz In Progress Modal */}
        <AnimatePresence>
          {quizInProgress && currentQuiz && (
            <QuizComponent
              quiz={currentQuiz}
              onComplete={(score) => completeQuiz(score, currentQuiz.questionsCount || (currentQuiz.questions ? currentQuiz.questions.length : 10), currentQuiz.points)}
              onCancel={() => setQuizInProgress(false)}
            />
          )}
        </AnimatePresence>

        {/* Quiz Results Modal */}
        <AnimatePresence>
          {quizResults && (
            <QuizResults
              results={quizResults}
              onClose={() => setQuizResults(null)}
            />
          )}
        </AnimatePresence>

        {/* Home Page (visible to all users) */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <section className="text-center py-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold text-indigo-900 mb-4"
              >
                Learning Made Fun & Rewarding
              </motion.h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Challenge yourself with interactive quizzes, earn badges, and climb the leaderboard in our educational gamification platform.
              </p>
              <button
                onClick={() => isLoggedIn ? setActiveTab('quizzes') : setShowAuthModal(true)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg text-lg font-medium hover:bg-indigo-700"
              >
                {isLoggedIn ? 'Start Learning' : 'Get Started'}
              </button>
            </section>

            {/* Features Section */}
            <section>
              <h3 className="text-2xl font-bold text-indigo-800 mb-8 text-center">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <img
                      src="https://placeholder-image-service.onrender.com/image/32x32?prompt=Quiz icon with question mark and pencil&id=feature1"
                      alt="Icon representing quizzes and questions"
                      className="h-8 w-8"
                    />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Take Quizzes</h4>
                  <p className="text-gray-600">Test your knowledge across various subjects with timed challenges.</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <img
                      src="https://placeholder-image-service.onrender.com/image/32x32?prompt=Badge icon with ribbon and star&id=feature2"
                      alt="Icon representing achievement badges"
                      className="h-8 w-8"
                    />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Earn Badges</h4>
                  <p className="text-gray-600">Collect achievements and rewards for your learning progress.</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <img
                      src="https://placeholder-image-service.onrender.com/image/32x32?prompt=Leaderboard icon with trophy and ranking&id=feature3"
                      alt="Icon representing leaderboard competition"
                      className="h-8 w-8"
                    />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Compete & Learn</h4>
                  <p className="text-gray-600">See how you rank against others and track your improvement.</p>
                </div>
              </div>
            </section>

            {/* Sample Quizzes (limited for non-logged in users) */}
            <section>
              <h3 className="text-2xl font-bold text-indigo-800 mb-6">Featured Quizzes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(quizzes.length ? quizzes : mockQuizzes).slice(0, isLoggedIn ? (quizzes.length || mockQuizzes.length) : 2).map((quiz) => (
                  <QuizCard
                    key={quiz._id || quiz.id}
                    quiz={quiz}
                    onStart={() => startQuiz(quiz)}
                    locked={!isLoggedIn}
                  />
                ))}
              </div>
              {!isLoggedIn && (
                <div className="text-center mt-6">
                  <p className="text-gray-600 mb-4">Sign up to access all quizzes and features</p>
                  <button
                    onClick={() => { setShowAuthModal(true); setAuthMode('signup'); }}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Sign Up Now
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Dashboard (visible only to logged in users) */}
        {isLoggedIn && activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="bg-indigo-600 text-white p-6 rounded-xl">
              <h2 className="text-2xl font-bold mb-2">Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}!</h2>
              <p>You've earned 450 points this week. Keep up the great work!</p>
            </div>

            {/* AI Suggestions */}
            <section>
              <h3 className="text-xl font-bold text-indigo-800 mb-4">Recommended For You</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(aiSuggestions.length ? aiSuggestions : (quizzes.length ? quizzes.slice(0,2) : mockQuizzes.slice(0,2))).map((quiz) => (
                  <QuizCard
                    key={quiz._id || quiz.id}
                    quiz={quiz}
                    onStart={() => startQuiz(quiz)}
                    highlighted={true}
                  />
                ))}
              </div>
            </section>

            {/* Progress Overview */}
            <section className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-indigo-800 mb-4">Your Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-indigo-700">12</p>
                  <p className="text-gray-600">Quizzes Completed</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-indigo-700">85%</p>
                  <p className="text-gray-600">Average Score</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-indigo-700">5</p>
                  <p className="text-gray-600">Badges Earned</p>
                </div>
              </div>
            </section>

            {/* Badges Section */}
            <section>
              <h3 className="text-xl font-bold text-indigo-800 mb-4">Your Badges</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </section>

            {/* Leaderboard Section */}
            <section>
              <h3 className="text-xl font-bold text-indigo-800 mb-4">Leaderboard</h3>
              <Leaderboard data={leaderboard} currentUserId={user ? user._id : 1} />
            </section>

            {/* All Quizzes */}
            <section>
              <h3 className="text-xl font-bold text-indigo-800 mb-4">All Quizzes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(quizzes.length ? quizzes : mockQuizzes).map((quiz) => (
                  <QuizCard
                    key={quiz._id || quiz.id}
                    quiz={quiz}
                    onStart={() => startQuiz(quiz)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Profile Page */}
        {isLoggedIn && activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-indigo-800 mb-6">Your Profile</h2>

            <div className="flex items-center space-x-4 mb-6">
              <img
                src="https://placeholder-image-service.onrender.com/image/80x80?prompt=User profile avatar with neutral expression&id=profile"
                alt="User profile picture"
                className="w-20 h-20 rounded-full"
              />
              <div>
                <h3 className="text-xl font-semibold">{user ? user.name : 'John Doe'}</h3>
                <p className="text-gray-600">Level 5 Learner</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user ? user.email : 'john.doe@example.com'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
                <input
                  type="text"
                  value="1250 points"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <input
                  type="text"
                  value="January 2023"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  readOnly
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- UI Components (kept same as your original, with minimal adjustments) ---

// Quiz Card Component
const QuizCard = ({ quiz, onStart, locked = false, highlighted = false }) => {
  const id = quiz._id || quiz.id;
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-white rounded-xl shadow-md overflow-hidden ${highlighted ? 'ring-2 ring-indigo-500' : ''}`}
    >
      <img
        src={`https://placeholder-image-service.onrender.com/image/300x200?prompt=${quiz.subject} quiz cover image with educational elements&id=quiz${id}`}
        alt={`Cover image for ${quiz.title} quiz with ${quiz.subject} theme`}
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-indigo-800">{quiz.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${quiz.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : quiz.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
            {quiz.difficulty}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <img
              src="https://placeholder-image-service.onrender.com/image/16x16?prompt=Question count icon&id=question-icon"
              alt="Question count icon"
              className="mr-1 h-4 w-4"
            />
            {quiz.questionsCount || (quiz.questions ? quiz.questions.length : '?')} questions
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <img
              src="https://placeholder-image-service.onrender.com/image/16x16?prompt=Time limit icon&id=time-icon"
              alt="Time limit icon"
              className="mr-1 h-4 w-4"
            />
            {Math.floor((quiz.timeLimit || 300) / 60)} min
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <img
              src="https://placeholder-image-service.onrender.com/image/16x16?prompt=Points icon&id=points-icon"
              alt="Points icon"
              className="mr-1 h-4 w-4"
            />
            {quiz.points || 100} pts
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={locked}
          className={`w-full py-2 rounded-lg font-medium ${locked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          {locked ? 'Sign In to Play' : 'Start Quiz'}
        </button>
      </div>
    </motion.div>
  );
};

// Badge Card Component
const BadgeCard = ({ badge }) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm text-center ${!badge.earned ? 'opacity-50' : ''}`}>
      <img
        src={badge.icon}
        alt={`${badge.name} badge icon`}
        className="w-16 h-16 mx-auto mb-2"
      />
      <h4 className="font-semibold text-indigo-800">{badge.name}</h4>
      <p className="text-sm text-gray-600">{badge.description}</p>
      {!badge.earned && <p className="text-xs text-gray-500 mt-2">Locked</p>}
    </div>
  );
};

// Leaderboard Component
const Leaderboard = ({ data, currentUserId }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-indigo-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((user) => (
              <tr key={user.id} className={user.id === currentUserId ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${user.rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.rank}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src="https://placeholder-image-service.onrender.com/image/32x32?prompt=User avatar&id=user"
                      alt={`${user.name} profile picture`}
                      className="h-8 w-8 rounded-full mr-2"
                    />
                    {user.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{user.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Quiz Component (with timer & correct scoring behavior)
const QuizComponent = ({ quiz, onComplete, onCancel }) => {
  const questionsCount = quiz.questionsCount || (quiz.questions ? quiz.questions.length : 10);
  // if backend provided full questions, use them, otherwise generate mock ones
  const initialQuestions = quiz.questions && quiz.questions.length
    ? quiz.questions.map((q, idx) => ({
        id: q._id || q.id || idx + 1,
        question: q.question || `Question ${idx + 1}`,
        options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0 // best-effort
      }))
    : generateMockQuestions(questionsCount, quiz.subject);

  const [questions] = useState(initialQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit || (questionsCount * 30 || 300));

  // stable refs to avoid stale closures
  const scoreRef = useRef(score);
  const timeLeftRef = useRef(timeLeft);
  scoreRef.current = score;
  timeLeftRef.current = timeLeft;

  // Timer effect — use functional updates to avoid stale closure
  useEffect(() => {
    if (timeLeft <= 0) {
      // time out — finish quiz
      onComplete(scoreRef.current);
      return;
    }

    const id = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]); // intentionally depend only on onComplete (functional updates handle timeLeft)

  // Answer handler: compute newScore then advance or finish
  const handleAnswer = () => {
    // compute whether this selection is correct
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    // update score using functional update
    setScore(prev => {
      const newScore = prev + (isCorrect ? 1 : 0);

      // If this was last question, we should call onComplete with final score
      if (currentQuestion >= questions.length - 1) {
        // use a small timeout to ensure state settled, but we can call directly with computed newScore
        onComplete(newScore);
      } else {
        setCurrentQuestion(prevQ => prevQ + 1);
        setSelectedAnswer(null);
      }

      return newScore;
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Quiz header with timer and progress */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-indigo-800">{quiz.title}</h2>
          <div className={`px-3 py-1 rounded-full font-medium ${timeLeft < 60 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
            Time: {formatTime(timeLeft)}
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-indigo-600 h-2 rounded-full"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">{questions[currentQuestion].question}</h3>
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer ${selectedAnswer === index ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                onClick={() => setSelectedAnswer(index)}
              >
                {option}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Quit Quiz
          </button>
          <button
            onClick={handleAnswer}
            disabled={selectedAnswer === null}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// helper to generate mock questions
function generateMockQuestions(count, subject = 'General') {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    question: `Sample question ${i + 1} about ${subject}?`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: Math.floor(Math.random() * 4)
  }));
}

// Quiz Results Component
const QuizResults = ({ results, onClose }) => {
  const percentage = Math.round((results.score / results.total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-xl p-6 max-w-md w-full mx-4 text-center"
      >
        <h2 className="text-2xl font-bold text-indigo-800 mb-4">Quiz Completed!</h2>

        {/* Score display */}
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#eee"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-indigo-800">{percentage}%</span>
          </div>
        </div>

        <p className="text-lg mb-2">
          You scored {results.score} out of {results.total}
        </p>
        <p className="text-indigo-600 font-semibold mb-6">
          +{results.pointsEarned} points earned!
        </p>

        {/* Celebration for high scores */}
        {percentage >= 80 && (
          <div className="mb-6 p-3 bg-yellow-100 rounded-lg">
            <p className="text-yellow-800 font-medium">Great job! You earned a gold star!</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Continue Learning
        </button>
      </motion.div>
    </motion.div>
  );
};

export default EducationApp;
