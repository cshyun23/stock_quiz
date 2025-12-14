/**
 * Web Server Implementation
 * Direct web hosting for browser-based access
 */

const express = require('express');
const path = require('path');
const ChartService = require('../services/chartService');
const DataProcessor = require('../services/dataProcessor');
const Quiz = require('../models/Quiz');

class WebServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.chartService = new ChartService();
    this.activeQuizzes = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Serve main page
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // API: Create new quiz
    this.app.post('/api/quiz/create', async (req, res) => {
      try {
        const { symbol, difficulty } = req.body;
        const quiz = await this.createQuiz(symbol, difficulty);
        res.json({ success: true, quiz });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Get quiz by ID
    this.app.get('/api/quiz/:id', (req, res) => {
      try {
        const quiz = this.getQuiz(parseInt(req.params.id));
        res.json({ success: true, quiz });
      } catch (error) {
        res.status(404).json({ success: false, error: error.message });
      }
    });

    // API: Submit answer
    this.app.post('/api/quiz/:id/submit', (req, res) => {
      try {
        const quizId = parseInt(req.params.id);
        const { price, date } = req.body;
        const result = this.submitAnswer(quizId, { price, date });
        res.json({ success: true, result });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    // API: Get available symbols
    this.app.get('/api/symbols', (req, res) => {
      // TODO: Return list of available stock/coin symbols
      res.json({
        success: true,
        symbols: ['BTC', 'ETH', 'AAPL', 'TSLA', 'GOOGL']
      });
    });
  }

  /**
   * Create a new quiz
   * @param {string} symbol - Stock/coin symbol
   * @param {string} difficulty - Quiz difficulty
   * @returns {Promise<Object>} Quiz data
   */
  async createQuiz(symbol, difficulty = 'medium') {
    // TODO: Implement quiz creation
    const chartData = await this.chartService.fetchChartData(symbol);
    const metadata = await this.chartService.getMetadata(symbol);
    
    const quiz = DataProcessor.generateQuiz(symbol, chartData, metadata);
    const quizInstance = new Quiz(quiz);
    
    this.activeQuizzes.set(quizInstance.id, quizInstance);
    
    return quizInstance.getQuizData();
  }

  /**
   * Get quiz by ID
   * @param {number} quizId - Quiz ID
   * @returns {Object} Quiz data
   */
  getQuiz(quizId) {
    const quiz = this.activeQuizzes.get(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    return quiz.getQuizData();
  }

  /**
   * Submit answer for a quiz
   * @param {number} quizId - Quiz ID
   * @param {Object} answer - User's answer
   * @returns {Object} Result
   */
  submitAnswer(quizId, answer) {
    const quiz = this.activeQuizzes.get(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    
    const result = quiz.checkAnswer(answer);
    return {
      ...result,
      correctAnswer: quiz.getAnswer()
    };
  }

  /**
   * Start web server
   */
  start() {
    this.app.listen(this.port, () => {
      console.log(`Web Server running at http://localhost:${this.port}`);
    });
  }
}

// Create and export server instance
const server = new WebServer();

// Start server if running directly
if (require.main === module) {
  server.start();
}

module.exports = server;
