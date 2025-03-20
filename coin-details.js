let chart;
let balance = 10000;
let portfolio = [];
let selectedCoin = null;
let priceUpdateInterval;

// Initialize chart with Plotly
function initChart() {
    console.log('Initializing chart with Plotly...');
    const chartContainer = document.getElementById('chart');
    if (!chartContainer) {
        console.error('Chart container not found!');
        return;
    }
    console.log('Chart container found:', chartContainer);
    
    // Create empty plot initially
    Plotly.newPlot('chart', [], {
        paper_bgcolor: '#252525',
        plot_bgcolor: '#252525',
        margin: { t: 20, l: 50, r: 50, b: 20 },
        xaxis: {
            gridcolor: '#2B2B43',
            color: '#d1d4dc',
            rangeslider: {
                visible: false
            }
        },
        yaxis: {
            gridcolor: '#2B2B43',
            color: '#d1d4dc',
            side: 'right'
        },
        legend: {
            x: 0,
            y: 1,
            font: {
                color: '#d1d4dc'
            }
        }
    }, {
        responsive: true
    });
}

// Generate candle data
function generateCandleData(initialPrice, duration, volatility) {
    const data = [];
    let currentPrice = initialPrice;
    let time = new Date();
    time.setSeconds(0, 0); // Round to nearest minute
    
    // Generate past data
    for (let i = 0; i < 50; i++) {
        const timestamp = new Date(time.getTime() - (50 - i) * 60000);
        const candle = generateCandle(currentPrice, volatility);
        currentPrice = candle.close;
        
        data.push({
            time: timestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume
        });
    }
    
    return data;
}

// Generate a single candle
function generateCandle(prevClose, volatility) {
    const change = (Math.random() * 2 - 1) * volatility * prevClose;
    const open = prevClose;
    const close = prevClose + change;
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    return {
        open,
        high,
        low,
        close,
        volume
    };
}

// Update chart with Plotly
function updateChartData(data) {
    // Extract data for Plotly format
    const times = data.map(candle => candle.time);
    const opens = data.map(candle => candle.open);
    const highs = data.map(candle => candle.high);
    const lows = data.map(candle => candle.low);
    const closes = data.map(candle => candle.close);
    const volumes = data.map(candle => candle.volume);
    
    // Create candlestick trace
    const candlestickTrace = {
        x: times,
        open: opens,
        high: highs,
        low: lows,
        close: closes,
        type: 'candlestick',
        name: selectedCoin ? selectedCoin.ticker : 'Price',
        increasing: {line: {color: '#26a69a'}, fillcolor: '#26a69a'},
        decreasing: {line: {color: '#ef5350'}, fillcolor: '#ef5350'}
    };
    
    // Create volume trace
    const volumeColors = closes.map((close, i) => close >= opens[i] ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)');
    
    const volumeTrace = {
        x: times,
        y: volumes,
        type: 'bar',
        name: 'Volume',
        yaxis: 'y2',
        marker: {
            color: volumeColors
        }
    };
    
    const layout = {
        paper_bgcolor: '#252525',
        plot_bgcolor: '#252525',
        margin: { t: 20, l: 50, r: 50, b: 20 },
        xaxis: {
            gridcolor: '#2B2B43',
            color: '#d1d4dc',
            rangeslider: {
                visible: false
            }
        },
        yaxis: {
            gridcolor: '#2B2B43',
            color: '#d1d4dc',
            side: 'right',
            title: 'Price',
            domain: [0.3, 1] // Reserve space for the volume bars
        },
        yaxis2: {
            title: 'Volume',
            overlaying: 'y',
            side: 'left',
            showgrid: false,
            color: '#d1d4dc',
            range: [0, Math.max(...volumes) * 3],
            domain: [0, 0.2] // Volume bars occupy the bottom 20% of the chart
        },
        legend: {
            x: 0,
            y: 1,
            font: {
                color: '#d1d4dc'
            }
        }
    };
    
    Plotly.react('chart', [candlestickTrace, volumeTrace], layout);
}

// Update chart with new candle
function updateChart() {
    if (!selectedCoin) return;

    // Get the current data
    const chartDiv = document.getElementById('chart');
    const plotData = chartDiv.data;

    if (!plotData || plotData.length === 0) return;

    // Extract the last timestamp and price from the plot
    const lastIndex = plotData[0].x.length - 1;
    const lastTime = new Date(plotData[0].x[lastIndex]);
    const lastClose = plotData[0].close[lastIndex];

    // Generate new candle based on last close
    const newTime = new Date(lastTime.getTime() + 60000); // Add 1 minute
    const volatility = 0.02 + Math.random() * 0.03; // 2-5% volatility
    const change = (Math.random() * 2 - 1) * volatility * lastClose;

    const open = lastClose;
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    // Append new candle to the existing data
    const newCandle = {
        time: newTime,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: volume
    };

    // Update the chart with new data
    Plotly.extendTraces('chart', {
        x: [[newTime]],
        open: [[open]],
        high: [[high]],
        low: [[low]],
        close: [[close]]
    }, [0]); // Update candlestick trace (index 0)

    Plotly.extendTraces('chart', {
        x: [[newTime]],
        y: [[volume]]
    }, [1]); // Update volume trace (index 1)

    // Update the volume bar colors
    const volumeColor = close >= open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)';
    Plotly.restyle('chart', {
        marker: { color: [...plotData[1].marker.color, volumeColor] }
    }, [1]);

    // Update price display and other UI elements
    selectedCoin.currentPrice = close;
    selectedCoin.priceHistory.push(close);
    updatePriceDisplay();

    // Calculate market cap
    const marketCap = close * (selectedCoin.initialMcap * 100000);
    document.getElementById('market-cap').textContent = `$${formatNumber(marketCap)}`;

    // Calculate and display volume
    document.getElementById('volume').textContent = `$${formatNumber(volume * close)}`;

    // Calculate supply
    const supply = selectedCoin.initialMcap * 100000;
    document.getElementById('supply').textContent = formatNumber(supply) + ' ' + selectedCoin.ticker;

    // Update buy/sell calculations
    updateTradeCalculations();
}

