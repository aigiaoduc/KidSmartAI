
import { ExternalStory, ExternalGame } from '../types';

// HÀM HỖ TRỢ: Gán màu ngẫu nhiên cho thẻ truyện/game
const CARD_COLORS = [
  'bg-candy-pink text-white border-candy-pinkDark',
  'bg-candy-aqua text-teal-800 border-candy-aquaDark',
  'bg-candy-lemon text-orange-800 border-orange-200',
  'bg-candy-lavender text-purple-900 border-purple-300',
  'bg-candy-sky text-blue-900 border-candy-skyDark',
  'bg-candy-mint text-green-900 border-candy-mintDark',
];

const getRandomColor = () => CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];

// HÀM PARSE CSV/TSV: Chuyển đổi văn bản thành mảng đối tượng
// Hỗ trợ cả dấu phẩy (CSV) và dấu Tab (TSV)
const parseCSV = (csvText: string, type: 'story' | 'game'): any[] => {
    const lines = csvText.split('\n');
    const result = [];
    
    // Bỏ qua dòng đầu tiên (Header)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Tự động phát hiện dấu phân cách: Ưu tiên Tab (TSV) nếu có
        const isTSV = line.includes('\t');
        const delimiter = isTSV ? '\t' : ',';
        const parts = line.split(delimiter);
        
        let title = '';
        let url = '';

        if (parts.length >= 2) {
            // Logic chung: Cột cuối cùng là URL
            url = parts[parts.length - 1].trim();
            
            // Các cột trước đó ghép lại thành Tên (đề phòng tên có dấu phân cách)
            // Nếu là TSV thì join bằng khoảng trắng (vì tên hiếm khi có tab)
            // Nếu là CSV thì join bằng dấu phẩy
            const joiner = isTSV ? ' ' : ',';
            title = parts.slice(0, parts.length - 1).join(joiner).trim();
            
            // Xóa dấu ngoặc kép thừa (nếu có do CSV export)
            title = title.replace(/^"|"$/g, ''); 
        }

        if (title && url) {
            result.push({
                id: `sheet_${type}_${i}`, // ID đặc biệt để nhận biết nguồn từ Sheet
                title: title,
                url: url,
                color: getRandomColor(),
                isFromSheet: true // Đánh dấu là từ Sheet (không cho xóa)
            });
        }
    }
    return result;
};

export const fetchStoriesFromSheet = async (csvUrl: string): Promise<ExternalStory[]> => {
    if (!csvUrl) return [];
    try {
        const response = await fetch(csvUrl);
        const text = await response.text();
        return parseCSV(text, 'story');
    } catch (error) {
        console.error("Lỗi khi tải truyện từ Google Sheet:", error);
        return [];
    }
};

export const fetchGamesFromSheet = async (csvUrl: string): Promise<ExternalGame[]> => {
    if (!csvUrl) return [];
    try {
        const response = await fetch(csvUrl);
        const text = await response.text();
        return parseCSV(text, 'game');
    } catch (error) {
        console.error("Lỗi khi tải game từ Google Sheet:", error);
        return [];
    }
};
