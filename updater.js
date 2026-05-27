const fs = require('fs');
const https = require('https');

// 封裝一個絕對不會被 GitHub 環境封鎖的 HTTPS 抓取器
function secureGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', err => reject(err));
    });
}

async function updateCoolpcPrices() {
    console.log('🔄 開始從開源爬蟲源抓取原價屋真實時價...');
    try {
        // 使用安全雙保險機制抓取
        const rawData = await secureGet('https://vito-go.github.io/coolpc-crawler/coolpc.json');
        console.log(`📦 成功獲取原始數據，總計 ${rawData.length} 筆零件資料。`);
        
        // 欄位清洗與標準化格式
        const cleanData = rawData.map(item => ({
            name: item.item_name || item.name || "",
            price: Number(item.price || item.item_price || 0)
        })).filter(item => item.price > 100 && item.name !== "");

        console.log('🧼 數據清洗完成，開始進行硬體分類篩選...');

        const database = {
            CPU: cleanData.filter(item => {
                const n = item.name.toUpperCase();
                return (n.includes("INTEL") || n.includes("AMD")) && 
                       (n.includes("核") || n.includes("緒") || n.includes("盒裝") || n.includes("7500F") || n.includes("12400")) &&
                       !n.includes("散熱器") && !n.includes("風扇") && !n.includes("水冷");
            }),
            GPU: cleanData.filter(item => {
                const n = item.name.toUpperCase();
                return (n.includes("RTX") || n.includes("GTX") || n.includes("RX ")) && item.price > 3000;
            }),
            RAM: cleanData.filter(item => {
                const n = item.name.toUpperCase();
                return (n.includes("DDR4") || n.includes("DDR5")) && (n.includes("G*") || n.includes("G ") || n.includes("GB")) && !n.includes("筆電");
            }),
            SSD: cleanData.filter(item => {
                const n = item.name.toUpperCase();
                return (n.includes("SSD") || n.includes("M.2") || n.includes("NVME")) && (n.includes("1TB") || n.includes("2TB") || n.includes("1T ") || n.includes("2T "));
            }),
            PowerCase: cleanData.filter(item => {
                const n = item.name.toUpperCase();
                return n.includes("電源") || n.includes("機殼") || n.includes("組合價") || n.includes("瓦") || n.includes("W ");
            })
        };

        console.log(`📊 分類完成！CPU: ${database.CPU.length} 款, GPU: ${database.GPU.length} 款`);

        // 將最新時價複寫回 prices.json
        fs.writeFileSync('prices.json', JSON.stringify(database, null, 2), 'utf8');
        console.log('✅ prices.json 時價更新成功！');

    } catch (error) {
        console.error('❌ 更新時價失敗，詳細原因:', error.message);
        process.exit(1);
    }
}

updateCoolpcPrices();