// Format large numbers with K, M, B suffixes
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}

// Update price display
function updatePriceDisplay() {
    if (!selectedCoin || selectedCoin.priceHistory.length < 2) return;
    
    const currentPrice = selectedCoin.currentPrice;
    const initialPrice = selectedCoin.priceHistory[0];
    const change = ((currentPrice - initialPrice) / initialPrice) * 100;
    
    document.getElementById('current-price').textContent = `$${currentPrice.toFixed(8)}`;
    
    const priceChangeElement = document.getElementById('price-change');
    priceChangeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    priceChangeElement.style.color = change >= 0 ? '#64f291' : '#ff4d4d';
}

// Update trade calculations
function updateTradeCalculations() {
    if (!selectedCoin) return;
    
    const buyAmount = parseFloat(document.getElementById('buy-amount').value) || 0;
    const buyTokens = buyAmount / selectedCoin.currentPrice;
    document.getElementById('buy-tokens').value = buyTokens.toLocaleString(undefined, { maximumFractionDigits: 2 });
    
    const sellTokens = parseFloat(document.getElementById('sell-tokens').value) || 0;
    const sellAmount = sellTokens * selectedCoin.currentPrice;
    document.getElementById('sell-amount').value = sellAmount.toLocaleString(undefined, { maximumFractionDigits: 2, style: 'currency', currency: 'USD' });
}

// Array to store trade events
let tradeEvents = [];

// Create notification system
function createNotificationSystem() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1000';
        container.style.maxWidth = '350px';
        container.style.width = '100%';
        document.body.appendChild(container);
        
        // Add styles for notifications
        const style = document.createElement('style');
        style.textContent = `
            .app-notification {
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                color: white;
                font-weight: 500;
                display: flex;
                justify-content: space-between;
                align-items: center;
                animation: slideIn 0.3s ease-out forwards;
                max-width: 350px;
                width: 100%;
                box-sizing: border-box;
                position: relative;
                transform: translateX(400px);
            }
            
            .app-notification.success {
                background-color: #2ecc71;
            }
            
            .app-notification.error {
                background-color: #e74c3c;
            }
            
            .app-notification.info {
                background-color: #3498db;
            }
            
            .app-notification.warning {
                background-color: #f39c12;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 18px;
                line-height: 1;
                opacity: 0.7;
                transition: opacity 0.2s;
                margin-left: 10px;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            .notification-content {
                flex-grow: 1;
            }
            
            .notification-title {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
            
            .slide-out {
                animation: slideOut 0.3s ease-in forwards;
            }
        `;
        document.head.appendChild(style);
    }
}

// Show notification
function showNotification(type, title, message, duration = 5000) {
    // Ensure notification container exists
    createNotificationSystem();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `app-notification ${type}`;
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div>${message}</div>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to container
    const container = document.getElementById('notification-container');
    container.appendChild(notification);
    
    // Auto dismiss after duration
    const timeoutId = setTimeout(() => {
        dismissNotification(notification);
    }, duration);
    
    // Add click handler to close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(timeoutId);
        dismissNotification(notification);
    });
    
    // Force layout calculation to trigger animation
    notification.offsetHeight;
    
    return notification;
}

// Dismiss notification with animation
function dismissNotification(notification) {
    notification.classList.add('slide-out');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300); // Match the slideOut animation duration
}

// Modified buyCoin function to show notifications instead of alerts
function buyCoin() {
    if (!selectedCoin) return;
    
    const buyAmount = parseFloat(document.getElementById('buy-amount').value);
    if (isNaN(buyAmount) || buyAmount <= 0) {
        showNotification('error', 'Invalid Amount', 'Please enter a valid amount');
        return;
    }
    
    if (buyAmount > balance) {
        showNotification('error', 'Insufficient Balance', 'You don\'t have enough balance for this transaction');
        return;
    }
    
    const tokensReceived = buyAmount / selectedCoin.currentPrice;
    
    // Update balance
    balance -= buyAmount;
    document.getElementById('balance').textContent = `$${balance.toLocaleString()}`;
    
    // Update portfolio
    const existingHolding = portfolio.find(h => h.coinId === selectedCoin.id);
    if (existingHolding) {
        existingHolding.amount += tokensReceived;
        existingHolding.investment += buyAmount;
    } else {
        portfolio.push({
            coinId: selectedCoin.id,
            amount: tokensReceived,
            investment: buyAmount
        });
    }
    
    // Update sell input
    const totalHolding = portfolio.find(h => h.coinId === selectedCoin.id)?.amount || 0;
    document.getElementById('sell-tokens').max = totalHolding;
    document.getElementById('sell-tokens').placeholder = `Max: ${totalHolding.toLocaleString()}`;
    
    // Save to local storage
    localStorage.setItem('balance', balance);
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    
    // Get the current time and round it to the nearest minute
    const currentTime = roundToNearestMinute(new Date());
    
    // Add trade marker
    addTradeMarker('buy', currentTime, selectedCoin.currentPrice, tokensReceived);

    // Show success notification
    showNotification('success', 'Purchase Successful', 
        `You bought ${tokensReceived.toLocaleString()} ${selectedCoin.ticker} for $${buyAmount.toLocaleString()}`);
}

