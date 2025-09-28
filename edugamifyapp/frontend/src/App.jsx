import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios'

const API_BASE = 'http://localhost:5000/api'

// Configure axios to include token in all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function App() {
  const [user, setUser] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [showLogin, setShowLogin] = useState(true)
  const [authMode, setAuthMode] = useState('login')
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [activeTab, setActiveTab] = useState('quizzes')
  const [leaderboard, setLeaderboard] = useState([])
  const [userProgress, setUserProgress] = useState(null)
  const [recommendedQuizzes, setRecommendedQuizzes] = useState([])
  // Debug: Add console log to see if component is mounting
  useEffect(() => {
    console.log('App component mounted')
  }, [])

  // Check for saved token on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken && !user) {
      // Try to validate token by making a request
      // For now, we'll assume the token is valid if it exists
      // In a real app, you'd validate with the server
      setShowLogin(false)
    }
    loadQuizzes()
  }, [])

  // Load user-specific data when user logs in
  useEffect(() => {
    if (user) {
      loadLeaderboard()
      loadUserProgress()
      generateRecommendedQuizzes()
    }
  }, [user, userProgress, quizzes])

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && currentQuiz) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && currentQuiz) {
      submitQuiz()
    }
  }, [timeLeft, currentQuiz])

  const loadQuizzes = async () => {
    try {
      console.log('Loading quizzes from:', `${API_BASE}/quiz`)
      const response = await axios.get(`${API_BASE}/quiz`)
      console.log('Quizzes loaded:', response.data)
      setQuizzes(response.data.quizzes)
    } catch (error) {
      console.error('Error loading quizzes:', error)
      // Set some default quizzes if API fails
      setQuizzes([
        {
          _id: 'demo1',
          title: 'Demo Quiz',
          description: 'A demo quiz while connecting to backend',
          difficulty: 'beginner',
          questions: [{question: 'Demo question?', options: ['A', 'B', 'C', 'D']}],
          timeLimit: 300,
          points: 100
        }
      ])
    }
  }

  const loadLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_BASE}/quiz/leaderboard`)
      setLeaderboard(response.data.leaderboard)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  const loadUserProgress = async () => {
    try {
      if (user && user._id) {
        const response = await axios.get(`${API_BASE}/quiz/progress/${user._id}`)
        setUserProgress(response.data.progress)
      }
    } catch (error) {
      console.error('Error loading user progress:', error)
    }
  }

  const generateRecommendedQuizzes = () => {
    if (!user || !quizzes.length) return
    
    // Simple AI-like recommendation based on user's performance
    const completedQuizzes = userProgress?.recentResults?.map(r => r.quizId) || []
    const availableQuizzes = quizzes.filter(quiz => !completedQuizzes.includes(quiz._id))
    
    // Recommend based on difficulty progression
    let recommended = []
    if (userProgress?.averageScore >= 80) {
      // High performer - recommend advanced quizzes
      recommended = availableQuizzes.filter(q => q.difficulty === 'advanced').slice(0, 2)
    } else if (userProgress?.averageScore >= 60) {
      // Medium performer - recommend intermediate quizzes
      recommended = availableQuizzes.filter(q => q.difficulty === 'intermediate').slice(0, 2)
    } else {
      // New or struggling user - recommend beginner quizzes
      recommended = availableQuizzes.filter(q => q.difficulty === 'beginner').slice(0, 2)
    }
    
    // Fill remaining slots with mixed difficulty
    if (recommended.length < 3) {
      const remaining = availableQuizzes.filter(q => !recommended.includes(q)).slice(0, 3 - recommended.length)
      recommended = [...recommended, ...remaining]
    }
    
    setRecommendedQuizzes(recommended)
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    try {
      const endpoint = authMode === 'login' ? 'login' : 'register'
      const response = await axios.post(`${API_BASE}/auth/${endpoint}`, formData)
      setUser(response.data)
      setShowLogin(false)
      localStorage.setItem('token', response.data.token)
    } catch (error) {
      alert(error.response?.data?.message || 'Authentication failed')
    }
  }

  const startQuiz = async (quizId) => {
    try {
      const response = await axios.get(`${API_BASE}/quiz/${quizId}`)
      setCurrentQuiz(response.data.quiz)
      setCurrentQuestion(0)
      setAnswers([])
      setTimeLeft(response.data.quiz.timeLimit)
      setStartTime(Date.now())
      setShowResults(false)
    } catch (error) {
      console.error('Error starting quiz:', error)
    }
  }

  const selectAnswer = (answerIndex) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      submitQuiz()
    }
  }

  const submitQuiz = async () => {
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      const response = await axios.post(`${API_BASE}/quiz/${currentQuiz._id}/submit`, {
        answers,
        timeSpent,
        userId: user._id
      })
      setQuizResult(response.data)
      setShowResults(true)
      setCurrentQuiz(null)
      
      // Update user points in the UI
      if (user && response.data.result.points) {
        setUser(prev => ({
          ...prev,
          points: (prev.points || 0) + response.data.result.points
        }))
      }
      
      // Refresh leaderboard and progress
      setTimeout(() => {
        loadLeaderboard()
        loadUserProgress()
        generateRecommendedQuizzes()
      }, 1000)
    } catch (error) {
      console.error('Error submitting quiz:', error)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50'
      case 'intermediate': return '#FF9800'
      case 'advanced': return '#F44336'
      default: return '#2196F3'
    }
  }

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return '#4CAF50'
    if (percentage >= 60) return '#FF9800'
    return '#F44336'
  }


  if (showLogin) {
    return (
      <div className="app">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>🎮 EduGamify</h1>
              <p>Learn, Play, Achieve!</p>
            </div>
            
            <div className="auth-tabs">
              <button 
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => setAuthMode('login')}
              >
                Login
              </button>
              <button 
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => setAuthMode('register')}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuth} className="auth-form">
              {authMode === 'register' && (
                <input
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <button type="submit" className="auth-btn">
                {authMode === 'login' ? '🚀 Login' : '🎯 Join EduGamify'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (currentQuiz) {
    const question = currentQuiz.questions[currentQuestion]
    const progress = ((currentQuestion + 1) / currentQuiz.questions.length) * 100

    return (
      <div className="app">
        <div className="quiz-container">
          <div className="quiz-header">
            <div className="quiz-info">
              <h2>{currentQuiz.title}</h2>
              <div className="quiz-meta">
                <span className="question-counter">
                  Question {currentQuestion + 1} of {currentQuiz.questions.length}
                </span>
                <span className={`timer ${timeLeft < 30 ? 'urgent' : ''}`}>
                  ⏰ {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${progress}%`}}></div>
            </div>
          </div>

          <div className="question-card">
            <h3>{question.question}</h3>
            <div className="options">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`option ${answers[currentQuestion] === index ? 'selected' : ''}`}
                  onClick={() => selectAnswer(index)}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  {option}
                </button>
              ))}
            </div>
            <div className="question-footer">
              <span className="points">💎 {question.points} points</span>
              <button 
                className="next-btn"
                onClick={nextQuestion}
                disabled={answers[currentQuestion] === undefined}
              >
                {currentQuestion === currentQuiz.questions.length - 1 ? '🏁 Submit' : '➡️ Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showResults && quizResult) {
    return (
      <div className="app">
        <div className="results-container">
          <div className="results-card">
            <div className="results-header">
              <h2>🎉 Quiz Complete!</h2>
              <div className="score-circle" style={{borderColor: getPercentageColor(quizResult.result.percentage)}}>
                <span className="score-percentage">{quizResult.result.percentage}%</span>
                <span className="score-label">Score</span>
              </div>
            </div>

            <div className="results-stats">
              <div className="stat">
                <span className="stat-value">{quizResult.result.points}</span>
                <span className="stat-label">💎 Points Earned</span>
              </div>
              <div className="stat">
                <span className="stat-value">{quizResult.result.score}/{quizResult.result.totalQuestions}</span>
                <span className="stat-label">✅ Correct Answers</span>
              </div>
              <div className="stat">
                <span className="stat-value">{formatTime(quizResult.result.timeSpent)}</span>
                <span className="stat-label">⏱️ Time Taken</span>
              </div>
            </div>

            {quizResult.result.newBadges && quizResult.result.newBadges.length > 0 && (
              <div className="badges-earned">
                <h3>🏆 New Badges Earned!</h3>
                <div className="badges">
                  {quizResult.result.newBadges.map((badge, index) => (
                    <div key={index} className="badge">
                      <span className="badge-icon">{badge.icon}</span>
                      <span className="badge-name">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="results-actions">
              <button 
                className="back-btn"
                onClick={() => {setShowResults(false); setQuizResult(null)}}
              >
                🏠 Back to Quizzes
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🎮 EduGamify</h1>
          <div className="user-info">
            <span>Welcome, {user.name}! 💎 {user.points} points</span>
            <button onClick={() => {setUser(null); setShowLogin(true); localStorage.removeItem('token')}}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="dashboard">
          <div className="dashboard-nav">
            <button 
              className={`nav-tab ${activeTab === 'quizzes' ? 'active' : ''}`}
              onClick={() => setActiveTab('quizzes')}
            >
              🎯 Quizzes
            </button>
            <button 
              className={`nav-tab ${activeTab === 'recommended' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommended')}
            >
              🤖 AI Recommendations
            </button>
            <button 
              className={`nav-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              🏆 Leaderboard
            </button>
            <button 
              className={`nav-tab ${activeTab === 'progress' ? 'active' : ''}`}
              onClick={() => setActiveTab('progress')}
            >
              📊 My Progress
            </button>
          </div>

          {activeTab === 'quizzes' && (
            <>
              <div className="dashboard-header">
                <h2>🎯 Available Quizzes</h2>
                <p>Test your knowledge and earn points and badges!</p>
              </div>
              <div className="quizzes-grid">
                {quizzes.map((quiz) => (
                  <div key={quiz._id} className="quiz-card">
                    <div className="quiz-card-header">
                      <h3>{quiz.title}</h3>
                      <span 
                        className="difficulty-badge"
                        style={{backgroundColor: getDifficultyColor(quiz.difficulty)}}
                      >
                        {quiz.difficulty}
                      </span>
                    </div>
                    <p className="quiz-description">{quiz.description}</p>
                    <div className="quiz-meta">
                      <span>📝 {quiz.questions.length} questions</span>
                      <span>⏰ {Math.floor(quiz.timeLimit / 60)} min</span>
                      <span>💎 {quiz.points} points</span>
                    </div>
                    <button 
                      className="start-quiz-btn"
                      onClick={() => startQuiz(quiz._id)}
                    >
                      🚀 Start Quiz
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'recommended' && (
            <>
              <div className="dashboard-header">
                <h2>🤖 AI-Powered Recommendations</h2>
                <p>Personalized quiz suggestions based on your performance and learning pattern</p>
              </div>
              <div className="recommendation-info">
                <div className="ai-insight">
                  <h3>📈 Your Learning Insights</h3>
                  <p>
                    {userProgress?.averageScore >= 80 ? 
                      "Excellent performance! We're recommending advanced challenges to push your limits." :
                      userProgress?.averageScore >= 60 ?
                      "Good progress! Try these intermediate quizzes to level up your skills." :
                      "Great start! These beginner-friendly quizzes will build your foundation."
                    }
                  </p>
                </div>
              </div>
              <div className="quizzes-grid">
                {recommendedQuizzes.map((quiz) => (
                  <div key={quiz._id} className="quiz-card recommended">
                    <div className="ai-badge">🤖 AI Recommended</div>
                    <div className="quiz-card-header">
                      <h3>{quiz.title}</h3>
                      <span 
                        className="difficulty-badge"
                        style={{backgroundColor: getDifficultyColor(quiz.difficulty)}}
                      >
                        {quiz.difficulty}
                      </span>
                    </div>
                    <p className="quiz-description">{quiz.description}</p>
                    <div className="quiz-meta">
                      <span>📝 {quiz.questions.length} questions</span>
                      <span>⏰ {Math.floor(quiz.timeLimit / 60)} min</span>
                      <span>💎 {quiz.points} points</span>
                    </div>
                    <button 
                      className="start-quiz-btn ai-recommended"
                      onClick={() => startQuiz(quiz._id)}
                    >
                      🚀 Start Recommended Quiz
                    </button>
                  </div>
                ))}
                {recommendedQuizzes.length === 0 && (
                  <div className="no-recommendations">
                    <h3>🎯 Complete more quizzes to get personalized recommendations!</h3>
                    <p>Our AI will analyze your performance and suggest the best quizzes for you.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'leaderboard' && (
            <>
              <div className="dashboard-header">
                <h2>🏆 Leaderboard</h2>
                <p>See how you rank against other learners!</p>
              </div>
              <div className="leaderboard">
                {leaderboard.map((player, index) => (
                  <div key={player.name} className={`leaderboard-item ${user.name === player.name ? 'current-user' : ''}`}>
                    <div className="rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${player.rank}`}
                    </div>
                    <div className="player-info">
                      <span className="player-name">{player.name}</span>
                      <span className="player-stats">💎 {player.points} points • 🏆 {player.badges} badges</span>
                    </div>
                    {user.name === player.name && <span className="you-badge">You</span>}
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="empty-leaderboard">
                    <h3>🏆 Be the first to appear on the leaderboard!</h3>
                    <p>Complete quizzes to earn points and climb the ranks.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'progress' && (
            <>
              <div className="dashboard-header">
                <h2>📊 Your Progress</h2>
                <p>Track your learning journey and achievements</p>
              </div>
              {userProgress && (
                <div className="progress-dashboard">
                  <div className="progress-stats">
                    <div className="progress-card">
                      <div className="progress-icon">📚</div>
                      <div className="progress-info">
                        <span className="progress-number">{userProgress.completedQuizzes}</span>
                        <span className="progress-label">Quizzes Completed</span>
                      </div>
                    </div>
                    <div className="progress-card">
                      <div className="progress-icon">💎</div>
                      <div className="progress-info">
                        <span className="progress-number">{userProgress.totalPoints}</span>
                        <span className="progress-label">Total Points</span>
                      </div>
                    </div>
                    <div className="progress-card">
                      <div className="progress-icon">📈</div>
                      <div className="progress-info">
                        <span className="progress-number">{userProgress.averageScore}%</span>
                        <span className="progress-label">Average Score</span>
                      </div>
                    </div>
                    <div className="progress-card">
                      <div className="progress-icon">🏆</div>
                      <div className="progress-info">
                        <span className="progress-number">{userProgress.earnedBadges?.length || 0}</span>
                        <span className="progress-label">Badges Earned</span>
                      </div>
                    </div>
                  </div>

                  {userProgress.earnedBadges && userProgress.earnedBadges.length > 0 && (
                    <div className="badges-section">
                      <h3>🏆 Your Badges</h3>
                      <div className="badges-grid">
                      {userProgress.earnedBadges.map((badge, index) => (
                        <div key={index} className="badge-item">
                          <div className="badge-icon">{badge.icon || '🏆'}</div>
                          <div className="badge-name">{badge.name}</div>
                        </div>
                      ))}
                      </div>
                    </div>
                  )}

                  {userProgress.recentResults && userProgress.recentResults.length > 0 && (
                    <div className="recent-results">
                      <h3>📈 Recent Quiz Results</h3>
                      <div className="results-list">
                        {userProgress.recentResults.map((result, index) => (
                          <div key={index} className="result-item">
                            <div className="result-quiz">{result.quizTitle}</div>
                            <div className="result-score" style={{color: getPercentageColor(result.percentage)}}>
                              {result.percentage}% ({result.score}/{result.totalQuestions})
                            </div>
                            <div className="result-points">💎 {result.points} points</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!userProgress && (
                <div className="no-progress">
                  <h3>📊 Start taking quizzes to see your progress!</h3>
                  <p>Your statistics and achievements will appear here as you complete quizzes.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App