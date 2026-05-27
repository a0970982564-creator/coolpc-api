const fs = require('fs');
const https = require('https');

// 封裝安全 HTTPS 請求
function secureGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('原始資料解析 JSON 失敗：' + e.message));
                }
            });
        }).on('error', err => reject(err));
    });
}

async function updateCoolpcPrices() {
    console.log('🔄 啟動探針：開始從開源爬蟲源抓取數據...');
    try {
        const rawData = await secureGet('https://vito-go.github.io/coolpc-crawler/coolpc.json');
        
        if (!Array.isArray(rawData)) {
            throw new Error(`抓到的數據不是陣列格式！接收到的類型是: ${typeof rawData}`);
        }
        console.log(`📦 探針回報：成功獲取原始數據，總計 ${rawData.length} 筆資料。`);
        
        // 萬能欄位清洗（相容多種開源欄位命名）
        const cleanData = rawData.map((item, idx) => {
            const name = item.item_name || item.name || item.title || "";
            const price = Number(item.price || item.item_price || item.value || 0);
            return { name, price };
        }).filter(item => item.price > 100 && item.name !== "");

        console.log(`🧼 洗淨完成！過濾掉無效資料後剩餘 ${cleanData.length} 筆有效零件。`);

        // 建立標準的英文分類結構
        const database = {
            CPU: cleanData.filter(item => {
                const n = item.name.toUpperCase();
                return (n.includes("INTEL") || n.includes("AMD")) && !n.includes("散熱");
            }),
            GPU: cleanData.filter(item => {
                const n = item.name.toUpperCase();
                return n.includes("RTX") || n.includes("GTX") || n.includes("RX ");
            }),
            RAM: cleanData.filter(item => {
                const n = item.name.toUpperCase();
                return n.includes("DDR4") || n.includes("DDR5");
            }),
            SSD: cleanData.filter(item => {
                const n = item.name.toUpperCase();
                return n.includes("SSD") || n.includes("M.2") || n.includes("NVME");
            }),
            PowerCase: cleanData.filter(item => {
                const n = item.name.toUpperCase();
                return n.includes("電源") || n.includes("機殼") || n.includes("W") || n.includes("瓦");
            })
        };

        console.log(`📊 探針分類統計：CPU 共 ${database.CPU.length} 款, GPU 共 ${database.GPU.length} 款`);

        // 寫入檔案
        fs.writeFileSync('prices.json', JSON.stringify(database, null, 2), 'utf8');
        console.log('✅ prices.json 當日最新時價已成功寫入覆蓋！');

    } catch (error) {
        console.error('❌❌❌ 【偵錯報告】更新失敗！詳細原因如下：');
        console.error(error.stack || error.message);
        // 拋出錯誤讓 GitHub Actions 記錄詳細日誌
        process.exit(1);
    }
}

updateCoolpcPrices();
