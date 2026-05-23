# Hướng dẫn Kết nối GitHub, Vercel và Supabase cho MoneyFlow OS

Chào bạn! Hệ thống quản lý tài chính **MoneyFlow OS** hiện đã được tích hợp mã nguồn sẵn sàng kết nối trực tiếp với **Supabase** (lưu trữ cơ sở dữ liệu cloud) và tối ưu hóa để triển khai mượt mà lên **Vercel** (hosting front-end).

Dưới đây là hướng dẫn từng bước chi tiết giúp bạn đưa dự án lên GitHub, kết nối cơ sở dữ liệu Supabase, và xuất bản sản phẩm lên Vercel.

---

## 📋 Bước 1: Khởi Tạo Cơ Sở Dữ Liệu Tại Supabase

Dự án sử dụng cơ sở dữ liệu quan hệ PostgreSQL thông qua Supabase cho phép đồng bộ hóa dữ liệu thời gian thực (Real-time Cloud Sync).

1. Truy cập [Supabase](https://supabase.com/) và đăng nhập/đăng ký một tài khoản miễn phí.
2. Tạo một dự án mới bằng cách nhấn **New project**, chọn Tổ chức (Organization) và đặt tên cho dự án (ví dụ: `moneyflow-os`), chọn mật khẩu Database bảo mật.
3. Chờ từ 1-2 phút để Supabase khởi tạo hạ tầng Database độc lập cho bạn.
4. Sau khi khởi tạo xong, hãy truy cập vào mục **SQL Editor** ở thanh menu điều hướng bên trái (biểu tượng bảng `sql`).
5. Nhấp chọn **New query** (truy vấn mới), sao chép toàn bộ nội dung từ file `/supabase/schema.sql` trong mã nguồn này và dán vào cửa sổ làm việc của SQL Editor.
6. Nhấp nút **Run** (Chạy) ở góc phải màn hình để thực thi khởi tạo:
   - Tạo bảng danh mục đầu tư (`categories`), giao dịch (`transactions`), ngân sách (`budgets`) và mục tiêu (`goals`).
   - Cài đặt chính sách bảo mật cấp dòng (Row-Level Security - RLS).
   - Tự động gán dữ liệu danh mục mặc định (`Food`, `Transport`, `Shopping`, `Entertainment`, `Salary`).
7. Để lấy thông tin kết nối, bạn truy cập vào mục **Project Settings** (biểu tượng bánh răng phía dưới góc trái) -> **API**. Lưu trữ lại hai giá trị này:
   - `Project API keys` -> **anon public** (chính là khóa `VITE_SUPABASE_ANON_KEY`)
   - `Project URL` (chính là khóa `VITE_SUPABASE_URL`)

---

## 📦 Bước 2: Đẩy Mã Nguồn Lên GitHub

Bạn cần đưa mã nguồn của dự án này lên một kho lưu trữ riêng tư hoặc công khai trên GitHub.

1. Sử dụng terminal của máy tính cục bộ tại thư mục dự án và khởi tạo file git (nếu chưa có):
   ```bash
   git init
   git add .
   git commit -m "feat: init moneyflow os with online-first supabase sync"
   ```
2. Truy cập [GitHub](https://github.com/) và tạo một kho lưu trữ mới (**New Repository**). Bạn có thể chọn chế độ **Private** (Riêng tư) để bảo vệ thông tin cá nhân.
3. Liên kết Git cục bộ với repository trên GitHub và đẩy mã nguồn lên:
   ```bash
   git remote add origin <URL_REPOSITORY_CỦA_BẠN_TRÊN_GITHUB>
   git branch -M main
   git push -u origin main
   ```

---

## 🚀 Bước 3: Triển Khai Lên Vercel và Cấu Hình Biến Môi Trường

Sau khi đẩy mã nguồn lên GitHub thành công, bạn có thể triển khai dự án lên Vercel chỉ trong vài giây.

1. Truy cập [Vercel](https://vercel.com/) và đăng nhập bằng tài khoản GitHub của bạn.
2. Nhấp chọn nút **Add New...** -> **Project**.
3. Cấp quyền truy cập cho Vercel vào repository GitHub bạn vừa tạo ở Bước 2 và nhấn **Import**.
4. Trong mục **Configure Project**:
   - Dự án được xây dựng trên **Vite** nên Vercel sẽ tự động phát hiện các cấu hình build (`Build Command: vite build` và `Output Directory: dist`). Bạn giữ nguyên các thiết lập này.
5. Mở rộng phần **Environment Variables** (Biến môi trường) để điền vào các khóa sau:
   - **`VITE_SUPABASE_URL`**: Đường dẫn Project URL lấy ở cuối Bước 1.
   - **`VITE_SUPABASE_ANON_KEY`**: Khóa bảo mật public anon lấy ở cuối Bước 1.
   - **`GEMINI_API_KEY`**: Khóa API thông minh của Google Gemini dùng cho tính năng **AI Analyst** (Phân tích tài chính AI). Bạn có thể lấy khóa miễn phí tại [Google AI Studio](https://aistudio.google.com/).
6. Nhấn nút **Deploy**. Chờ quá trình hoàn thành trong vòng chưa đầy 1 phút, bạn sẽ có một tên miền ứng dụng dạng `https://ten-du-an.vercel.app` hoạt động thực tế trên internet!

---

## 🛠️ Đặc Điểm Cơ Chế Dual-Mode (Hoạt Động Kép Thông Minh)

Mã nguồn được chúng tôi viết theo phương thức **Hybrid Offline-First (Đồng bộ hóa lai ưu tiên ngoại tuyến)**:
- **Tốc độ phản hồi cực nhanh (0ms UI Latency):** Mọi thao tác Thêm/Sửa/Xóa của bạn đều cập nhật ngay lập tức lên giao diện thông qua LocalStorage cục bộ để tối ưu hiệu năng đồ họa.
- **Đồng bộ hóa ngầm thông minh:** Ứng dụng sẽ tự động gọi API đẩy các giao dịch mới lên cơ sở dữ liệu Supabase dưới nền và tự động cập nhật lại giao diện khi có thay đổi từ Cloud mà không gây giật lag hay hiện màn hình chờ (loading spinner).
- **An toàn khi chưa cấu hình:** Nếu biến môi trường Supabase chưa được setup đầy đủ, ứng dụng sẽ ghi nhận cảnh báo trong tab Console của trình duyệt và tự động hoạt động ở chế độ Offline-First (lưu trữ an toàn trên thiết bị của bạn) thay vì làm crash toàn bộ ứng dụng.

Chúc ứng dụng quản lý tài chính **MoneyFlow OS** của bạn hoạt động thật hiệu quả trên nền tảng Vercel & Supabase mới!
