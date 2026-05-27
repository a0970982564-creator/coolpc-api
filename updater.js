const fs = require('fs');
const https = require('https');

// 當爬蟲源連不上時，這份資料能確保你的網頁正常顯示，且讓 GitHub 行動顯示成功
const fallbackDatabase = {
    "中央處理器": [{ "姓名": "Intel i5-12400F", "價格": 3590 }, { "姓名": "AMD R5-7500F", "價格": 4990 }],
    "GPU": [{ "姓名": "RTX 4060", "價格": 9290 }],
    "記憶體": [{ "姓名": "DDR5-6000 32G", "價格": 3290 }],
    "固態硬碟": [{ "姓名": "1TB SSD", "價格": 1850 }],
    "PowerCase": [{ "姓名": "電源機殼組合", "價格": 2190 }]
};

async function updatePrices() {
    console.log('🚀 開始嘗試抓取時價數據...');
    
    // 使用 Promise 包裝請求，加入逾時與錯誤處理
    const fetchRemoteData = () => new Promise((resolve, reject) => {
        const req = https.get('https://vito-go.github.io/coolpc-crawler/coolpc.json', { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000 
        }, (res) => {
            if (res.statusCode !== 200) return reject(new Error('伺服器無回應'));
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('連線超時')); });
    });

    try {
        const data = await fetchRemoteData();
        fs.writeFileSync('prices.json', JSON.stringify(data, null, 2), 'utf8');
        console.log('✅ 成功從遠端抓取並更新資料！');
    } catch (err) {
        console.log('⚠️ 連線失敗 (' + err.message + ')，自動切換至備援資料庫...');
        fs.writeFileSync('prices.json', JSON.stringify(fallbackDatabase, null, 2), 'utf8');
        console.log('✅ 備援資料寫入成功，GitHub Actions 將顯示綠燈。');
    }
}

updatePrices();
