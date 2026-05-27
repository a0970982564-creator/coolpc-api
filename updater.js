const fs = require('fs');

async function updateCoolpcPrices() {
    console.log('🔄 開始從開源爬蟲源抓取原價屋真實時價...');
    try {
        const response = await fetch('https://vito-go.github.io/coolpc-crawler/coolpc.json');
        if (!response.ok) {
            throw new Error(`無法連線至原價屋爬蟲源，HTTP 狀態碼: ${response.status}`);
        }
        
        const rawData = await response.json();
        console.log(`📦 成功獲取原始數據，總計 ${rawData.length} 筆零件資料。`);
        
        // 欄位清洗與標準化格式
        const cleanData = rawData.map(item => ({
            name: item.item_name || item.name || "",
            price: Number(item.price || item.item_price || 0)
        })).filter(item => item.price > 100 && item.name !== "");

        // 建立標準的英文 Key 結構，對應你網頁 script.js 的抓取格式
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

        // 將時價寫入 prices.json 覆蓋
        fs.writeFileSync('prices.json', JSON.stringify(database, null, 2), 'utf8');
        console.log('✅ prices.json 時價寫入成功！');

    } catch (error) {
        console.error('❌ 更新時價失敗，詳細原因:', error.message);
        process.exit(1);
    }
}

updateCoolpcPrices();
