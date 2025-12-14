/**
 * Data Processor
 * Processes chart data and prepares it for quiz presentation
 */

class DataProcessor {
  /**
   * Process raw chart data for quiz display
   * @param {Object} rawData - Raw chart data from API
   * @returns {Object} Processed data ready for quiz
   */
  static processChartForQuiz(rawData) {
    // TODO: Implement data processing logic
    // - Filter data points
    // - Format timestamps
    // - Calculate important metrics
    
    return {
      chartData: [],
      visibleRange: {},
      hiddenTarget: {}
    };
  }

  /**
   * Select which metadata to show in quiz
   * @param {Object} fullMetadata - Complete metadata object
   * @returns {Object} Filtered metadata for quiz display
   */
  static selectQuizMetadata(fullMetadata) {
    // TODO: Select relevant metadata for quiz
    // Show important indicators without giving away answer
    
    return {
      volume: fullMetadata.volume,
      marketCap: fullMetadata.marketCap,
      // Add more relevant fields
    };
  }

  /**
   * Generate quiz from chart data
   * @param {string} symbol - Stock/coin symbol
   * @param {Object} chartData - Processed chart data
   * @param {Object} metadata - Metadata
   * @returns {Object} Complete quiz object
   */
  static generateQuiz(symbol, chartData, metadata) {
    // TODO: Create quiz structure
    // - Hide certain data points (target)
    // - Present chart up to a certain point
    // - User must predict future price/date
    
    return {
      id: Date.now(),
      symbol,
      chartData,
      metadata,
      targetHidden: true,
      createdAt: new Date()
    };
  }

  /**
   * Validate user's answer
   * @param {Object} userAnswer - User's prediction {price, date}
   * @param {Object} actualTarget - Actual target values
   * @returns {Object} Validation result with accuracy
   */
  static validateAnswer(userAnswer, actualTarget) {
    // TODO: Implement answer validation
    // Calculate accuracy percentage
    
    const priceAccuracy = this.calculateAccuracy(
      userAnswer.price, 
      actualTarget.price
    );
    
    const dateAccuracy = this.calculateDateAccuracy(
      userAnswer.date,
      actualTarget.date
    );
    
    return {
      correct: priceAccuracy > 0.8 && dateAccuracy > 0.8,
      priceAccuracy,
      dateAccuracy,
      feedback: ''
    };
  }

  /**
   * Calculate accuracy percentage
   * @param {number} predicted - Predicted value
   * @param {number} actual - Actual value
   * @returns {number} Accuracy (0-1)
   */
  static calculateAccuracy(predicted, actual) {
    // TODO: Implement accuracy calculation
    const difference = Math.abs(predicted - actual);
    const percentDiff = difference / actual;
    return Math.max(0, 1 - percentDiff);
  }

  /**
   * Calculate date accuracy
   * @param {Date} predictedDate - Predicted date
   * @param {Date} actualDate - Actual date
   * @returns {number} Accuracy (0-1)
   */
  static calculateDateAccuracy(predictedDate, actualDate) {
    // TODO: Implement date accuracy calculation
    const diffDays = Math.abs(
      (new Date(predictedDate) - new Date(actualDate)) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, 1 - diffDays / 30); // 30 days tolerance
  }
}

module.exports = DataProcessor;