// Modified sellCoin function to show notifications instead of alerts
function sellCoin() {
    if (!selectedCoin) return;
    
    const sellTokens = parseFloat(document.getElementById('sell-tokens').value);
    if (isNaN(sellTokens) || sellTokens <= 0) {
        showNotification('error', 'Invalid Amount', 'Please enter a valid amount');
        return;
    }
    
    const holding = portfolio.find(h => h.coinId === selectedCoin.id);
    if (!holding || holding.amount < sellTokens) {
        showNotification('error', 'Insufficient Tokens', 'You don\'t have enough tokens to sell');
        return;
    }
    
    const sellAmount = sellTokens * selectedCoin.currentPrice;
    
    // Update balance
    balance += sellAmount;
    document.getElementById('balance').textContent = `$${balance.toLocaleString()}`;
    
    // Update portfolio
    holding.amount -= sellTokens;
    if (holding.amount <= 0) {
        portfolio = portfolio.filter(h => h.coinId !== selectedCoin.id);
    }
    
    // Update sell input
    const totalHolding = portfolio.find(h => h.coinId === selectedCoin.id)?.amount || 0;
    document.getElementById('sell-tokens').max = totalHolding;
    document.getElementById('sell-tokens').placeholder = `Max: ${totalHolding.toLocaleString()}`;
    
    // Save to local storage
    localStorage.setItem('balance', balance);
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    
    // Record sell event
    // Get the current time (aligned with the last candle's time)
    const currentTime = new Date(); // Use the current time
    const lastCandleTime = new Date(plotData[0].x[plotData[0].x.length - 1]); // Last candle's time

    // Use the last candle's time for alignment
    addTradeMarker('sell', lastCandleTime, selectedCoin.currentPrice, sellTokens);

    // Show success notification
    showNotification('success', 'Sale Successful', 
        `You sold ${sellTokens.toLocaleString()} ${selectedCoin.ticker} for $${sellAmount.toLocaleString()}`);
}

