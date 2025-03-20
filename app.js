// Variables to store application state
let balance = 10000;
let portfolio = [];
const coins = [];

// Load data from localStorage on page load
function loadData() {
    const savedBalance = localStorage.getItem('balance');
    const savedPortfolio = localStorage.getItem('portfolio');
    
    if (savedBalance) {
        balance = parseFloat(savedBalance);
        document.getElementById('balance').textContent = `$${balance.toLocaleString()}`;
    }
    
    if (savedPortfolio) {
        portfolio = JSON.parse(savedPortfolio);
        renderPortfolio();
    }
}

// Generate new coins
function generateNewCoins() {
    // Clear existing coins
    coins.length = 0;
    
    // Generate new coins
    const coinNames = [
        'SENDTHISHSIT', 'PUMPPPP', 'FUNFUNFUN', 'Trumpisgay', 'Holley',
        'Trenches So Boring', 'RUGPULL', 'KANYE MY ASS', 'FUCK kols', 'I need money',
        'p2p', 'im anonymous', 'like yo mom', 'this will cook', 'shit'
    ];
    
    const coinTickers = [
        'SHIT', 'PUMP', 'FUN', 'GAY', 'Holly', 
        'BORED', 'RUG', 'YE', 'Kols', 'Thanks',
        'p2p', 'anus', 'milf', 'fun platform', 'shit'
    ];
    
    // Generate 8 random coins
    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * coinNames.length);
        const name = coinNames.splice(randomIndex, 1)[0];
        const ticker = coinTickers.splice(randomIndex, 1)[0];
        
        // Generate a random color for the icon
        const hue = Math.floor(Math.random() * 360);
        const saturation = 70;
        const lightness = 60;
        const iconColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        // Generate a random market cap between 100K and 10M
        const initialMcap = Math.floor(Math.random() * 9900) + 100;
        const price = (Math.random() * 0.0001 + 0.00001).toFixed(8);
        
        coins.push({
            id: `coin-${Date.now()}-${i}`,
            name,
            ticker,
            iconColor,
            initialMcap,
            currentPrice: parseFloat(price)
        });
    }
    
    renderCoins();
}

// Render coins in the UI
function renderCoins() {
    const coinList = document.getElementById('coin-list');
    coinList.innerHTML = '';
    
    coins.forEach(coin => {
        const coinCard = document.createElement('div');
        coinCard.className = 'coin-card';
        coinCard.innerHTML = `
            <div class="coin-header">
                <div class="coin-icon" style="background-color: ${coin.iconColor}"></div>
                <div class="coin-info">
                    <div class="coin-name">${coin.name}</div>
                    <div class="coin-ticker">${coin.ticker}</div>
                </div>
            </div>
            <div class="coin-mcap">Market Cap: $${formatNumber(coin.initialMcap * 100000)}</div>
            <div>Price: $${coin.currentPrice.toFixed(8)}</div>
        `;
        
        // Add click event to go to coin details page
        coinCard.addEventListener('click', () => {
            // Store the selected coin ID in localStorage
            localStorage.setItem('selectedCoinId', coin.id);
            // Navigate to the coin details page
            window.location.href = 'coin-details.html';
        });
        
        coinList.appendChild(coinCard);
    });
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

// Render portfolio
function renderPortfolio() {
    const portfolioList = document.getElementById('portfolio-list');
    
    if (portfolio.length === 0) {
        portfolioList.innerHTML = '<p>No coins in portfolio yet.</p>';
        return;
    }
    
    portfolioList.innerHTML = '';
    
    portfolio.forEach(holding => {
        // Find coin details if available
        const coin = coins.find(c => c.id === holding.coinId);
        if (!coin) return; // Skip if coin not found
        
        const currentValue = holding.amount * coin.currentPrice;
        const profitLoss = currentValue - holding.investment;
        const profitLossPercent = (profitLoss / holding.investment * 100).toFixed(2);
        const isProfit = profitLoss >= 0;
        
        const holdingElement = document.createElement('div');
        holdingElement.className = 'coin-card';
        holdingElement.innerHTML = `
            <div class="coin-header">
                <div class="coin-icon" style="background-color: ${coin.iconColor}"></div>
                <div class="coin-info">
                    <div class="coin-name">${coin.name}</div>
                    <div class="coin-ticker">${coin.ticker}</div>
                </div>
            </div>
            <div>Amount: ${holding.amount.toLocaleString()}</div>
            <div>Value: $${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div style="color: ${isProfit ? '#64f291' : '#ff4d4d'}">
                P/L: ${isProfit ? '+' : ''}$${profitLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${isProfit ? '+' : ''}${profitLossPercent}%)
            </div>
        `;
        
        // Add click event to go to coin details page
        holdingElement.addEventListener('click', () => {
            localStorage.setItem('selectedCoinId', coin.id);
            window.location.href = 'coin-details.html';
        });
        
        portfolioList.appendChild(holdingElement);
    });
}

// Toggle portfolio visibility
function showPortfolio() {
    const portfolioSection = document.getElementById('portfolio-section');
    portfolioSection.style.display = portfolioSection.style.display === 'none' ? 'block' : 'none';
}

// Initialize the application
window.onload = function() {
    loadData();
    generateNewCoins();
};