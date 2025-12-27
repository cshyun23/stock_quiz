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
    
    // Initialize cumulative statistics from localStorage
    this.cumulativeStats = this.loadCumulativeStats();
    
    this.init();
  }

  /**
   * Load cumulative statistics from localStorage
   */
  loadCumulativeStats() {
    const saved = localStorage.getItem('quizCumulativeStats');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      totalQuizzes: 0,
      wins: 0,
      losses: 0,
      totalProfitLoss: 0,
      totalProfitLossPercent: 0,
      bestTrade: { profitLoss: 0, profitLossPercent: 0, symbol: '', date: '' },
      worstTrade: { profitLoss: 0, profitLossPercent: 0, symbol: '', date: '' },
      avgHoldingDays: 0,
      totalHoldingDays: 0,
      firstQuizDate: null
    };
  }

  /**
   * Save cumulative statistics to localStorage
   */
  saveCumulativeStats() {
    localStorage.setItem('quizCumulativeStats', JSON.stringify(this.cumulativeStats));
  }

  /**
   * Update cumulative statistics with new quiz result
   */
  updateCumulativeStats(result) {
    // Set first quiz date if this is the first quiz
    if (this.cumulativeStats.totalQuizzes === 0) {
      this.cumulativeStats.firstQuizDate = new Date().toISOString();
    }
    
    this.cumulativeStats.totalQuizzes++;
    this.cumulativeStats.totalHoldingDays += result.exitDay;
    
    if (result.profitLoss > 0) {
      this.cumulativeStats.wins++;
    } else {
      this.cumulativeStats.losses++;
    }
    
    this.cumulativeStats.totalProfitLoss += result.profitLoss;
    this.cumulativeStats.totalProfitLossPercent += result.profitLossPercent;
    
    this.cumulativeStats.avgHoldingDays = 
      this.cumulativeStats.totalHoldingDays / this.cumulativeStats.totalQuizzes;
    
    // Update best trade
    if (result.profitLoss > this.cumulativeStats.bestTrade.profitLoss) {
      this.cumulativeStats.bestTrade = {
        profitLoss: result.profitLoss,
        profitLossPercent: result.profitLossPercent,
        symbol: this.currentSymbol,
        date: new Date().toISOString()
      };
    }
    
    // Update worst trade
    if (result.profitLoss < this.cumulativeStats.worstTrade.profitLoss) {
      this.cumulativeStats.worstTrade = {
        profitLoss: result.profitLoss,
        profitLossPercent: result.profitLossPercent,
        symbol: this.currentSymbol,
        date: new Date().toISOString()
      };
    }
    
    this.saveCumulativeStats();
  }

  /**
   * Reset cumulative statistics
   */
  resetCumulativeStats() {
    if (confirm('Are you sure you want to reset all cumulative statistics?')) {
      this.cumulativeStats = {
        totalQuizzes: 0,
        wins: 0,
        losses: 0,
        totalProfitLoss: 0,
        totalProfitLossPercent: 0,
        bestTrade: { profitLoss: 0, profitLossPercent: 0, symbol: '', date: '' },
        worstTrade: { profitLoss: 0, profitLossPercent: 0, symbol: '', date: '' },
        avgHoldingDays: 0,
        totalHoldingDays: 0,
        firstQuizDate: null
      };
      this.saveCumulativeStats();
      
      // Clear cumulative display
      const cumulativeOutput = document.getElementById('cumulative-output');
      if (cumulativeOutput) {
        cumulativeOutput.innerHTML = '<p style="color: #666; font-style: italic;">No statistics yet. Complete a quiz to start tracking!</p>';
      }
    }
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

    document.getElementById('view-dashboard-btn').addEventListener('click', () => {
      this.showDashboard();
    });

    document.getElementById('close-dashboard-btn').addEventListener('click', () => {
      this.closeDashboard();
    });
  }

  /**
   * Attach example button listeners
   */
  attachExampleButtonListeners() {
    const exampleButtons = document.querySelectorAll('.example-btn-sidebar');
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

    // Attach toggle listener for examples section
    this.attachExamplesToggle();
  }

  /**
   * Attach toggle functionality for examples sidebar
   */
  attachExamplesToggle() {
    const toggleHeader = document.getElementById('examples-toggle');
    const content = document.getElementById('examples-content');
    const toggleIcon = toggleHeader.querySelector('.toggle-icon');

    // Load saved state from localStorage
    const isCollapsed = localStorage.getItem('examplesCollapsed') === 'true';
    if (isCollapsed) {
      content.classList.add('collapsed');
      toggleIcon.classList.add('collapsed');
    }

    toggleHeader.addEventListener('click', () => {
      const willBeCollapsed = !content.classList.contains('collapsed');
      
      content.classList.toggle('collapsed');
      toggleIcon.classList.toggle('collapsed');
      
      // Save state to localStorage
      localStorage.setItem('examplesCollapsed', willBeCollapsed.toString());
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

    // Update cumulative statistics
    this.updateCumulativeStats({
      profitLoss,
      profitLossPercent,
      exitDay,
      startPrice,
      exitPrice,
      exitReason
    });

    // Re-render charts with combined data and strategy lines
    this.renderPriceChart(combinedData, takeProfit, stopLoss);
    this.renderVolumeChart(combinedData);

    // Display current quiz result
    this.displayCurrentResult({
      startPrice,
      takeProfit,
      stopLoss,
      maxDays,
      exitPrice,
      exitReason,
      exitDay,
      profitLoss,
      profitLossPercent,
      potentialProfit,
      potentialLoss,
      highestPrice,
      lowestPrice
    });

    // Display cumulative statistics
    this.displayCumulativeStats();

    // Show result section
    document.getElementById('strategy-result').classList.remove('hidden');

    // Scroll to results
    document.getElementById('strategy-result').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    });
  }

  /**
   * Display current quiz result
   */
  displayCurrentResult(result) {
    const outputDiv = document.getElementById('strategy-output');
    const isProfit = result.profitLoss > 0;
    const profitColor = isProfit ? '#22543d' : '#742a2a';
    const profitSymbol = isProfit ? '📈' : '📉';

    let html = `
      <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h5 style="margin-top: 0; color: #2d3748;">📊 Your Strategy</h5>
        <p><strong>Entry Price:</strong> $${result.startPrice.toFixed(2)} (${new Date(this.cutoffDate).toLocaleDateString()})</p>
        <p><strong>Profit Target:</strong> $${result.takeProfit.toFixed(2)} (+${((result.takeProfit - result.startPrice) / result.startPrice * 100).toFixed(2)}%)</p>
        <p><strong>Stop Loss:</strong> $${result.stopLoss.toFixed(2)} (-${((result.startPrice - result.stopLoss) / result.startPrice * 100).toFixed(2)}%)</p>
        <p><strong>Max Days:</strong> ${result.maxDays} days</p>
      </div>

      <div style="background: ${isProfit ? '#f0fff4' : '#fff5f5'}; padding: 15px; border-radius: 8px; border: 2px solid ${isProfit ? '#48bb78' : '#f56565'};">
        <h5 style="margin-top: 0; color: ${profitColor};">${profitSymbol} ${result.exitReason}</h5>
        <p><strong>Days Held:</strong> ${result.exitDay} day(s)</p>
        <p><strong>Exit Price:</strong> $${result.exitPrice.toFixed(2)}</p>
        <p><strong>Price Range:</strong> $${result.lowestPrice.toFixed(2)} - $${result.highestPrice.toFixed(2)}</p>
        <hr style="margin: 15px 0; border-color: ${isProfit ? '#c6f6d5' : '#fed7d7'};">
        <p style="font-size: 1.3em; font-weight: bold; color: ${profitColor};">
          <strong>Your P/L:</strong> ${result.profitLoss >= 0 ? '+' : ''}$${result.profitLoss.toFixed(2)} 
          (${result.profitLossPercent >= 0 ? '+' : ''}${result.profitLossPercent.toFixed(2)}%)
        </p>
      </div>

      <div style="margin-top: 15px; padding: 15px; background: #edf2f7; border-radius: 8px;">
        <h5 style="margin-top: 0; color: #2d3748;">📈 Performance Analysis</h5>
        <p><strong>Potential Max Profit:</strong> +$${result.potentialProfit.toFixed(2)} (+${((result.potentialProfit / result.startPrice) * 100).toFixed(2)}%)</p>
        <p><strong>Potential Max Loss:</strong> -$${result.potentialLoss.toFixed(2)} (-${((result.potentialLoss / result.startPrice) * 100).toFixed(2)}%)</p>
        <p><strong>Risk/Reward Ratio:</strong> 1:${(result.potentialProfit / result.potentialLoss).toFixed(2)}</p>
        <p><strong>Actual High:</strong> $${result.highestPrice.toFixed(2)} (${result.highestPrice >= result.takeProfit ? '✅ Hit target!' : `📊 ${((result.highestPrice - result.startPrice) / result.startPrice * 100).toFixed(2)}%`})</p>
        <p><strong>Actual Low:</strong> $${result.lowestPrice.toFixed(2)} (${result.lowestPrice <= result.stopLoss ? '⛔ Hit stop!' : `📊 ${((result.lowestPrice - result.startPrice) / result.startPrice * 100).toFixed(2)}%`})</p>
        <hr style="margin: 15px 0;">
    `;

    // Performance evaluation
    if (isProfit) {
      const profitEfficiency = (result.profitLoss / result.potentialProfit) * 100;
      if (profitEfficiency >= 90) {
        html += `<p style="color: #22543d; font-weight: bold;">🌟 Excellent! You captured ${profitEfficiency.toFixed(0)}% of potential profit!</p>`;
      } else if (profitEfficiency >= 50) {
        html += `<p style="color: #744210; font-weight: bold;">✓ Good! You captured ${profitEfficiency.toFixed(0)}% of potential profit.</p>`;
      } else {
        html += `<p style="color: #744210; font-weight: bold;">💡 Profit made, but only ${profitEfficiency.toFixed(0)}% of potential.</p>`;
      }
    } else {
      const lossEfficiency = (Math.abs(result.profitLoss) / result.potentialLoss) * 100;
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
  }

  /**
   * Display cumulative statistics
   */
  displayCumulativeStats() {
    const cumulativeOutput = document.getElementById('cumulative-output');
    const stats = this.cumulativeStats;

    if (stats.totalQuizzes === 0) {
      cumulativeOutput.innerHTML = '<p style="color: #666; font-style: italic;">No statistics yet. Complete a quiz to start tracking!</p>';
      return;
    }

    const winRate = (stats.wins / stats.totalQuizzes) * 100;
    const avgProfitLossPercent = stats.totalProfitLossPercent / stats.totalQuizzes;
    const isPositiveOverall = stats.totalProfitLoss > 0;

    let html = `
      <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h5 style="margin-top: 0; color: #2d3748;">📊 Overall Performance</h5>
        <p><strong>Total Quizzes:</strong> ${stats.totalQuizzes}</p>
        <p><strong>Win Rate:</strong> ${winRate.toFixed(1)}% (${stats.wins}W / ${stats.losses}L)</p>
        <p><strong>Avg Holding Period:</strong> ${stats.avgHoldingDays.toFixed(1)} days</p>
      </div>

      <div style="background: ${isPositiveOverall ? '#f0fff4' : '#fff5f5'}; padding: 15px; border-radius: 8px; border: 2px solid ${isPositiveOverall ? '#48bb78' : '#f56565'}; margin-bottom: 15px;">
        <h5 style="margin-top: 0; color: ${isPositiveOverall ? '#22543d' : '#742a2a'};">💰 Total P/L</h5>
        <p style="font-size: 1.2em; font-weight: bold; color: ${isPositiveOverall ? '#22543d' : '#742a2a'};">
          ${stats.totalProfitLoss >= 0 ? '+' : ''}$${stats.totalProfitLoss.toFixed(2)}
        </p>
        <p><strong>Avg P/L per Quiz:</strong> ${avgProfitLossPercent >= 0 ? '+' : ''}${avgProfitLossPercent.toFixed(2)}%</p>
      </div>

      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #22c55e;">
        <h5 style="margin-top: 0; color: #15803d;">🏆 Best Trade</h5>
        ${stats.bestTrade.symbol ? `
          <p><strong>Symbol:</strong> ${stats.bestTrade.symbol}</p>
          <p><strong>P/L:</strong> +$${stats.bestTrade.profitLoss.toFixed(2)} (+${stats.bestTrade.profitLossPercent.toFixed(2)}%)</p>
          <p><strong>Date:</strong> ${new Date(stats.bestTrade.date).toLocaleDateString()}</p>
        ` : '<p style="color: #666;">N/A</p>'}
      </div>

      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ef4444;">
        <h5 style="margin-top: 0; color: #991b1b;">📉 Worst Trade</h5>
        ${stats.worstTrade.symbol ? `
          <p><strong>Symbol:</strong> ${stats.worstTrade.symbol}</p>
          <p><strong>P/L:</strong> $${stats.worstTrade.profitLoss.toFixed(2)} (${stats.worstTrade.profitLossPercent.toFixed(2)}%)</p>
          <p><strong>Date:</strong> ${new Date(stats.worstTrade.date).toLocaleDateString()}</p>
        ` : '<p style="color: #666;">N/A</p>'}
      </div>

      <button onclick="app.saveToDashboard()" class="btn btn-primary" style="width: 100%; margin-bottom: 10px;">
        💾 Save to Dashboard
      </button>
      <button onclick="app.resetCumulativeStats()" class="btn btn-secondary" style="width: 100%; margin-top: 10px;">
        🔄 Reset Statistics
      </button>
    `;

    cumulativeOutput.innerHTML = html;
  }

  /**
   * Save current cumulative stats to dashboard
   */
  saveToDashboard() {
    const stats = this.cumulativeStats;
    
    if (stats.totalQuizzes === 0) {
      alert('No statistics to save. Complete at least one quiz first!');
      return;
    }

    const userId = prompt('Enter your ID (nickname) for the dashboard:');
    if (!userId || userId.trim() === '') {
      return;
    }

    // Load existing dashboard data
    let dashboardData = this.loadDashboardData();
    
    // Calculate period for this save
    const firstSaveDate = stats.firstQuizDate || new Date().toISOString();
    const lastSaveDate = new Date().toISOString();
    const periodDays = Math.ceil((new Date(lastSaveDate) - new Date(firstSaveDate)) / (1000 * 60 * 60 * 24));
    
    // Create dashboard entry
    const entry = {
      id: userId.trim(),
      savedAt: lastSaveDate,
      startDate: firstSaveDate,
      periodDays: periodDays,
      totalQuizzes: stats.totalQuizzes,
      wins: stats.wins,
      losses: stats.losses,
      winRate: (stats.wins / stats.totalQuizzes) * 100,
      totalProfitLoss: stats.totalProfitLoss,
      totalProfitLossPercent: stats.totalProfitLossPercent,
      avgProfitLossPercent: stats.totalProfitLossPercent / stats.totalQuizzes,
      avgHoldingDays: stats.avgHoldingDays,
      bestTrade: stats.bestTrade,
      worstTrade: stats.worstTrade,
      profitPerDay: periodDays > 0 ? stats.totalProfitLoss / periodDays : 0
    };

    // Check if user already exists
    const existingIndex = dashboardData.findIndex(item => item.id === userId.trim());
    if (existingIndex >= 0) {
      const overwrite = confirm(`ID "${userId}" already exists. Overwrite?`);
      if (overwrite) {
        dashboardData[existingIndex] = entry;
      } else {
        return;
      }
    } else {
      dashboardData.push(entry);
    }

    // Save to localStorage
    this.saveDashboardData(dashboardData);
    
    alert(`✅ Saved to dashboard as "${userId}"!\n\nClick "View Dashboard" to see all entries.`);
  }

  /**
   * Load dashboard data from localStorage
   */
  loadDashboardData() {
    const saved = localStorage.getItem('tradingDashboard');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  }

  /**
   * Save dashboard data to localStorage
   */
  saveDashboardData(data) {
    localStorage.setItem('tradingDashboard', JSON.stringify(data));
  }

  /**
   * Display dashboard
   */
  showDashboard() {
    const dashboardSection = document.getElementById('dashboard-section');
    const symbolSection = document.getElementById('symbol-selection');
    const chartDisplay = document.getElementById('chart-display');
    
    // Hide other sections
    symbolSection.classList.add('hidden');
    chartDisplay.classList.add('hidden');
    
    // Show dashboard
    dashboardSection.classList.remove('hidden');
    
    // Render dashboard content
    this.renderDashboard();
  }

  /**
   * Close dashboard
   */
  closeDashboard() {
    const dashboardSection = document.getElementById('dashboard-section');
    const symbolSection = document.getElementById('symbol-selection');
    
    dashboardSection.classList.add('hidden');
    symbolSection.classList.remove('hidden');
  }

  /**
   * Render dashboard content
   */
  renderDashboard() {
    const dashboardList = document.getElementById('dashboard-list');
    const data = this.loadDashboardData();

    if (data.length === 0) {
      dashboardList.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #666;">
          <h3>No dashboard entries yet</h3>
          <p>Complete quizzes and save your statistics to the dashboard!</p>
        </div>
      `;
      return;
    }

    // Sort by total profit/loss (descending)
    data.sort((a, b) => b.totalProfitLoss - a.totalProfitLoss);

    let html = `
      <div class="dashboard-stats-summary">
        <div class="stat-card">
          <span class="stat-label">Total Entries</span>
          <span class="stat-value">${data.length}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Top Performer</span>
          <span class="stat-value" style="color: #22543d;">
            ${data[0].id}<br>
            <span style="font-size: 0.8em;">+$${data[0].totalProfitLoss.toFixed(2)}</span>
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Avg Win Rate</span>
          <span class="stat-value">${(data.reduce((sum, d) => sum + d.winRate, 0) / data.length).toFixed(1)}%</span>
        </div>
      </div>

      <table class="dashboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>ID</th>
            <th>Quizzes</th>
            <th>Win Rate</th>
            <th>Total P/L</th>
            <th>Avg P/L %</th>
            <th>Period (Days)</th>
            <th>P/L per Day</th>
            <th>Saved Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach((entry, index) => {
      const isPositive = entry.totalProfitLoss >= 0;
      const plColor = isPositive ? '#22543d' : '#742a2a';
      const plBg = isPositive ? '#f0fff4' : '#fff5f5';
      
      html += `
        <tr>
          <td><strong>${index + 1}</strong></td>
          <td><strong>${entry.id}</strong></td>
          <td>${entry.totalQuizzes}</td>
          <td>${entry.winRate.toFixed(1)}% <span style="color: #666; font-size: 0.9em;">(${entry.wins}/${entry.losses})</span></td>
          <td style="background: ${plBg}; color: ${plColor}; font-weight: bold;">
            ${isPositive ? '+' : ''}$${entry.totalProfitLoss.toFixed(2)}
          </td>
          <td style="color: ${plColor};">
            ${entry.avgProfitLossPercent >= 0 ? '+' : ''}${entry.avgProfitLossPercent.toFixed(2)}%
          </td>
          <td>${entry.periodDays}</td>
          <td style="color: ${entry.profitPerDay >= 0 ? '#22543d' : '#742a2a'};">
            ${entry.profitPerDay >= 0 ? '+' : ''}$${entry.profitPerDay.toFixed(2)}
          </td>
          <td style="font-size: 0.9em; color: #666;">
            ${new Date(entry.savedAt).toLocaleDateString()}
          </td>
          <td>
            <button onclick="app.deleteDashboardEntry('${entry.id}')" class="btn-small btn-danger">Delete</button>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
      <div style="margin-top: 20px; text-align: center;">
        <button onclick="app.clearDashboard()" class="btn btn-secondary">🗑️ Clear All Dashboard Data</button>
      </div>
    `;

    dashboardList.innerHTML = html;
  }

  /**
   * Delete a dashboard entry
   */
  deleteDashboardEntry(userId) {
    if (!confirm(`Delete entry for "${userId}"?`)) {
      return;
    }

    let data = this.loadDashboardData();
    data = data.filter(entry => entry.id !== userId);
    this.saveDashboardData(data);
    this.renderDashboard();
  }

  /**
   * Clear all dashboard data
   */
  clearDashboard() {
    if (!confirm('Are you sure you want to clear ALL dashboard data? This cannot be undone!')) {
      return;
    }

    localStorage.removeItem('tradingDashboard');
    this.renderDashboard();
  }

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
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new ChartViewerApp();
});
