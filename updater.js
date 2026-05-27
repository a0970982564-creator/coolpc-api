const fs = require('fs');
const https = require('https');

// 封裝安全 HTTPS 請求
function secureGet(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 5000 // 5秒超時防卡死
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('JSON 解析失敗'));
                }
            });
        });
        req.on('error', err => reject(err));
        req.on('timeout', () => { req.destroy(); reject(new Error('網路連線超時')); });
    });
}

// 備用安全本地數據庫 (確保網頁絕對能跑)
const fallbackDatabase = {
    CPU: [
        { name: "Intel i5-12400F 【6核/12緒】(無內顯)", price: 3590 },
        { name: "AMD R5-7500F 【6核/12緒】(電競高CP值)", price: 4990 },
        { name: "Intel i5-14400 【10核/16緒】(含內顯)", price: 6800 }
    ],
    GPU: [
        { name: "微星 RTX 4060 VENTUS 2X 8G (入門遊戲)", price: 9290 },
        { name: "華碩 DUAL-RTX4060Ti-O8G-EVO (主流電競)", price: 12990 },
        { name: "技嘉 RTX 4070 SUPER EAGLE 12G (2K順跑)", price: 21990 }
    ],
    RAM: [
        { name: "威剛 16GB(8G*2) DDR4-3200", price: 1150 },
        { name: "金士頓 32GB(16G*2) DDR5-6000 CL30", price: 3290 }
    ],
    SSD: [
        { name: "俠盜 鎧俠 Exceria G2 1TB/M.2 PCIe", price: 1850 },
        { name: "威剛 ADATA XPG S7 Solis 2TB/M.2", price: 3590 }
    ],
    PowerCase: [
        { name: "550W電源+視博通機殼組合價", price: 21990 },
        { name: "海韻 Focus 750W + 君主 Air 903 機殼", price: 3990 }
    ]
};

async function updateCoolpcPrices() {
    console.log('🔄 啟動安全探針：開始從開源爬蟲源抓取數據...');
    try {
        const rawData = await secureGet('https://vito-go.github.io/coolpc-crawler/coolpc.json');
        
        if (!Array.isArray(rawData)) {
            throw new Error("抓取格式非陣列");
        }
        
        const cleanData = rawData.map(item => ({
            name: item.item_name || item.name || item.title || "",
            price: Number(item.price || item.item_price || item.value || 0)
        })).filter(item => item.price > 100 && item.name !== "");

        const database = {
            CPU: cleanData.filter(item => { const n = item.name.toUpperCase(); return (n.includes("INTEL") || n.includes("AMD")) && !n.includes("散熱"); }),
            GPU: cleanData.filter(item => { const n = item.name.toUpperCase(); return n.includes("RTX") || n.includes("GTX") || n.includes("RX "); }),
            RAM: cleanData.filter(item => { const n = item.name.toUpperCase(); return n.includes("DDR4") || n.includes("DDR5"); }),
            SSD: cleanData.filter(item => { const n = item.name.toUpperCase(); return n.includes("SSD") || n.includes("M.2") || n.includes("NVME"); }),
            PowerCase: cleanData.filter(item => { const n = item.name.toUpperCase(); return n.includes("電源") || n.includes("機殼") || n.includes("W") || n.includes("瓦"); })
        };

        // 如果洗出來的資料太空，改用備用安全資料庫，避免弄壞 prices.json
        if (database.CPU.length === 0 || database.GPU.length === 0) {
            throw new Error("清洗後資料流異常太空");
        }

        fs.writeFileSync('prices.json', JSON.stringify(database, null, 2), 'utf8');
        console.log('✅ 【成功】今日最新時價已完美寫入 prices.json！');

    } catch (error) {
        console.log('⚠️ 網路抓取或清洗遇到限制，啟動安全防護機制，使用標準內建時價填入...');
        fs.writeFileSync('prices.json', JSON.stringify(fallbackDatabase, null, 2), 'utf8');
        console.log('✅ 【安全防護成功】prices.json 已填入標準防護時價，網頁可以流暢運行！');
    }
}

updateCoolpcPrices();
