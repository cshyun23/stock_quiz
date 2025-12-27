/**
 * Frontend JavaScript for Stock & Crypto Chart Viewer
 */

class ChartViewerApp {
  constructor() {
    this.priceChart = null;
    this.volumeChart = null;
    this.currentData = null;
    this.currentMetadata = null;
    this.hiddenData = null; // Data after cutoff date
    this.cutoffDate = null;
    this.quizSubmitted = false;
    this.currentSymbol = null;
    this.currentAssetType = null;
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    this.attachEventListeners();
    this.attachExampleButtonListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    document.getElementById('start-quiz-btn').addEventListener('click', () => {
      this.startQuiz();
    });

    document.getElementById('reset-zoom-btn').addEventListener('click', () => {
      this.resetZoom();
    });

    document.getElementById('new-quiz-btn').addEventListener('click', () => {
      this.newQuiz();
    });

    document.getElementById('calculate-strategy-btn').addEventListener('click', () => {
      this.calculateStrategy();
    });

    document.getElementById('clear-strategy-btn').addEventListener('click', () => {
      this.clearStrategy();
    });
  }

  /**
   * Attach example button listeners
   */
  attachExampleButtonListeners() {
    const exampleButtons = document.querySelectorAll('.example-btn-compact');
    exampleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const assetType = btn.getAttribute('data-type');
        const symbol = btn.getAttribute('data-symbol');
        
        // Set the form values
        document.getElementById('asset-type').value = assetType;
        document.getElementById('symbol-input').value = symbol;
        
        // Start quiz automatically
        this.startQuiz();
      });
    });
  }

  /**
   * Start a new quiz
   */
  async startQuiz() {
    const assetType = document.getElementById('asset-type').value;
    const symbol = document.getElementById('symbol-input').value.trim();

    if (!symbol) {
      alert('Please enter a symbol or coin ID');
      return;
    }

    try {
      // Reset quiz state
      this.quizSubmitted = false;
      this.hiddenData = null;
      this.cutoffDate = null;
      this.currentSymbol = symbol;
      this.currentAssetType = assetType;
      this.clearStrategy();

      // Show loading state
      document.getElementById('start-quiz-btn').textContent = 'Loading...';
      document.getElementById('start-quiz-btn').disabled = true;

      // Fetch data based on asset type (use 2Y for more data)
      let response;
      if (assetType === 'stock') {
        response = await fetch(`/api/chart/stock/${symbol}?timeframe=2Y`);
      } else {
        response = await fetch(`/api/chart/crypto/${symbol}?timeframe=2Y`);
      }

      const result = await response.json();

      if (result.success) {
        this.currentData = result.data;
        this.currentMetadata = result.metadata;
        this.hiddenData = result.hiddenData || [];
        this.cutoffDate = result.cutoffDate;
        this.displayChart(symbol, result.data, result.metadata, result.cutoffDate);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz. Please try again.');
    } finally {
      document.getElementById('start-quiz-btn').textContent = 'Start Quiz';
      document.getElementById('start-quiz-btn').disabled = false;
    }
  }

  /**
   * Start a new quiz with same symbol
   */
  async newQuiz() {
    if (this.currentSymbol) {
      await this.startQuiz();
    }
  }

  /**
   * Display chart on screen
   */
  displayChart(symbol, data, metadata, cutoffDate) {
    // Show chart section
    document.getElementById('chart-display').classList.remove('hidden');

    // Set header info
    document.getElementById('chart-symbol').textContent = symbol.toUpperCase();
    document.getElementById('chart-name').textContent = metadata.name || '';
    
    // Display cutoff date
    const cutoffDateObj = new Date(cutoffDate);
    document.getElementById('cutoff-date').textContent = cutoffDateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Render charts
    this.renderPriceChart(data);
    this.renderVolumeChart(data);

    // Display market info
    this.displayMarketInfo(metadata, data);
  }

  /**
   * Render price chart with zoom/pan capabilities
   */
  renderPriceChart(data, profitPrice = null, stopLossPrice = null) {
    const ctx = document.getElementById('price-chart').getContext('2d');

    // Destroy existing chart
    if (this.priceChart) {
      this.priceChart.destroy();
    }

    const labels = data.map(d => new Date(d.timestamp).toLocaleDateString());
    const prices = data.map(d => d.close || d.price);

    const datasets = [{
      label: 'Close Price',
      data: prices,
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      fill: true,
      tension: 0.1
    }];

    // Add profit line if provided
    if (profitPrice !== null) {
      datasets.push({
        label: 'Profit Target',
        data: Array(prices.length).fill(profitPrice),
        borderColor: '#48bb78',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      });
    }

    // Add stop-loss line if provided
    if (stopLossPrice !== null) {
      datasets.push({
        label: 'Stop Loss',
        data: Array(prices.length).fill(stopLossPrice),
        borderColor: '#f56565',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      });
    }

    this.priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
              }
            }
          },
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
                speed: 0.1
              },
              pinch: {
                enabled: true
              },
              mode: 'x'
            },
            pan: {
              enabled: true,
              mode: 'x'
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 10
            }
          },
          y: {
            position: 'right',
            ticks: {
              callback: function(value) {
                return '$' + value.toFixed(2);
              }
            }
          }
        }
      }
    });
  }

  /**
   * Render volume chart
   */
  renderVolumeChart(data) {
    const ctx = document.getElementById('volume-chart').getContext('2d');

    // Destroy existing chart
    if (this.volumeChart) {
      this.volumeChart.destroy();
    }

    const labels = data.map(d => new Date(d.timestamp).toLocaleDateString());
    const volumes = data.map(d => d.volume || 0);

    this.volumeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Volume',
          data: volumes,
          backgroundColor: 'rgba(72, 187, 120, 0.5)',
          borderColor: '#48bb78',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Volume: ${context.parsed.y.toLocaleString()}`;
              }
            }
          },
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
                speed: 0.1
              },
              pinch: {
                enabled: true
              },
              mode: 'x'
            },
            pan: {
              enabled: true,
              mode: 'x'
            },
            limits: {
              x: { min: 'original', max: 'original' }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 10
            }
          },
          y: {
            position: 'right',
            ticks: {
              callback: function(value) {
                return value.toLocaleString();
              }
            }
          }
        }
      }
    });

    // Sync zoom/pan with price chart
    this.syncChartZoom();
  }

  /**
   * Sync zoom/pan between price and volume charts
   */
  syncChartZoom() {
    if (!this.priceChart || !this.volumeChart) return;

    const syncHandler = (sourceChart, targetChart) => {
      targetChart.zoomScale('x', 
        { min: sourceChart.scales.x.min, max: sourceChart.scales.x.max },
        'none'
      );
    };

    this.priceChart.options.plugins.zoom.zoom.onZoomComplete = () => {
      syncHandler(this.priceChart, this.volumeChart);
    };

    this.priceChart.options.plugins.zoom.pan.onPanComplete = () => {
      syncHandler(this.priceChart, this.volumeChart);
    };

    this.volumeChart.options.plugins.zoom.zoom.onZoomComplete = () => {
      syncHandler(this.volumeChart, this.priceChart);
    };

    this.volumeChart.options.plugins.zoom.pan.onPanComplete = () => {
      syncHandler(this.volumeChart, this.priceChart);
    };
  }

  /**
   * Reset zoom to show all data
   */
  resetZoom() {
    if (this.priceChart) {
      this.priceChart.resetZoom();
    }
    if (this.volumeChart) {
      this.volumeChart.resetZoom();
    }
  }

  /**
   * Display market information
   */
  displayMarketInfo(metadata, data) {
    const latestPrice = data[data.length - 1]?.close || data[data.length - 1]?.price || 0;
    
    document.getElementById('current-price').textContent = `$${latestPrice.toFixed(2)}`;
    document.getElementById('volume-value').textContent = (metadata.volume || 0).toLocaleString();
    
    const marketCap = metadata.marketCap || 0;
    document.getElementById('market-cap').textContent = marketCap > 0 
      ? `$${(marketCap / 1e9).toFixed(2)}B` 
      : 'N/A';
    
    // P/E Ratio (for stocks)
    const per = metadata.trailingPE || metadata.forwardPE || 0;
    document.getElementById('per-value').textContent = per > 0 ? per.toFixed(2) : 'N/A';
    
    // 52-week range
    const high52w = metadata.high52w || metadata.fiftyTwoWeekHigh || 0;
    const low52w = metadata.low52w || metadata.fiftyTwoWeekLow || 0;
    document.getElementById('range-52w').textContent = 
      (high52w > 0 && low52w > 0) ? `$${high52w.toFixed(2)} / $${low52w.toFixed(2)}` : 'N/A';
    
    document.getElementById('prev-close').textContent = 
      `$${(metadata.previousClose || 0).toFixed(2)}`;
  }

  /**
   * Calculate trading strategy
   */
  calculateStrategy() {
    const takeProfit = parseFloat(document.getElementById('take-profit-input').value);
    const stopLoss = parseFloat(document.getElementById('stop-loss-input').value);
    const maxDays = parseInt(document.getElementById('max-days-input').value);

    if (!takeProfit || !stopLoss || !maxDays) {
      alert('Please fill in all strategy fields');
      return;
    }

    if (maxDays > 30) {
      alert('Maximum days to hold cannot exceed 30 days');
      return;
    }

    if (!this.currentData || this.currentData.length === 0) {
      alert('Please start a quiz first');
      return;
    }

    if (!this.hiddenData || this.hiddenData.length === 0) {
      alert('No future data available for this quiz.');
      return;
    }

    this.quizSubmitted = true;

    // Get starting price (last price in current data = price at cutoff date)
    const startPrice = this.currentData[this.currentData.length - 1]?.close || 
                       this.currentData[this.currentData.length - 1]?.price || 0;

    // Validate inputs
    if (takeProfit <= startPrice) {
      alert('Profit price must be higher than current price');
      return;
    }

    if (stopLoss >= startPrice) {
      alert('Stop-loss price must be lower than current price');
      return;
    }

    // Combine current data with future data (up to maxDays)
    const futureData = this.hiddenData.slice(0, maxDays);
    const combinedData = [...this.currentData, ...futureData];

    // Simulate trading result
    let exitPrice = null;
    let exitReason = '';
    let exitDay = 0;
    let highestPrice = startPrice;
    let lowestPrice = startPrice;

    for (let i = 0; i < futureData.length; i++) {
      const dayPrice = futureData[i].close || futureData[i].price;
      
      if (dayPrice > highestPrice) highestPrice = dayPrice;
      if (dayPrice < lowestPrice) lowestPrice = dayPrice;
      
      // Check if profit target hit
      if (dayPrice >= takeProfit) {
        exitPrice = takeProfit;
        exitReason = '🎯 Profit Target Reached!';
        exitDay = i + 1;
        break;
      }
      
      // Check if stop loss hit
      if (dayPrice <= stopLoss) {
        exitPrice = stopLoss;
        exitReason = '⚠️ Stop Loss Triggered';
        exitDay = i + 1;
        break;
      }
    }

    // If no exit condition met, use last available price or max days
    if (exitPrice === null) {
      if (futureData.length >= maxDays) {
        exitPrice = futureData[maxDays - 1].close || futureData[maxDays - 1].price;
        exitReason = '⏱️ Max Holding Period Reached';
        exitDay = maxDays;
      } else {
        exitPrice = futureData[futureData.length - 1].close || futureData[futureData.length - 1].price;
        exitReason = '📅 End of Available Data';
        exitDay = futureData.length;
      }
    }

    // Calculate results
    const profitLoss = exitPrice - startPrice;
    const profitLossPercent = (profitLoss / startPrice) * 100;
    const potentialProfit = takeProfit - startPrice;
    const potentialLoss = startPrice - stopLoss;

    // Re-render charts with combined data and strategy lines
    this.renderPriceChart(combinedData, takeProfit, stopLoss);
    this.renderVolumeChart(combinedData);

    // Display results
    const resultDiv = document.getElementById('strategy-result');
    const outputDiv = document.getElementById('strategy-output');

    const isProfit = profitLoss > 0;
    const profitColor = isProfit ? '#22543d' : '#742a2a';
    const profitSymbol = isProfit ? '📈' : '📉';

    let html = `
      <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h4 style="margin-top: 0;">📊 Your Strategy</h4>
        <p><strong>Entry Price:</strong> $${startPrice.toFixed(2)} (${new Date(this.cutoffDate).toLocaleDateString()})</p>
        <p><strong>Profit Target:</strong> $${takeProfit.toFixed(2)} (+${((takeProfit - startPrice) / startPrice * 100).toFixed(2)}%)</p>
        <p><strong>Stop Loss:</strong> $${stopLoss.toFixed(2)} (-${((startPrice - stopLoss) / startPrice * 100).toFixed(2)}%)</p>
        <p><strong>Max Days:</strong> ${maxDays} days</p>
      </div>

      <div style="background: ${isProfit ? '#f0fff4' : '#fff5f5'}; padding: 15px; border-radius: 8px; border: 2px solid ${isProfit ? '#48bb78' : '#f56565'};">
        <h4 style="margin-top: 0; color: ${profitColor};">${profitSymbol} Result: ${exitReason}</h4>
        <p><strong>Days Held:</strong> ${exitDay} day(s)</p>
        <p><strong>Exit Price:</strong> $${exitPrice.toFixed(2)}</p>
        <p><strong>Price Range:</strong> $${lowestPrice.toFixed(2)} - $${highestPrice.toFixed(2)}</p>
        <hr style="margin: 15px 0; border-color: ${isProfit ? '#c6f6d5' : '#fed7d7'};">
        <p style="font-size: 1.3em; font-weight: bold; color: ${profitColor};">
          <strong>Your P/L:</strong> ${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)} 
          (${profitLossPercent >= 0 ? '+' : ''}${profitLossPercent.toFixed(2)}%)
        </p>
      </div>

      <div style="margin-top: 15px; padding: 15px; background: #edf2f7; border-radius: 8px;">
        <h4 style="margin-top: 0;">📈 Performance Analysis</h4>
        <p><strong>Potential Max Profit:</strong> +$${potentialProfit.toFixed(2)} (+${((potentialProfit / startPrice) * 100).toFixed(2)}%)</p>
        <p><strong>Potential Max Loss:</strong> -$${potentialLoss.toFixed(2)} (-${((potentialLoss / startPrice) * 100).toFixed(2)}%)</p>
        <p><strong>Risk/Reward Ratio:</strong> 1:${(potentialProfit / potentialLoss).toFixed(2)}</p>
        <p><strong>Actual High:</strong> $${highestPrice.toFixed(2)} (${highestPrice >= takeProfit ? '✅ Hit target!' : `📊 ${((highestPrice - startPrice) / startPrice * 100).toFixed(2)}%`})</p>
        <p><strong>Actual Low:</strong> $${lowestPrice.toFixed(2)} (${lowestPrice <= stopLoss ? '⛔ Hit stop!' : `📊 ${((lowestPrice - startPrice) / startPrice * 100).toFixed(2)}%`})</p>
    `;

    // Performance evaluation
    html += `<hr style="margin: 15px 0;">`;
    
    if (isProfit) {
      const profitEfficiency = (profitLoss / potentialProfit) * 100;
      if (profitEfficiency >= 90) {
        html += `<p style="color: #22543d; font-weight: bold;">🌟 Excellent! You captured ${profitEfficiency.toFixed(0)}% of potential profit!</p>`;
      } else if (profitEfficiency >= 50) {
        html += `<p style="color: #744210; font-weight: bold;">✓ Good! You captured ${profitEfficiency.toFixed(0)}% of potential profit.</p>`;
      } else {
        html += `<p style="color: #744210; font-weight: bold;">💡 Profit made, but only ${profitEfficiency.toFixed(0)}% of potential.</p>`;
      }
    } else {
      const lossEfficiency = (Math.abs(profitLoss) / potentialLoss) * 100;
      if (lossEfficiency <= 50) {
        html += `<p style="color: #744210; font-weight: bold;">✓ Stop-loss worked! Limited loss to ${lossEfficiency.toFixed(0)}% of max risk.</p>`;
      } else if (lossEfficiency < 100) {
        html += `<p style="color: #742a2a; font-weight: bold;">⚠️ Loss: ${lossEfficiency.toFixed(0)}% of max risk realized.</p>`;
      } else {
        html += `<p style="color: #742a2a; font-weight: bold;">❌ Maximum loss realized. Review your strategy.</p>`;
      }
    }

    html += `</div>`;

    outputDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');

    // Scroll to results
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Clear strategy inputs
   */
  clearStrategy() {
    document.getElementById('take-profit-input').value = '';
    document.getElementById('stop-loss-input').value = '';
    document.getElementById('max-days-input').value = '';
    document.getElementById('strategy-result').classList.add('hidden');
    
    // Reset chart to initial data if quiz was submitted
    if (this.quizSubmitted && this.currentData) {
      this.quizSubmitted = false;
      this.renderPriceChart(this.currentData);
      this.renderVolumeChart(this.currentData);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ChartViewerApp();
});
