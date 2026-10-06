# Chronos - Lịch & Quản Lý Công Việc Thời Gian Thực

Ứng dụng quản lý lịch trình và sự kiện phát sinh trong ngày theo thời gian thực, tích hợp thông báo nhắc nhở thông minh theo mức độ ưu tiên, đồng bộ tự động đa thiết bị (PC, Laptop, Điện thoại) và bảo mật tuyệt đối với chuẩn mã hóa đầu-cuối AES-256-GCM.

---

## 🚀 Tính Năng Chính

- ⏱ **Thời gian thực (Real-time)**: Vạch đỏ đánh dấu trực tiếp phút hiện tại trên dòng thời gian 24 giờ, đồng hồ giây trực tiếp, thanh theo dõi "Đang diễn ra" (Happening Now) với thanh tiến độ đếm ngược.
- ⚡ **Quản lý sự kiện phát sinh (Emergent Tasks)**: Ghi nhận nhanh công việc đột xuất trong ngày chỉ với 1 thao tác nhấn Enter.
- 🔔 **Nhắc nhở thông minh theo độ ưu tiên (P1 - P4)**:
  - 🔴 **P1 · Khẩn cấp & Trọng yếu**: Chuông kép cấp bách, rung điện thoại, cảnh báo đa khung giờ (30p, 15p, 5p, đúng giờ).
  - 🟠 **P2 · Ưu tiên cao**: Chuông trong trẻo, nhắc nhở trước 15p và khi bắt đầu.
  - 🔵 **P3 · Tiêu chuẩn**: Chuông êm dịu, nhắc nhở nhẹ nhàng.
  - 🟢 **P4 · Linh hoạt**: Ghi nhận không làm gián đoạn dòng công việc.
  - 🔊 **Web Audio API**: Tự động tổng hợp chuông pha lê trực tiếp trong trình duyệt, không cần tải tệp MP3 bên ngoài và hoạt động ngoại tuyến 100%.
- 🔍 **Tìm kiếm toàn cục (Global Search) với phím tắt `Ctrl+K`**: Lọc tức thời theo tiêu đề, ghi chú, thẻ, địa điểm hoặc ngày tháng.
- ☑️ **Chế độ chọn nhiều & Xóa hàng loạt**: Thao tác chọn nhiều sự kiện để xóa hoặc đánh dấu hoàn thành cùng lúc.
- 🔒 **Bảo mật tuyệt đối (Zero-Knowledge E2EE)**: Mã hóa dữ liệu cục bộ bằng Web Cryptography API (`AES-256-GCM` + `PBKDF2 100,000 rounds`). Không lưu văn bản rõ trên máy chủ.
- 🔄 **Tự động đồng bộ đa thiết bị (Cloud & Peer-to-Peer)**: Luồng Server-Sent Events (SSE) cập nhật tức thời < 50ms giữa Laptop, PC và Điện thoại.
- 📴 **Hoạt động ngoại tuyến 100% (Offline-First)**: Lưu trữ cơ sở dữ liệu IndexedDB trình duyệt, tự động đồng bộ lại khi có mạng.
- 📱 **Hỗ trợ PWA**: Cài đặt trực tiếp lên màn hình chính trên iOS, Android, macOS và Windows như một ứng dụng gốc.

---

## 💻 Cài Đặt & Chạy Cục Bộ

