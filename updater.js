const fs = require('fs');
const https = require('https');

// 安全的 HTTPS 請求函數，加入超時設定，避免卡死
function secureGet(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
                } else {
                    reject(new Error(`HTTP 狀態碼錯誤: ${res.statusCode}`));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('連線超時')); });
    });
}

// 當爬蟲失敗時使用的緊急備用資料
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
        // 嘗試爬取，若目標網址有變更，請確認網址正確性
        const data = await secureGet('https://vito-go.github.io/coolpc-crawler/coolpc.json');
        fs.writeFileSync('prices.json', JSON.stringify(data, null, 2), 'utf8');
        console.log('✅ 成功更新最新時價！');
    } catch (error) {
        console.log('⚠️ 爬蟲失敗，原因：', error.message);
        console.log('⚠️ 啟用容錯機制：寫入備用數據庫。');
        fs.writeFileSync('prices.json', JSON.stringify(fallbackDatabase, null, 2), 'utf8');
        console.log('✅ 已寫入安全備份，流程保持運行。');
    }
}

updateCoolpcPrices();