// Function to add trade markers to the chart
// Function to add trade markers to the chart
function addTradeMarker(type, time, price, amount) {
    // Get the chart div
    const chartDiv = document.getElementById('chart');
    if (!chartDiv || !chartDiv.data) return;

    // Ensure time is a Date object
    if (!(time instanceof Date)) {
        time = new Date(time);
    }

    // Define marker properties based on type
    const markerProps = {
        buy: {
            color: '#26a69a', // Green for buy
            symbol: 'circle',
            size: 10,
            line: { width: 1, color: '#fff' }
        },
        sell: {
            color: '#ef5350', // Red for sell
            symbol: 'circle',
            size: 10,
            line: { width: 1, color: '#fff' }
        }
    };

    // Create scatter trace for the marker
    const markerTrace = {
        x: [time],
        y: [price],
        type: 'scatter',
        mode: 'markers',
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Position`,
        marker: markerProps[type],
        text: [`${type.toUpperCase()}: ${amount.toFixed(2)} @ $${price.toFixed(8)}`],
        hoverinfo: 'text',
        showlegend: true
    };

    // Add the marker trace to the chart
    Plotly.addTraces(chartDiv, [markerTrace]);

    // Add click event listener to the chart
    chartDiv.on('plotly_click', (data) => {
        const clickedPoint = data.points[0];
        if (clickedPoint.data.name.includes('Position')) {
            const tradeType = clickedPoint.data.name.split(' ')[0].toLowerCase();
            const tradeAmount = clickedPoint.data.text[0].split(' ')[1];
            const tradePrice = clickedPoint.data.text[0].split('@ ')[1];

            // Show trade details in a notification
            showNotification('info', `${tradeType.toUpperCase()} Position`, 
                `Amount: ${tradeAmount}\nPrice: ${tradePrice}`);
        }
    });
}

// Go back to main page
function goBack() {
    saveTradeEvents();
    clearInterval(priceUpdateInterval);
    window.location.href = 'index.html';
}

// Initialize
// ...existing code...

window.onload = function() {
    // Create notification system on page load
    createNotificationSystem();
    
    // Get coin ID from local storage
    const coinId = localStorage.getItem('selectedCoinId');
    if (!coinId) {
        showNotification('error', 'Error', 'Coin not found');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Get balance and portfolio from local storage
    const savedBalance = localStorage.getItem('balance');
    const savedPortfolio = localStorage.getItem('portfolio');
    
    if (savedBalance) {
        balance = parseFloat(savedBalance);
        document.getElementById('balance').textContent = `$${balance.toLocaleString()}`;
    }
    
    if (savedPortfolio) {
        portfolio = JSON.parse(savedPortfolio);
    }
    
    // Create mock coin data based on the selected coin ID
    const coinData = {
        BTC: {
            id: 'FUN',
            name: 'FUNFUNFUN',
            ticker: 'FUN',
            iconColor: 'hsl(120, 70%, 60%)',
            initialMcap: 4000,
            currentPrice: 47628.53,
            priceHistory: []
        },
        ETH: {
            id: 'GAY',
            name: 'Trump is gay',
            ticker: 'GAY',
            iconColor: 'hsl(240, 70%, 60%)',
            initialMcap: 2000,
            currentPrice: 3200.45,
            priceHistory: []
        },
        BNB: {
            id: 'love',
            name: 'i love the trenches',
            ticker: 'love',
            iconColor: 'hsl(60, 70%, 60%)',
            initialMcap: 1000,
            currentPrice: 420.67,
            priceHistory: []
        },
        ADA: {
            id: 'RUG',
            name: 'RUG PULL DONT BUY',
            ticker: 'RUG',
            iconColor: 'hsl(300, 70%, 60%)',
            initialMcap: 500,
            currentPrice: 1.25,
            priceHistory: []
        },
        SOL: {
            id: 'SOL',
            name: 'Solana is home',
            ticker: 'SOL',
            iconColor: 'hsl(180, 70%, 60%)',
            initialMcap: 800,
            currentPrice: 150.75,
            priceHistory: []
        }
    };
    
    selectedCoin = coinData[coinId];
    
    if (!selectedCoin) {
        showNotification('error', 'Error', 'Coin data not found');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Display coin details
    document.getElementById('coin-name').textContent = selectedCoin.name;
    document.getElementById('coin-ticker').textContent = selectedCoin.ticker;
    document.getElementById('coin-icon').style.backgroundColor = selectedCoin.iconColor;
    
    // Initialize chart
    initChart();
    
    // Generate initial candle data
    const initialData = generateCandleData(selectedCoin.currentPrice, 60, 0.03);
    
    // Set data to the chart
    updateChartData(initialData);
    
    // Update current price
    selectedCoin.currentPrice = initialData[initialData.length - 1].close;
    selectedCoin.priceHistory.push(selectedCoin.currentPrice);
    
    // Update price display
    updatePriceDisplay();
    
    // Calculate market cap
    const marketCap = selectedCoin.currentPrice * (selectedCoin.initialMcap * 100000);
    document.getElementById('market-cap').textContent = `$${formatNumber(marketCap)}`;
    
    // Calculate and display volume
    const volume = initialData[initialData.length - 1].volume;
    document.getElementById('volume').textContent = `$${formatNumber(volume * selectedCoin.currentPrice)}`;
    
    // Calculate supply
    const supply = selectedCoin.initialMcap * 100000;
    document.getElementById('supply').textContent = formatNumber(supply) + ' ' + selectedCoin.ticker;
    
    // Update buy/sell calculations
    updateTradeCalculations();
    
    // Set up event listeners
    document.getElementById('buy-amount').addEventListener('input', updateTradeCalculations);
    document.getElementById('sell-tokens').addEventListener('input', updateTradeCalculations);
    
    // Set up max tokens for sell
    const totalHolding = portfolio.find(h => h.coinId === selectedCoin.id)?.amount || 0;
    document.getElementById('sell-tokens').max = totalHolding;
    document.getElementById('sell-tokens').placeholder = `Max: ${totalHolding.toLocaleString()}`;
    
    // Start price updates
    priceUpdateInterval = setInterval(updateChart, 1000); // Update every second
    
    // Handle window resize
    window.addEventListener('resize', function() {
        Plotly.relayout('chart', {
            width: document.querySelector('.chart-container').clientWidth
        });
    });

    window.addEventListener('load', function() {
        // This should be added after the chart is initialized
        setTimeout(loadTradeMarkers, 1500); // Give chart time to load
    });

    window.addEventListener('beforeunload', saveTradeEvents);
    
    // Show welcome notification
    showNotification('info', 'Welcome to Trading View', 
        `You are now viewing ${selectedCoin.name} (${selectedCoin.ticker})`);
};

// Function to simulate market events
function simulateMarketEvent() {
    if (!selectedCoin) return;
    
    const events = [
        { type: 'pump', magnitude: 0.15, message: '🚀 Influencer just tweeted about ' + selectedCoin.ticker + '!' },
        { type: 'dump', magnitude: 0.12, message: '📉 Whale dumping ' + selectedCoin.ticker + '!' },
        { type: 'listing', magnitude: 0.25, message: '📢 ' + selectedCoin.ticker + ' listed on major exchange!' },
        { type: 'fud', magnitude: 0.18, message: '⚠️ FUD spreading about ' + selectedCoin.ticker + '!' }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    const direction = event.type === 'pump' || event.type === 'listing' ? 1 : -1;
    
    // Show event as a notification
    const notificationType = direction > 0 ? 'success' : 'warning';
    showNotification(notificationType, 'Market Event', event.message);
    
    // Apply price effect over the next few candles
    let effectApplied = 0;
    const applyEffect = setInterval(() => {
        // Get the current data
        const chartDiv = document.getElementById('chart');
        const plotData = chartDiv.data;
        
        if (!plotData || plotData.length === 0) {
            clearInterval(applyEffect);
            return;
        }
        
        // Apply effect to the last candle
        const lastIndex = plotData[0].close.length - 1;
        const effect = direction * (event.magnitude / 5) * plotData[0].close[lastIndex];
        
        plotData[0].close[lastIndex] += effect;
        plotData[0].high[lastIndex] = Math.max(plotData[0].high[lastIndex], plotData[0].close[lastIndex]);
        
        // Update the chart
        Plotly.redraw('chart');
        
        selectedCoin.currentPrice = plotData[0].close[lastIndex];
        updatePriceDisplay();
        updateTradeCalculations();
        
        effectApplied++;
        if (effectApplied >= 5) {
            clearInterval(applyEffect);
        }
    }, 3000);
}

// Randomly trigger market events
setInterval(() => {
    if (Math.random() > 0.9) { // 10% chance every minute
        simulateMarketEvent();
    }
}, 60000);

// Replace the existing trading panel with preset SOL buttons
function updateTradingPanel() {
    const tradingPanel = document.querySelector('.trading-panel');
    if (!tradingPanel) return;
    
    // Clear existing content
    tradingPanel.innerHTML = '';
    
    // Create buy form with preset buttons
    const buyForm = document.createElement('div');
    buyForm.className = 'trade-form';
    buyForm.innerHTML = `
        <h3>Buy</h3>
        <div class="preset-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
            <button class="btn btn-preset" data-amount="0.5">0.5 SOL</button>
            <button class="btn btn-preset" data-amount="1">1 SOL</button>
            <button class="btn btn-preset" data-amount="1.5">1.5 SOL</button>
            <button class="btn btn-preset" data-amount="5">5 SOL</button>
        </div>
        <div class="form-group">
            <label for="buy-tokens">Tokens you will receive</label>
            <input type="text" id="buy-tokens" readonly>
        </div>
        <div class="form-group">
            <label for="buy-usd-value">USD Value</label>
            <input type="text" id="buy-usd-value" readonly>
        </div>
        <button class="btn btn-buy" id="buy-button" disabled>Select Amount</button>
    `;
    
    // Create sell form with preset buttons
    const sellForm = document.createElement('div');
    sellForm.className = 'trade-form';
    sellForm.innerHTML = `
        <h3>Sell</h3>
        <div class="preset-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
            <button class="btn btn-preset-sell" data-amount="0.5">0.5 SOL</button>
            <button class="btn btn-preset-sell" data-amount="1">1 SOL</button>
            <button class="btn btn-preset-sell" data-amount="1.5">1.5 SOL</button>
            <button class="btn btn-preset-sell" data-amount="5">5 SOL</button>
        </div>
        <div class="form-group">
            <label for="sell-tokens">Tokens to sell</label>
            <input type="text" id="sell-tokens" readonly>
        </div>
        <div class="form-group">
            <label for="sell-usd-value">USD Value</label>
            <input type="text" id="sell-usd-value" readonly>
        </div>
        <button class="btn btn-sell" id="sell-button" disabled>Select Amount</button>
    `;
    
    // Style for preset buttons
    const style = document.createElement('style');
    style.textContent = `
        .btn-preset, .btn-preset-sell {
            background-color: #333;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        .btn-preset.selected {
            background-color: #2ecc71;
        }
        .btn-preset-sell.selected {
            background-color: #e74c3c;
        }
    `;
    document.head.appendChild(style);
    
    // Add forms to trading panel
    tradingPanel.appendChild(buyForm);
    tradingPanel.appendChild(sellForm);
    
    // Add event listeners for preset buttons
    const buyPresetButtons = document.querySelectorAll('.btn-preset');
    let selectedBuyAmount = null;
    const solPrice = 250; // SOL price in USD (you can update this dynamically)
    
    buyPresetButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Clear previous selection
            buyPresetButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Select current button
            button.classList.add('selected');
            
            // Get SOL amount
            selectedBuyAmount = parseFloat(button.getAttribute('data-amount'));
            
            // Calculate USD value
            const usdValue = selectedBuyAmount * solPrice;
            
            // Update buy button and display
            const buyButton = document.getElementById('buy-button');
            buyButton.textContent = `Buy ${selectedBuyAmount} SOL`;
            buyButton.disabled = false;
            
            // Update token calculations
            const tokensReceived = usdValue / selectedCoin.currentPrice;
            document.getElementById('buy-tokens').value = tokensReceived.toLocaleString(undefined, { maximumFractionDigits: 2 });
            document.getElementById('buy-usd-value').value = usdValue.toLocaleString(undefined, { 
                style: 'currency', 
                currency: 'USD' 
            });
        });
    });
    
    // Add event listeners for sell preset buttons
    const sellPresetButtons = document.querySelectorAll('.btn-preset-sell');
    let selectedSellAmount = null;
    
    sellPresetButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Clear previous selection
            sellPresetButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Select current button
            button.classList.add('selected');
            
            // Get SOL amount
            selectedSellAmount = parseFloat(button.getAttribute('data-amount'));
            
            // Calculate USD value
            const usdValue = selectedSellAmount * solPrice;
            
            // Calculate tokens equivalent
            const tokensToSell = usdValue / selectedCoin.currentPrice;
            
            // Update sell button and display
            const sellButton = document.getElementById('sell-button');
            sellButton.textContent = `Sell ${selectedSellAmount} SOL`;
            sellButton.disabled = false;
            
            // Update token calculations
            document.getElementById('sell-tokens').value = tokensToSell.toLocaleString(undefined, { maximumFractionDigits: 2 });
            document.getElementById('sell-usd-value').value = usdValue.toLocaleString(undefined, { 
                style: 'currency', 
                currency: 'USD' 
            });
        });
    });
    
    // Buy functionality
    document.getElementById('buy-button').addEventListener('click', () => {
        if (selectedBuyAmount === null) return;
        
        const usdValue = selectedBuyAmount * solPrice;
        
        if (usdValue > balance) {
            showNotification('error', 'Insufficient Balance', 'You don\'t have enough balance for this transaction');
            return;
        }
        
        const tokensReceived = usdValue / selectedCoin.currentPrice;
        
        // Update balance
        balance -= usdValue;
        document.getElementById('balance').textContent = `$${balance.toLocaleString()}`;
        
        // Update portfolio
        const existingHolding = portfolio.find(h => h.coinId === selectedCoin.id);
        if (existingHolding) {
            existingHolding.amount += tokensReceived;
            existingHolding.investment += usdValue;
        } else {
            portfolio.push({
                coinId: selectedCoin.id,
                amount: tokensReceived,
                investment: usdValue
            });
        }
        
        // Save to local storage
        localStorage.setItem('balance', balance);
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        
        // Record buy event
        const currentTime = new Date();
        tradeEvents.push({
            type: 'buy',
            time: currentTime,
            price: selectedCoin.currentPrice,
            amount: tokensReceived,
            value: usdValue
        });
        
        // Add marker to chart
        addTradeMarker('buy', currentTime, selectedCoin.currentPrice, tokensReceived);
        
        // Show success notification
        showNotification('success', 'Purchase Successful', 
            `You bought ${tokensReceived.toLocaleString()} ${selectedCoin.ticker} for ${selectedBuyAmount} SOL ($${usdValue.toLocaleString()})`);
    });
    
    // Sell functionality
    document.getElementById('sell-button').addEventListener('click', () => {
        if (selectedSellAmount === null) return;
        
        const usdValue = selectedSellAmount * solPrice;
        const tokensToSell = usdValue / selectedCoin.currentPrice;
        
        const holding = portfolio.find(h => h.coinId === selectedCoin.id);
        if (!holding || holding.amount < tokensToSell) {
            showNotification('error', 'Insufficient Tokens', 'You don\'t have enough tokens to sell');
            return;
        }
        
        // Update balance
        balance += usdValue;
        document.getElementById('balance').textContent = `$${balance.toLocaleString()}`;
        
        // Update portfolio
        holding.amount -= tokensToSell;
        if (holding.amount <= 0) {
            portfolio = portfolio.filter(h => h.coinId !== selectedCoin.id);
        }
        
        // Save to local storage
        localStorage.setItem('balance', balance);
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        
        // Record sell event
        const currentTime = new Date();
        tradeEvents.push({
            type: 'sell',
            time: currentTime,
            price: selectedCoin.currentPrice,
            amount: tokensToSell,
            value: usdValue
        });
        
        // Add marker to chart
        addTradeMarker('sell', currentTime, selectedCoin.currentPrice, tokensToSell);
        
        // Show success notification
        showNotification('success', 'Sale Successful', 
            `You sold ${tokensToSell.toLocaleString()} ${selectedCoin.ticker} for ${selectedSellAmount} SOL ($${usdValue.toLocaleString()})`);
    });
}

// Function to load historical trade markers when viewing a coin
function loadTradeMarkers() {
    // Check if we have stored trade events for this coin
    const storedEvents = localStorage.getItem(`tradeEvents_${selectedCoin.id}`);
    if (storedEvents) {
        const events = JSON.parse(storedEvents);
        events.forEach(event => {
            // Convert string time back to Date object
            const eventTime = new Date(event.time);
            addTradeMarker(event.type, eventTime, event.price, event.amount);
        });
    }
}

// Save trade events when navigating away
function saveTradeEvents() {
    if (selectedCoin && tradeEvents.length > 0) {
        localStorage.setItem(`tradeEvents_${selectedCoin.id}`, JSON.stringify(tradeEvents));
    }
}

// Call this function after the page loads
setTimeout(updateTradingPanel, 1000);

// Add a news feed section
function addNewsFeed() {
    const newsSection = document.createElement('div');
    newsSection.className = 'news-feed';
    newsSection.style.backgroundColor = '#1e1e1e';
    newsSection.style.padding = '20px';
    newsSection.style.borderRadius = '8px';
    newsSection.style.marginTop = '20px';
    
    newsSection.innerHTML = `
        <h2>Market News</h2>
        <div id="news-items" style="max-height: 200px; overflow-y: auto;">
            <div class="news-item" style="padding: 10px; border-bottom: 1px solid #333;">
                <div style="font-weight: bold;">Crypto Markets Show Strong Recovery</div>
                <div style="color: #999; font-size: 0.8em;">10 minutes ago</div>
            </div>
            <div class="news-item" style="padding: 10px; border-bottom: 1px solid #333;">
                <div style="font-weight: bold;">New Regulations Could Impact Smaller Coins</div>
                <div style="color: #999; font-size: 0.8em;">25 minutes ago</div>
            </div>
            <div class="news-item" style="padding: 10px; border-bottom: 1px solid #333;">
                <div style="font-weight: bold;">Whale Movements Detected Across Multiple Chains</div>
                <div style="color: #999; font-size: 0.8em;">45 minutes ago</div>
            </div>
        </div>
    `;
    
    document.querySelector('.coin-details').appendChild(newsSection);
    
    // Generate random news periodically
    const newsItems = [
        "Major Exchange Lists 5 New Tokens",
        "Market Analysis: Bull Run Expected",
        "New DeFi Protocol Gains Traction",
        "NFT Sales Hit Record High",
        "Institutional Investors Entering Crypto",
        "Social Media Platform Adopts Crypto Payments",
        "Meme Coins See Unprecedented Growth",
        "Mining Difficulty Increases 12%",
        "Layer-2 Solutions Addressing Scalability",
        "Gaming Tokens on the Rise"
    ];
    
    setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every minute
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            newsItem.style.padding = '10px';
            newsItem.style.borderBottom = '1px solid #333';
            
            const randomNews = newsItems[Math.floor(Math.random() * newsItems.length)];
            let coinSpecific = '';
            
            // 50% chance to reference the current coin
            if (Math.random() > 0.5 && selectedCoin) {
                const actions = [
                    `${selectedCoin.ticker} Featured in `, 
                    `${selectedCoin.name} Team Announces `, 
                    `Community Bullish on ${selectedCoin.ticker} After `
                ];
                coinSpecific = actions[Math.floor(Math.random() * actions.length)];
            }
            
            newsItem.innerHTML = `
                <div style="font-weight: bold;">${coinSpecific}${randomNews}</div>
                <div style="color: #999; font-size: 0.8em;">Just now</div>
            `;
            
            const newsItems = document.getElementById('news-items');
            newsItems.insertBefore(newsItem, newsItems.firstChild);
            
            // Remove old news
            if (newsItems.children.length > 10) {
                newsItems.removeChild(newsItems.lastChild);
            }
        }
    }, 60000);
}

// Call after page load
setTimeout(addNewsFeed, 1000);

// Add these functions to the coin-details.js file

// Calculate PnL for a specific coin
function calculatePnL() {
    if (!selectedCoin) return { unrealized: 0, realized: 0, total: 0 };
    
    // Get the holding for the selected coin
    const holding = portfolio.find(h => h.coinId === selectedCoin.id);
    
    // Initialize realized PnL
    let realizedPnL = 0;
    
    // Get realized PnL from trade history
    const coinTradeEvents = JSON.parse(localStorage.getItem(`tradeEvents_${selectedCoin.id}`)) || [];
    
    // Calculate realized PnL from sell events
    for (const event of coinTradeEvents) {
        if (event.type === 'sell') {
            // Calculate the average cost basis at the time of the sale
            const buysBeforeSell = coinTradeEvents.filter(e => 
                e.type === 'buy' && new Date(e.time) < new Date(event.time)
            );
            
            if (buysBeforeSell.length > 0) {
                const totalBuyAmount = buysBeforeSell.reduce((sum, e) => sum + e.amount, 0);
                const totalBuyValue = buysBeforeSell.reduce((sum, e) => sum + e.value, 0);
                const avgCostBasis = totalBuyValue / totalBuyAmount;
                
                // Calculate PnL for this sale
                const saleValue = event.value;
                const costBasis = avgCostBasis * event.amount;
                realizedPnL += saleValue - costBasis;
            }
        }
    }
    
    // Calculate unrealized PnL
    let unrealizedPnL = 0;
    if (holding) {
        // Current value
        const currentValue = holding.amount * selectedCoin.currentPrice;
        // Original investment
        const originalInvestment = holding.investment;
        // Unrealized PnL
        unrealizedPnL = currentValue - originalInvestment;
    }
    
    // Calculate total PnL
    const totalPnL = realizedPnL + unrealizedPnL;
    
    return {
        unrealized: unrealizedPnL,
        realized: realizedPnL,
        total: totalPnL
    };
}

// Format PnL value with colors
function formatPnL(value) {
    const formattedValue = value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    const color = value >= 0 ? '#64f291' : '#ff4d4d';
    const sign = value >= 0 ? '+' : '';
    
    return `<span style="color: ${color}">${sign}${formattedValue}</span>`;
}

// Create PnL display panel
function createPnLPanel() {
    // Create PnL container
    const pnlContainer = document.createElement('div');
    pnlContainer.className = 'pnl-container';
    pnlContainer.style.backgroundColor = '#1e1e1e';
    pnlContainer.style.padding = '20px';
    pnlContainer.style.borderRadius = '8px';
    pnlContainer.style.marginTop = '20px';
    pnlContainer.style.marginBottom = '20px';
    
    pnlContainer.innerHTML = `
        <h2>Profit & Loss</h2>
        <div class="pnl-details" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 10px;">
            <div class="pnl-item">
                <div class="pnl-label" style="color: #999; margin-bottom: 5px;">Unrealized P&L</div>
                <div id="unrealized-pnl" class="pnl-value" style="font-size: 1.2em; font-weight: bold;">$0.00</div>
            </div>
            <div class="pnl-item">
                <div class="pnl-label" style="color: #999; margin-bottom: 5px;">Realized P&L</div>
                <div id="realized-pnl" class="pnl-value" style="font-size: 1.2em; font-weight: bold;">$0.00</div>
            </div>
            <div class="pnl-item">
                <div class="pnl-label" style="color: #999; margin-bottom: 5px;">Total P&L</div>
                <div id="total-pnl" class="pnl-value" style="font-size: 1.2em; font-weight: bold;">$0.00</div>
            </div>
        </div>
        <div class="pnl-chart-container" style="height: 150px; margin-top: 15px;">
            <canvas id="pnl-chart"></canvas>
        </div>
    `;
    
    // Insert PnL panel before the trading panel
    const tradingPanel = document.querySelector('.trading-panel');
    tradingPanel.parentNode.insertBefore(pnlContainer, tradingPanel);
    
    // Initialize the PnL chart
    initPnLChart();
}

// Initialize PnL chart
function initPnLChart() {
    const ctx = document.getElementById('pnl-chart').getContext('2d');
    
    // Get historical PnL data or create empty dataset
    const pnlHistory = JSON.parse(localStorage.getItem(`pnlHistory_${selectedCoin.id}`)) || [];
    
    // If no history exists, create initial data points
    if (pnlHistory.length === 0) {
        // Create 10 initial data points with zero values
        const now = new Date();
        for (let i = 9; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60000); // One minute intervals
            pnlHistory.push({
                time: time.toISOString(),
                value: 0
            });
        }
    }
    
    // Prepare data for chart
    const labels = pnlHistory.map(item => {
        const date = new Date(item.time);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    
    const data = pnlHistory.map(item => item.value);
    
    // Create gradient for area under the line
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, 'rgba(38, 166, 154, 0.7)');  
    gradient.addColorStop(1, 'rgba(38, 166, 154, 0)');
    
    // Create chart
    window.pnlChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total P&L',
                data: data,
                borderColor: '#26a69a',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#26a69a'
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
                            return `P&L: ${context.raw.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD'
                            })}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#d1d4dc'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#d1d4dc',
                        callback: function(value) {
                            return value.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0
                            });
                        }
                    }
                }
            }
        }
    });
}

