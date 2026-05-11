# Hệ Thống Quản Lý Thực Tập (Internship Management System)

Dự án Fullstack quản lý thực tập tốt nghiệp chuyên nghiệp, tập trung vào sự tinh gọn, hiệu quả và giao diện hiện đại (Enterprise UI).

## 🛠 Tech Stack

- **Frontend:** React (Vite), TailwindCSS v4, Lucide Icons, Axios, React Router v7.
- **Backend:** Node.js, Express, SQL Server (`mssql` + `msnodesqlv8` for Windows Auth).
- **Security:** JWT Authentication, Bcrypt Password Hashing.

---

## 💡 Business Flow (Quy trình nghiệp vụ)

Hệ thống tập trung vào quy trình thực tập tinh gọn, không rườm rà:
1. **Khởi tạo:** Admin tạo **Đợt thực tập (Internship Period)**.
2. **Đăng ký:** Sinh viên chọn công ty từ danh sách có sẵn. Hệ thống **Tự động Chấp nhận (Auto-Approved)**.
3. **Phân công:** Admin thực hiện phân công **Giảng viên hướng dẫn** cho sinh viên đã có công ty.
4. **Thực hiện:** Sinh viên nộp báo cáo tuần/cuối kỳ. Giảng viên theo dõi và chấm điểm.
5. **Kết thúc:** Sau khi có điểm đánh giá, sinh viên hoàn thành đợt thực tập.

---

## ⚙️ Logic Trạng thái thực tập (Internship Status)

Trạng thái của sinh viên được tính toán **động** từ database dựa trên các điều kiện sau:

- **Hoàn thành (COMPLETED):** Đã có bản ghi điểm trong bảng `Evaluations`.
- **Đang thực tập (IN_PROGRESS):** Đã đăng ký công ty (`InternshipRegistrations`) **VÀ** đã được phân công giảng viên (`Assignments`).
- **Chưa bắt đầu (NOT_STARTED):** Chưa đăng ký công ty hoặc chưa được phân công giảng viên.

---

## 🗄 Cấu trúc Database (Core Schema)

| Bảng | Chức năng chính |
| :--- | :--- |
| **`Users`** | Lưu tài khoản (Role: ADMIN, LECTURER, STUDENT). |
| **`Students`** | Thông tin sinh viên, GPA, MSSV. |
| **`Companies`** | Danh sách công ty (Tên, Lĩnh vực, Địa chỉ, Liên hệ). |
| **`InternshipPeriods`** | Các đợt thực tập (Học kỳ, Năm học, Ngày bắt đầu/kết thúc). |
| **`InternshipRegistrations`** | Lưu lựa chọn công ty của sinh viên (Status: APPROVED). |
| **`Assignments`** | Lưu thông tin Phân công Giảng viên hướng dẫn. |
| **`Evaluations`** | Lưu điểm số và nhận xét cuối cùng. |
| **`WeeklyReports`** | Báo cáo tiến độ hàng tuần. |

---

## 🚀 Tính năng nổi bật đã triển khai

### 👨‍🎓 Role Sinh viên: Đăng ký thực tập
- Giao diện Card-based hiện đại, Responsive.
- Search & Filter công ty theo tên/lĩnh vực.
- Card "Công ty của bạn" hiển thị chi tiết thông tin khi đã đăng ký thành công.
- Banner trạng thái động: Hiển thị tên Giảng viên hướng dẫn ngay khi được Admin phân công.

### 👨‍💼 Role Admin: Quản lý sinh viên
- Quản lý danh sách sinh viên tập trung.
- Bộ lọc thông minh: Theo trạng thái thực tập (động), theo GV hướng dẫn, theo công ty.
- Modal Chỉnh sửa: Cho phép Admin cập nhật nhanh thông tin học vụ và phân công thực tập.
- Xuất dữ liệu Excel chuẩn xác.

---

## 📂 Project Structure Notes (Dành cho Developer)

- **Backend Controllers:** Mỗi module nghiệp vụ có controller riêng (e.g., `studentInternship.controller.js`).
- **Frontend Pages:** 
  - `RegisterInternship.jsx`: Logic đăng ký phức tạp với các sub-component: `CompanyCard`, `RegisteredCompanyCard`.
  - `StudentManagement.jsx`: Quản lý danh sách sinh viên role Admin.
- **API Services:** Tất cả gọi qua `frontend/src/services/api.js`.
- **Authentication:** Token lưu trong `localStorage`, được đính kèm vào header qua axios interceptor.

---

## 📝 Ghi chú quan trọng
- Backend sử dụng **Windows Authentication**. Đảm bảo Server chạy trên Windows và user hiện tại có quyền truy cập SQL Server instance `NCV17\SQLEXPRESS`.
- Database chính xác nằm trong `backend/database/schema.sql`.
