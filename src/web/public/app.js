/**
 * Frontend JavaScript for Stock Quiz Web App
 */

class QuizApp {
  constructor() {
    this.currentQuizId = null;
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    this.loadSymbols();
    this.attachEventListeners();
  }

  /**
   * Load available symbols from API
   */
  async loadSymbols() {
    try {
      const response = await fetch('/api/symbols');
      const data = await response.json();
      
      if (data.success) {
        const select = document.getElementById('symbol-select');
        data.symbols.forEach(symbol => {
          const option = document.createElement('option');
          option.value = symbol;
          option.textContent = symbol;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading symbols:', error);
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    document.getElementById('start-quiz-btn').addEventListener('click', () => {
      this.startQuiz();
    });

    document.getElementById('submit-answer-btn').addEventListener('click', () => {
      this.submitAnswer();
    });

    document.getElementById('new-quiz-btn').addEventListener('click', () => {
      this.resetQuiz();
    });
  }

  /**
   * Start a new quiz
   */
  async startQuiz() {
    const symbol = document.getElementById('symbol-select').value;
    const difficulty = document.getElementById('difficulty-select').value;

    if (!symbol) {
      alert('Please select a symbol');
      return;
    }

    try {
      const response = await fetch('/api/quiz/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, difficulty })
      });

      const data = await response.json();

      if (data.success) {
        this.currentQuizId = data.quiz.id;
        this.displayQuiz(data.quiz);
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz. Please try again.');
    }
  }

  /**
   * Display quiz on screen
   * @param {Object} quiz - Quiz data
   */
  displayQuiz(quiz) {
    // Hide selection, show quiz
    document.getElementById('quiz-selection').classList.add('hidden');
    document.getElementById('quiz-display').classList.remove('hidden');

    // Set symbol
    document.getElementById('quiz-symbol').textContent = quiz.symbol;

    // TODO: Render chart with quiz.chartData
    this.renderChart(quiz.chartData);

    // TODO: Display metadata
    this.displayMetadata(quiz.metadata);
  }

  /**
   * Render chart (placeholder)
   * @param {Array} chartData - Chart data points
   */
  renderChart(chartData) {
    // TODO: Implement chart rendering using Chart.js or similar
    const canvas = document.getElementById('chart-canvas');
    const ctx = canvas.getContext('2d');
    
    // Placeholder
    ctx.fillStyle = '#667eea';
    ctx.fillRect(10, 10, 100, 100);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Chart will be rendered here', 20, 60);
  }

  /**
   * Display metadata
   * @param {Object} metadata - Market metadata
   */
  displayMetadata(metadata) {
    const container = document.getElementById('metadata-content');
    container.innerHTML = `
      <p><strong>Volume:</strong> ${metadata.volume || 'N/A'}</p>
      <p><strong>Market Cap:</strong> ${metadata.marketCap || 'N/A'}</p>
      <p><strong>24h High:</strong> ${metadata.high24h || 'N/A'}</p>
      <p><strong>24h Low:</strong> ${metadata.low24h || 'N/A'}</p>
    `;
  }

  /**
   * Submit user's answer
   */
  async submitAnswer() {
    const price = parseFloat(document.getElementById('price-input').value);
    const date = document.getElementById('date-input').value;

    if (!price || !date) {
      alert('Please enter both price and date');
      return;
    }

    try {
      const response = await fetch(`/api/quiz/${this.currentQuizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, date })
      });

      const data = await response.json();

      if (data.success) {
        this.displayResults(data.result);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    }
  }

  /**
   * Display quiz results
   * @param {Object} result - Quiz result
   */
  displayResults(result) {
    // Hide quiz, show results
    document.getElementById('quiz-display').classList.add('hidden');
    document.getElementById('results-display').classList.remove('hidden');

    const container = document.getElementById('results-content');
    container.innerHTML = `
      <h3>${result.correct ? '✅ Correct!' : '❌ Incorrect'}</h3>
      <p><strong>Price Accuracy:</strong> ${(result.priceAccuracy * 100).toFixed(2)}%</p>
      <p><strong>Date Accuracy:</strong> ${(result.dateAccuracy * 100).toFixed(2)}%</p>
      <p><strong>Correct Answer:</strong></p>
      <p>Price: ${result.correctAnswer.price}</p>
      <p>Date: ${result.correctAnswer.date}</p>
      <p>${result.feedback}</p>
    `;
  }

  /**
   * Reset quiz to start over
   */
  resetQuiz() {
    this.currentQuizId = null;
    document.getElementById('quiz-selection').classList.remove('hidden');
    document.getElementById('quiz-display').classList.add('hidden');
    document.getElementById('results-display').classList.add('hidden');
    
    // Clear inputs
    document.getElementById('price-input').value = '';
    document.getElementById('date-input').value = '';
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new QuizApp();
});