### 1. Yêu cầu môi trường
- [Node.js](https://nodejs.org/) phiên bản 18 trở lên.
- Trình quản lý gói `npm` (đi kèm Node.js).

### 2. Các bước khởi chạy
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev
```

Ứng dụng sẽ hoạt động tại địa chỉ: `http://localhost:3000`

---

## 🌐 Hướng Dẫn Chạy Trang Web Miễn Phí Trên GitHub Pages

Trang web này được thiết kế theo mô hình **Tools & Apps Hub (Trung tâm tổng hợp công cụ)**, cho phép bạn chạy online miễn phí vĩnh viễn trên **GitHub Pages** mà không cần mua tên miền hay máy chủ:

### Các bước kích hoạt:
1. Đẩy mã nguồn lên GitHub theo hướng dẫn bên dưới.
2. Trên trang kho lưu trữ của bạn tại **github.com**, chọn tab **Settings** (Cài đặt) ở trên cùng.
3. Ở cột bên trái, chọn mục **Pages**.
4. Tại mục **Build and deployment > Source**, bấm chọn **GitHub Actions**.
5. Hệ thống GitHub Actions sẽ tự động đọc tệp `.github/workflows/deploy.yml` đã được cấu hình sẵn trong dự án để biên dịch và phát hành trang web.
6. Sau khoảng 30 giây, trang web của bạn sẽ hoạt động trực tiếp tại địa chỉ:
   ```
   https://<tên_tài_khoản>.github.io/<tên_kho_lưu_trữ>/
   ```
*(Bạn có thể chia sẻ link này cho bất kỳ ai hoặc mở trực tiếp trên điện thoại để sử dụng).*

---

## 📤 Hướng Dẫn Đẩy Lên GitHub (Công Khai)

Mã nguồn được thiết kế sạch 100%, không chứa API key bí mật, an toàn tuyệt đối khi đăng tải lên GitHub công khai.

```bash
# 1. Khởi tạo kho Git (nếu chưa có)
git init

# 2. Thêm tất cả tệp vào danh sách chuẩn bị
git add .

# 3. Tạo commit đầu tiên
git commit -m "feat: initial commit Chronos real-time calendar"

# 4. Tạo nhánh chính
git branch -M main

# 5. Liên kết với kho lưu trữ GitHub của bạn
# (Thay thế đường dẫn bên dưới bằng link repository tạo trên github.com của bạn)
git remote add origin https://github.com/<tên_tài_khoản>/<tên_kho_lưu_trữ>.git

# 6. Đẩy mã nguồn lên GitHub
git push -u origin main
```

---

## 📱 Cách Truy Cập Đồng Thời Trên PC và Điện Thoại

### Cách 1: Truy Cập Qua Mạng Wi-Fi Nội Bộ (Không cần mua hosting)
1. Đảm bảo PC và Điện thoại đang kết nối **cùng một mạng Wi-Fi**.
2. Trên PC, tìm địa chỉ IP cục bộ của máy tính:
   - **Windows**: Mở Command Prompt (cmd), gõ `ipconfig` -> Tìm dòng `IPv4 Address` (ví dụ: `192.168.1.15`).
   - **macOS**: Mở Terminal, gõ `ipconfig getifaddr en0`.
3. Chạy lệnh: `npm run dev` trên máy tính.
4. Trên trình duyệt điện thoại (Safari hoặc Chrome), truy cập địa chỉ:
   ```
   http://192.168.1.15:3000
   ```
   *(Thay `192.168.1.15` bằng địa chỉ IP máy tính của bạn)*

### Cách 2: Triển Khai Lên Nền Tảng Đám Mây Miễn Phí (Truy cập mọi nơi qua Internet)
Sau khi đẩy mã nguồn lên GitHub, bạn có thể triển khai miễn phí với 1 cú nhấp chuột:
- **Render.com**: Tạo Web Service mới -> Chọn kho GitHub -> Build command: `npm run build` -> Start command: `npm start`.
- **Railway.app / Vercel**: Kết nối kho GitHub và triển khai tự động.

### Cách 3: Cài Đặt Làm Ứng Dụng Trên Điện Thoại (PWA)
- **Trên iPhone (Safari)**:
  1. Mở trang web ứng dụng.
  2. Nhấn vào biểu tượng **Chia sẻ** (hình vuông có mũi tên hướng lên) ở thanh dưới cùng.
  3. Chọn **Thêm vào Màn hình chính** (Add to Home Screen).
- **Trên Android (Chrome)**:
  1. Mở trang web ứng dụng.
  2. Nhấn biểu tượng menu **3 dấu chấm** ở góc trên bên phải.
  3. Chọn **Cài đặt ứng dụng** hoặc **Thêm vào Màn hình chính**.

### 🔄 Cách Kích Hoạt Tự Động Đồng Bộ Giữa PC & Điện Thoại
1. Trên thanh tiêu đề ứng dụng, nhấn vào biểu tượng **Đồng bộ** (hoặc nút Đồng bộ trong cài đặt).
2. Tại mục **Kênh Lưu Trữ Tự Động Đồng Bộ**, nhập cùng một tên kênh trên cả PC và Điện thoại (ví dụ: `tintran_vault`).
3. Nhấn **Kết nối kênh**. Từ lúc này, mọi sự kiện tạo mới, chỉnh sửa hoặc hoàn thành trên thiết bị này sẽ **tự động xuất hiện tức thời trên thiết bị kia (< 50ms)**.
