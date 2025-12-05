# KidSmart AI

Ứng dụng hỗ trợ giáo dục mầm non sử dụng AI (Google Gemini).

## Tác giả
Nguyễn Thị Linh - Trường Mầm non Phì Nhừ

## Cài đặt và Chạy (Local)

1. Cài đặt dependencies:
   ```bash
   npm install
   ```

2. (Tùy chọn) Tạo file `.env.local` ở thư mục gốc và thêm key Gemini:
   ```
   VITE_GEMINI_API_KEY=AIzaSyCxKIgmXjXVUm8T4SNsL2w7K5cjl2IDfTw
   ```
   *Lưu ý: Dự án đã được tích hợp sẵn Key dự phòng nên bước này không bắt buộc để chạy thử.*

3. Chạy dự án:
   ```bash
   npm run dev
   ```

## Deploy lên Vercel

1. Đẩy code lên GitHub.
2. Vào Vercel, chọn "Add New Project" -> Import repo này.
3. (Tùy chọn) Trong phần **Environment Variables**, thêm:
   - Name: `VITE_GEMINI_API_KEY`
   - Value: `KEY_CUA_BAN`
4. Nhấn **Deploy**.