// Update PnL display
function updatePnLDisplay() {
    const pnl = calculatePnL();
    
    // Update PnL values
    document.getElementById('unrealized-pnl').innerHTML = formatPnL(pnl.unrealized);
    document.getElementById('realized-pnl').innerHTML = formatPnL(pnl.realized);
    document.getElementById('total-pnl').innerHTML = formatPnL(pnl.total);
    
    // Update PnL history
    updatePnLHistory(pnl.total);
}

// Update PnL history and chart
function updatePnLHistory(currentPnL) {
    // Get existing history or create new array
    let pnlHistory = JSON.parse(localStorage.getItem(`pnlHistory_${selectedCoin.id}`)) || [];
    
    // Add current PnL to history
    pnlHistory.push({
        time: new Date().toISOString(),
        value: currentPnL
    });
    
    // Keep only the last 50 data points
    if (pnlHistory.length > 50) {
        pnlHistory = pnlHistory.slice(-50);
    }
    
    // Save updated history
    localStorage.setItem(`pnlHistory_${selectedCoin.id}`, JSON.stringify(pnlHistory));
    
    // Update chart if it exists
    if (window.pnlChart) {
        // Prepare data for chart
        const labels = pnlHistory.map(item => {
            const date = new Date(item.time);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
        
        const data = pnlHistory.map(item => item.value);
        
        // Update chart data
        window.pnlChart.data.labels = labels;
        window.pnlChart.data.datasets[0].data = data;
        
        // Update chart colors based on PnL
        if (currentPnL >= 0) {
            window.pnlChart.data.datasets[0].borderColor = '#26a69a';
            const gradient = window.pnlChart.ctx.createLinearGradient(0, 0, 0, 150);
            gradient.addColorStop(0, 'rgba(38, 166, 154, 0.7)');  
            gradient.addColorStop(1, 'rgba(38, 166, 154, 0)');
            window.pnlChart.data.datasets[0].backgroundColor = gradient;
        } else {
            window.pnlChart.data.datasets[0].borderColor = '#ef5350';
            const gradient = window.pnlChart.ctx.createLinearGradient(0, 0, 0, 150);
            gradient.addColorStop(0, 'rgba(239, 83, 80, 0.7)');  
            gradient.addColorStop(1, 'rgba(239, 83, 80, 0)');
            window.pnlChart.data.datasets[0].backgroundColor = gradient;
        }
        
        window.pnlChart.update();
    }
}

// Update PnL when a trade occurs
function updatePnLAfterTrade() {
    updatePnLDisplay();
    
    // Show PnL notification
    const pnl = calculatePnL();
    const pnlType = pnl.total >= 0 ? 'success' : 'warning';
    const message = `Current P&L: ${formatPnL(pnl.total).replace(/<\/?span[^>]*>/g, '')}`;
    
    showNotification(pnlType, 'P&L Update', message);
}

// Modify buyCoin and sellCoin functions to update PnL
function modifyBuySellFunctions() {
    // Store original functions
    const originalBuyCoin = buyCoin;
    const originalSellCoin = sellCoin;
    
    // Replace with modified versions
    window.buyCoin = function() {
        // Call original function
        originalBuyCoin();
        
        // Update PnL after trade
        updatePnLAfterTrade();
    };
    
    window.sellCoin = function() {
        // Call original function
        originalSellCoin();
        
        // Update PnL after trade
        updatePnLAfterTrade();
    };
}

// Add these functions to the window.onload function
function enhanceWindowOnload() {
    const originalOnload = window.onload;
    
    window.onload = function() {
        // Call original onload
        originalOnload();
        
        // Create PnL panel after the original onload
        createPnLPanel();
        
        // Update PnL display initially
        updatePnLDisplay();
        
        // Modify buy/sell functions
        modifyBuySellFunctions();
        
        // Update PnL periodically
        setInterval(updatePnLDisplay, 15000); // Update every 15 seconds
        
        // Add profit statistics to the chart
        addProfitStats();
    };
}

// Add profit statistics below the main chart
function addProfitStats() {
    const statsContainer = document.createElement('div');
    statsContainer.className = 'profit-stats';
    statsContainer.style.display = 'grid';
    statsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    statsContainer.style.gap = '15px';
    statsContainer.style.padding = '15px';
    statsContainer.style.backgroundColor = '#1e1e1e';
    statsContainer.style.borderRadius = '8px';
    statsContainer.style.marginBottom = '20px';
    
    statsContainer.innerHTML = `
        <div class="stat-item">
            <div class="stat-label" style="color: #999; margin-bottom: 5px;">ROI</div>
            <div id="roi-value" class="stat-value" style="font-size: 1.2em; font-weight: bold;">0.00%</div>
        </div>
        <div class="stat-item">
            <div class="stat-label" style="color: #999; margin-bottom: 5px;">Win/Loss Ratio</div>
            <div id="winloss-ratio" class="stat-value" style="font-size: 1.2em; font-weight: bold;">0:0</div>
        </div>
        <div class="stat-item">
            <div class="stat-label" style="color: #999; margin-bottom: 5px;">Avg. Trade Profit</div>
            <div id="avg-profit" class="stat-value" style="font-size: 1.2em; font-weight: bold;">$0.00</div>
        </div>
    `;
    
    // Insert stats container after chart
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.parentNode.insertBefore(statsContainer, chartContainer.nextSibling);
    
    // Update stats initially and periodically
    updateProfitStats();
    setInterval(updateProfitStats, 15000);
}

// Update profit statistics
function updateProfitStats() {
    const coinTradeEvents = JSON.parse(localStorage.getItem(`tradeEvents_${selectedCoin.id}`)) || [];
    
    // Calculate ROI
    const pnl = calculatePnL();
    const holding = portfolio.find(h => h.coinId === selectedCoin.id);
    let roi = 0;
    
    if (holding && holding.investment > 0) {
        // ROI = (Current Position Value + Realized PnL - Total Investment) / Total Investment
        const currentValue = holding.amount * selectedCoin.currentPrice;
        roi = ((currentValue + pnl.realized) / holding.investment - 1) * 100;
    } else if (pnl.realized > 0) {
        // If no current holdings, ROI is just based on realized PnL
        const totalInvestment = coinTradeEvents
            .filter(e => e.type === 'buy')
            .reduce((sum, e) => sum + e.value, 0);
            
        if (totalInvestment > 0) {
            roi = (pnl.realized / totalInvestment) * 100;
        }
    }
    
    document.getElementById('roi-value').innerHTML = formatPnL(roi).replace('$', '') + '%';
    
    // Calculate win/loss ratio
    let winCount = 0;
    let lossCount = 0;
    let totalProfit = 0;
    let profitableTradeCount = 0;
    
    // Get all sell events
    const sellEvents = coinTradeEvents.filter(e => e.type === 'sell');
    
    for (const sellEvent of sellEvents) {
        // Find buy events before this sell
        const buyEvents = coinTradeEvents.filter(e => 
            e.type === 'buy' && new Date(e.time) < new Date(sellEvent.time)
        );
        
        if (buyEvents.length > 0) {
            // Calculate average cost basis
            const totalBuyAmount = buyEvents.reduce((sum, e) => sum + e.amount, 0);
            const totalBuyValue = buyEvents.reduce((sum, e) => sum + e.value, 0);
            const avgCostBasis = totalBuyValue / totalBuyAmount;
            
            // Calculate profit/loss for this sale
            const saleValue = sellEvent.value;
            const costBasis = avgCostBasis * sellEvent.amount;
            const tradeProfit = saleValue - costBasis;
            
            if (tradeProfit > 0) {
                winCount++;
                totalProfit += tradeProfit;
                profitableTradeCount++;
            } else {
                lossCount++;
                totalProfit += tradeProfit;
            }
        }
    }
    
    // Update win/loss ratio
    document.getElementById('winloss-ratio').textContent = 
        (winCount + ':' + lossCount);
    
    // Update average trade profit
    const avgProfit = profitableTradeCount > 0 ? totalProfit / sellEvents.length : 0;
    document.getElementById('avg-profit').innerHTML = formatPnL(avgProfit);
}

// Run the enhancement
enhanceWindowOnload();