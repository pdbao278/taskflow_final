<div align="center">
  <img src="https://img.shields.io/badge/TaskFlow-1.0-blue?style=for-the-badge" alt="TaskFlow Version" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express.js-Backend-white?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />

  <h1>TaskFlow</h1>
  <p>Nền tảng quản lý công việc và dự án toàn diện dành cho các nhóm nhỏ (5-10 người), tập trung vào sự đơn giản, tối ưu tốc độ trải nghiệm và phân quyền mạnh mẽ.</p>
</div>

---

## ✨ Tính năng nổi bật

- **Quản lý Workspace & Member:** Tạo nhiều không gian làm việc khác nhau, mời thành viên qua email với link mã hóa an toàn (tích hợp Brevo).
- **Hệ thống Phân quyền (RBAC):** Roles phân tách rõ ràng (Admin, Manager, Member) đảm bảo bảo mật và kiểm soát truy cập (Access Control) ở cấp độ API lẫn UI.
- **Kanban Board Kéo Thả (Drag & Drop):** Quản lý tiến độ trực quan với giao diện Kanban (To Do, In Progress, In Review, Done).
- **Trải nghiệm mượt mà (Optimistic UI):** Tương tác cực nhanh. Các thao tác cập nhật trạng thái sẽ thay đổi trên UI lập tức mà không cần chờ API phản hồi.
- **Cộng tác Thời gian thực (Collaboration):** Hỗ trợ tính năng Comment, @mention, theo dõi lịch sử hoạt động (Activity Logs) và hệ thống In-App Notification.
- **Thùng Rác An Toàn (Trash Bin):** Tính năng Soft-delete cho phép lưu trữ và khôi phục task đã xóa trong vòng 30 ngày.
- **Dark/Light Mode:** Giao diện hỗ trợ chuẩn theo xu hướng hiện đại, chuẩn Design System.

## 💻 Công nghệ sử dụng (Tech Stack)

Dự án được xây dựng theo kiến trúc **Monorepo** tách biệt rõ ràng giữa Frontend và Backend.

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand (Client state) + TanStack Query (Server state)
- **Libraries:** `@dnd-kit/core` (Drag & drop), `react-hook-form` + `zod` (Validation)

### Backend
- **Framework:** Node.js + Express
- **Database ORM:** Prisma
- **Database:** PostgreSQL (Neon Serverless)
- **Security:** JWT (7 days expiry), bcrypt (cost ≥ 12)
- **Email Service:** Brevo API

---

## 🚀 Hướng dẫn cài đặt (Local Development)

### Yêu cầu hệ thống
- Node.js (v22.x trở lên)
- PostgreSQL (có thể dùng Neon.tech hoặc local PostgreSQL)
- Tài khoản Brevo (để test tính năng gửi email invite)

### Các bước cài đặt

**1. Clone dự án**
```bash
git clone https://github.com/pdbao278/taskflow_final.git
cd taskflow_final
```

**2. Cài đặt Dependencies**
Dự án có 2 thư mục chính cần cài đặt:
```bash
# Cài đặt cho Backend
cd backend
npm install

# Cài đặt cho Frontend
cd ../frontend
npm install
```

**3. Thiết lập biến môi trường (.env)**
Copy file `.env.example` thành `.env` ở cả 2 thư mục và điền các thông tin của bạn.

*Tại `backend/.env`:*
```env
PORT=5000
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
JWT_SECRET="your_super_secret_jwt_key"
BREVO_API_KEY="your_brevo_api_key"
BREVO_SENDER_EMAIL="your_verified_email@domain.com"
```

> **💡 Chú thích về cấu hình Dịch vụ (Third-party Services):**
> - **Neon (PostgreSQL):** Tạo tài khoản miễn phí tại [neon.tech](https://neon.tech), tạo project và copy chuỗi kết nối (Connection string) vào biến `DATABASE_URL`. Bạn cũng có thể dùng PostgreSQL cài ở máy tính cá nhân (localhost).
> - **Brevo (Gửi Email):** Dùng để gửi email mời thành viên vào Workspace. Tạo tài khoản tại [brevo.com](https://www.brevo.com), vào mục *SMTP & API* để tạo và lấy `BREVO_API_KEY`. Lưu ý: `BREVO_SENDER_EMAIL` phải là email bạn đã xác thực (verified sender) trên hệ thống Brevo.


*Tại `frontend/.env`:*
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

**4. Khởi tạo Database**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

**5. Khởi chạy dự án**

Bạn có thể cài đặt toàn bộ dependencies và chạy cả Frontend lẫn Backend song song bằng lệnh ở thư mục gốc:

```bash
npm run install:all
npm run dev
```
- Backend chạy tại http://localhost:5000
- Frontend chạy tại http://localhost:3000

---

## ☁️ Hướng dẫn Deploy lên Vercel

Dự án này được cấu hình sẵn để deploy cả Frontend và Backend (Express) lên **Vercel**. Quá trình tốt nhất là tạo 2 project trên Vercel kết nối chung vào repository này:

**1. Deploy Backend (Vercel Project 1):**
- **Framework Preset**: Other
- **Root Directory**: `backend`
- Thêm toàn bộ các biến môi trường (Environment Variables) cần thiết như `DATABASE_URL`, `JWT_SECRET`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`.
- Vercel sẽ tự động đọc cấu hình `vercel.json` và thư mục `api/` để chạy Backend như Serverless Functions.

**2. Deploy Frontend (Vercel Project 2):**
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- Thêm biến môi trường: `NEXT_PUBLIC_API_URL` (ví dụ: `https://taskflow-backend.vercel.app/api`).

---

## 📚 Tài liệu Kỹ thuật (Documentation)

Dự án được thiết kế với tư duy tài liệu cực kỳ chi tiết, làm tiêu chuẩn cho cả con người và AI Agent. Bạn có thể tham khảo tại thư mục `/docs`:

- [**Requirements & Architecture (PRD)**](./docs/requirements.md): Kiến trúc hệ thống, Database Schema, RBAC matrix, API Specs.
- [**Design System & UI Patterns**](./docs/design-system.md): Quy chuẩn Design tokens, UI component, Pattern trạng thái (Empty, Loading, Error).
- [**Implementation Checklist (Tasks)**](./docs/task.md): Lộ trình chia nhỏ công việc và các Acceptance Criteria theo từng Milestone.

---