/**
 * Quiz Model
 * Represents a stock/coin chart quiz
 */

class Quiz {
  constructor(data) {
    this.id = data.id || Date.now();
    this.symbol = data.symbol;
    this.chartData = data.chartData;
    this.metadata = data.metadata;
    this.targetPrice = data.targetPrice;
    this.targetDate = data.targetDate;
    this.visibleUntil = data.visibleUntil; // Show chart up to this point
    this.createdAt = data.createdAt || new Date();
    this.difficulty = data.difficulty || 'medium';
  }

  /**
   * Get quiz data for display (without revealing answer)
   * @returns {Object} Quiz data for frontend
   */
  getQuizData() {
    return {
      id: this.id,
      symbol: this.symbol,
      chartData: this.chartData.filter(
        point => new Date(point.timestamp) <= this.visibleUntil
      ),
      metadata: this.metadata,
      difficulty: this.difficulty
    };
  }

  /**
   * Check if user's answer is correct
   * @param {Object} userAnswer - {price: number, date: Date}
   * @returns {Object} Result with accuracy and feedback
   */
  checkAnswer(userAnswer) {
    // TODO: Use DataProcessor to validate
    const DataProcessor = require('../services/dataProcessor');
    
    return DataProcessor.validateAnswer(userAnswer, {
      price: this.targetPrice,
      date: this.targetDate
    });
  }

  /**
   * Get the correct answer (for after quiz completion)
   * @returns {Object} Target price and date
   */
  getAnswer() {
    return {
      price: this.targetPrice,
      date: this.targetDate
    };
  }

  /**
   * Serialize quiz for storage
   * @returns {Object} Serialized quiz data
   */
  toJSON() {
    return {
      id: this.id,
      symbol: this.symbol,
      chartData: this.chartData,
      metadata: this.metadata,
      targetPrice: this.targetPrice,
      targetDate: this.targetDate,
      visibleUntil: this.visibleUntil,
      createdAt: this.createdAt,
      difficulty: this.difficulty
    };
  }

  /**
   * Create Quiz from JSON
   * @param {Object} json - Quiz data
   * @returns {Quiz} Quiz instance
   */
  static fromJSON(json) {
    return new Quiz(json);
  }
}

module.exports = Quiz;
