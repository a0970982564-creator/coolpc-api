const fs = require('fs');
const https = require('https');

// 安全的 HTTPS 請求函數，加入超時設定
function secureGet(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('連線超時')); });
    });
}

// 備用安全資料庫 (當爬蟲失敗時使用)
const fallbackDatabase = {
    "中央處理器": [{ "姓名": "Intel i5-12400F", "價格": 3590 }, { "姓名": "AMD R5-7500F", "價格": 4990 }],
    "GPU": [{ "姓名": "RTX 4060", "價格": 9290 }],
    "記憶體": [{ "姓名": "DDR5-6000 32G", "價格": 3290 }],
    "固態硬碟": [{ "姓名": "1TB SSD", "價格": 1850 }],
    "PowerCase": [{ "姓名": "電源機殼組合", "價格": 2190 }]
};

async function updateCoolpcPrices() {
    console.log('🔄 嘗試抓取最新時價...');
    try {
        // 這是你原本的爬蟲源
        const data = await secureGet('https://vito-go.github.io/coolpc-crawler/coolpc.json');
        fs.writeFileSync('prices.json', JSON.stringify(data, null, 2), 'utf8');
        console.log('✅ 成功更新最新時價！');
    } catch (error) {
        console.log('⚠️ 爬蟲源連線失敗，啟動安全防護機制：寫入備用數據。');
        fs.writeFileSync('prices.json', JSON.stringify(fallbackDatabase, null, 2), 'utf8');
        console.log('✅ 已寫入安全備份數據，網頁運行正常。');
    }
}

updateCoolpcPrices();
