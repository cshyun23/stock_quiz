/**
 * Frontend JavaScript for Stock & Crypto Chart Viewer
 */

class ChartViewerApp {
  constructor() {
    this.priceChart = null;
    this.volumeChart = null;
    this.currentData = null;
    this.currentMetadata = null;
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    document.getElementById('load-chart-btn').addEventListener('click', () => {
      this.loadChart();
    });

    document.getElementById('reset-zoom-btn').addEventListener('click', () => {
      this.resetZoom();
    });

    document.getElementById('calculate-strategy-btn').addEventListener('click', () => {
      this.calculateStrategy();
    });

    document.getElementById('clear-strategy-btn').addEventListener('click', () => {
      this.clearStrategy();
    });
  }

  /**
   * Load chart data
   */
  async loadChart() {
    const assetType = document.getElementById('asset-type').value;
    const symbol = document.getElementById('symbol-input').value.trim();
    const timeframe = document.getElementById('timeframe-select').value;

    if (!symbol) {
      alert('Please enter a symbol or coin ID');
      return;
    }

    try {
      // Show loading state
      document.getElementById('load-chart-btn').textContent = 'Loading...';
      document.getElementById('load-chart-btn').disabled = true;

      // Fetch data based on asset type
      let response;
      if (assetType === 'stock') {
        response = await fetch(`/api/chart/stock/${symbol}?timeframe=${timeframe}`);
      } else {
        response = await fetch(`/api/chart/crypto/${symbol}?timeframe=${timeframe}`);
      }

      const result = await response.json();

      if (result.success) {
        this.currentData = result.data;
        this.currentMetadata = result.metadata;
        this.displayChart(symbol, result.data, result.metadata);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading chart:', error);
      alert('Failed to load chart. Please try again.');
    } finally {
      document.getElementById('load-chart-btn').textContent = 'Load Chart';
      document.getElementById('load-chart-btn').disabled = false;
    }
  }

  /**
   * Display chart on screen
   */
  displayChart(symbol, data, metadata) {
    // Show chart section
    document.getElementById('chart-display').classList.remove('hidden');

    // Set header info
    document.getElementById('chart-symbol').textContent = symbol.toUpperCase();
    document.getElementById('chart-name').textContent = metadata.name || '';

    // Render charts
    this.renderPriceChart(data);
    this.renderVolumeChart(data);

    // Display market info
    this.displayMarketInfo(metadata, data);
  }

  /**
   * Render price chart with zoom/pan capabilities
   */
  renderPriceChart(data) {
    const ctx = document.getElementById('price-chart').getContext('2d');

    // Destroy existing chart
    if (this.priceChart) {
      this.priceChart.destroy();
    }

    const labels = data.map(d => new Date(d.timestamp).toLocaleDateString());
    const prices = data.map(d => d.close || d.price);

    this.priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Close Price',
          data: prices,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.1
        }]
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
                return `Price: $${context.parsed.y.toFixed(2)}`;
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

    if (!this.currentData || this.currentData.length === 0) {
      alert('Please load chart data first');
      return;
    }

    const currentPrice = this.currentData[this.currentData.length - 1]?.close || 
                        this.currentData[this.currentData.length - 1]?.price || 0;

    // Calculate risk/reward ratio
    const potentialProfit = takeProfit - currentPrice;
    const potentialLoss = currentPrice - stopLoss;
    const riskRewardRatio = potentialProfit / potentialLoss;

    // Calculate percentages
    const profitPercent = (potentialProfit / currentPrice) * 100;
    const lossPercent = (potentialLoss / currentPrice) * 100;

    // Display results
    const resultDiv = document.getElementById('strategy-result');
    const outputDiv = document.getElementById('strategy-output');

    let html = `
      <p><strong>Current Price:</strong> $${currentPrice.toFixed(2)}</p>
      <p><strong>Take-Profit:</strong> $${takeProfit.toFixed(2)} (+${profitPercent.toFixed(2)}%)</p>
      <p><strong>Stop-Loss:</strong> $${stopLoss.toFixed(2)} (-${lossPercent.toFixed(2)}%)</p>
      <p><strong>Max Holding Period:</strong> ${maxDays} days</p>
      <p><strong>Risk/Reward Ratio:</strong> 1:${riskRewardRatio.toFixed(2)}</p>
      <hr style="margin: 15px 0;">
      <p><strong>Potential Profit:</strong> $${potentialProfit.toFixed(2)} (${profitPercent.toFixed(2)}%)</p>
      <p><strong>Potential Loss:</strong> $${potentialLoss.toFixed(2)} (${lossPercent.toFixed(2)}%)</p>
    `;

    if (riskRewardRatio >= 2) {
      html += `<p style="color: #22543d; font-weight: bold; margin-top: 10px;">✓ Good risk/reward ratio (>= 2:1)</p>`;
    } else if (riskRewardRatio >= 1) {
      html += `<p style="color: #744210; font-weight: bold; margin-top: 10px;">⚠ Acceptable risk/reward ratio</p>`;
    } else {
      html += `<p style="color: #742a2a; font-weight: bold; margin-top: 10px;">✗ Poor risk/reward ratio (< 1:1)</p>`;
    }

    outputDiv.innerHTML = html;
    resultDiv.classList.remove('hidden');
  }

  /**
   * Clear strategy inputs
   */
  clearStrategy() {
    document.getElementById('take-profit-input').value = '';
    document.getElementById('stop-loss-input').value = '';
    document.getElementById('max-days-input').value = '';
    document.getElementById('strategy-result').classList.add('hidden');
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ChartViewerApp();
});
