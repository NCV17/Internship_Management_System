# Internship Management System (Hệ Thống Quản Lý Thực Tập Tốt Nghiệp)

Đây là dự án Fullstack xây dựng hệ thống quản lý thực tập tốt nghiệp dành cho trường đại học. Hệ thống cung cấp các portal riêng biệt để phục vụ 3 đối tượng người dùng chính: **Admin**, **Giảng viên (Lecturer)**, và **Sinh viên (Student)**.

## 🛠 Tech Stack

**Frontend:**
- **Framework:** ReactJS (Vite)
- **Styling:** TailwindCSS v4
- **Routing:** React Router DOM (v7)
- **State Management:** Context API (AuthContext, ToastContext)
- **HTTP Client:** Axios (với interceptors xử lý JWT)

**Backend:**
- **Runtime & Framework:** Node.js, Express.js
- **Cơ sở dữ liệu:** SQL Server (dùng thư viện `mssql`)
- **Authentication:** JWT (JSON Web Token)
- **Security:** Mã hóa mật khẩu bằng `bcryptjs`

## 📁 Cấu Trúc Thư Mục (Project Structure)

### `/frontend`
Chứa mã nguồn ứng dụng web phía client.
- `src/components`: Các UI component dùng chung.
- `src/context`: Quản lý state toàn cục (`AuthContext` lưu trữ thông tin đăng nhập, `ToastContext` hiển thị thông báo).
- `src/layouts`: Các layout riêng biệt cho từng role (`AdminLayout`, `LecturerLayout`, `StudentLayout`) kèm sidebar menu.
- `src/pages`: Các trang giao diện (Login, Register, Dashboard theo role).
- `src/routes`: `ProtectedRoute` (kiểm tra quyền truy cập) và `PublicRoute` (điều hướng người đã đăng nhập).
- `src/services`: Cấu hình API endpoint (`axios` interceptor gắn token).
- `src/index.css`: File chứa toàn bộ custom CSS / CSS variables của dự án.

### `/backend`
Chứa mã nguồn API server.
- `config/db.js`: Cấu hình kết nối SQL Server (Connection pool).
- `controllers/auth.controller.js`: Xử lý logic đăng nhập, đăng ký, lấy thông tin người dùng.
- `middleware/`: Middleware phân quyền (`role.middleware`), xác thực (`auth.middleware`), bắt lỗi toàn cục (`error.middleware`).
- `routes/`: Định nghĩa các API endpoints.
- `utils/`: Hàm tiện ích (tạo/xác thực JWT, mã hóa bcrypt).
- `database.sql`: File script SQL để khởi tạo Database `InternshipManagement`, tạo các bảng và seed dữ liệu admin.
- `.env`: Chứa các biến môi trường cấu hình DB, JWT.

## 👥 Vai Trò và Phân Quyền (Roles)

Hệ thống có 3 vai trò chính với các nghiệp vụ riêng:

1. **ADMIN**
   - **Tài khoản:** Khởi tạo sẵn trong Database (username: `admin`).
   - **Nhiệm vụ:** Quản lý hệ thống, quản lý giảng viên, sinh viên, các đợt thực tập.
   
2. **LECTURER (Giảng viên)**
   - **Tài khoản:** Được tạo bởi Admin. Username là Mã giảng viên (`LecturerCode`).
   - **Nhiệm vụ:** Theo dõi sinh viên thực tập, xem báo cáo, chấm điểm đánh giá.

3. **STUDENT (Sinh viên)**
   - **Tài khoản:** Có thể tự đăng ký tài khoản (Register). Username là Mã số sinh viên (`StudentCode` / MSSV).
   - **Nhiệm vụ:** Đăng ký thực tập, nộp báo cáo, xem kết quả đánh giá.

## 🗄 Cấu Trúc Database Cốt Lõi

- Bảng **`Users`**: Lưu trữ tài khoản đăng nhập chung (`UserId`, `Username`, `PasswordHash`, `Role`, `IsActive`).
- Bảng **`Students`**: Lưu thông tin chi tiết sinh viên, liên kết với `Users` qua `UserId`.
- Bảng **`Lecturers`**: Lưu thông tin chi tiết giảng viên, liên kết với `Users` qua `UserId`.

## 🚀 Trạng Thái Dự Án Hiện Tại

- **Authentication & Authorization**: Đã hoàn thiện đăng nhập, đăng ký sinh viên, xác thực qua JWT, và bảo vệ các routes tùy theo Role (Admin, Lecturer, Student).
- **Giao diện (UI/UX)**: Đã hoàn thiện thiết kế Dashboard cơ bản cho 3 đối tượng người dùng. Giao diện Login và Register đã được Việt hóa 100%, thiết kế lại theo hướng thanh lịch, loại bỏ các icon thừa trong ô input. Khắc phục triệt để lỗi "mất focus" (khiến con trỏ chuột bị văng ra) khi gõ Form Đăng ký do cơ chế render của React.
- **Database Connection**: 
  - Đã cấu hình Backend kết nối ổn định tới SQL Server (Instance: `NCV17\SQLEXPRESS`) qua `msnodesqlv8` và cơ chế **Windows Authentication** thông qua `ODBC Driver 17 for SQL Server` thay vì dùng tài khoản `sa` truyền thống.
  - Fix lỗi `dotenv` không nhận diện biến môi trường mới bằng `{ override: true }` và bắt ép kết nối (fail-fast) ngay lúc khởi động `server.js`.
- **Database Schema & Seeding**: Đã cập nhật file `database.sql` định nghĩa chuẩn các bảng (Users, Students, Lecturers, Companies, InternshipRegistrations, Assignments, WeeklyReports, FinalReports, Evaluations, InternshipProgress) với đầy đủ Constraint. Đã có script Node.js mã hóa Bcrypt mật khẩu của Admin.
- **Tiếp theo**: Bắt đầu triển khai các API và tính năng CRUD (Thêm/Sửa/Xóa) cho Admin để quản lý danh sách sinh viên/giảng viên, công ty, phân công thực tập, và nộp báo cáo.
