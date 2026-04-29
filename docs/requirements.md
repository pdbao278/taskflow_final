# TaskFlow — Technical Requirements Specification

> **Phiên bản:** v1.0 | **Ngày:** 2026-04-22 | **Nguồn truth:** File này là tài liệu kỹ thuật duy nhất. Mọi mâu thuẫn nội bộ → ưu tiên theo thứ tự các section từ trên xuống.

---

## Mục lục

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Coding Conventions](#3-coding-conventions)
4. [System Architecture](#4-system-architecture)
5. [Project Structure](#5-project-structure)
6. [Database Schema](#6-database-schema)
7. [API Specifications](#7-api-specifications)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Business Logic — Functional Requirements](#9-business-logic--functional-requirements)
10. [UI/UX Requirements](#10-uiux-requirements)
11. [Third-party Integrations](#11-third-party-integrations)
12. [Environment & Configuration](#12-environment--configuration)

---

## 1. Overview

### 1.1 Mô tả sản phẩm

TaskFlow là web platform fullstack cho phép team nhỏ (5–10 người) tạo, giao, theo dõi và hoàn thành công việc. Tập trung vào sự đơn giản và tốc độ.

### 1.2 User Roles

| Role | Quyền hạn |
|------|-----------|
| **Admin** | Quản lý workspace, thêm/xóa member, cài đặt toàn bộ |
| **Manager** | Tạo project, tạo & assign task, xem báo cáo team |
| **Member** | Xem task được assign, update trạng thái, comment |

### 1.3 Success Metrics

| Metric | Target (30 ngày) |
|--------|-------------------|
| Task completion rate | ≥ 85% |
| Time to update status | ≤ 2h |
| Daily active users | ≥ 80% team |
| Orphan tasks (no assignee after 24h) | 0% |

---

## 2. Tech Stack

> KHÔNG ĐƯỢC thay đổi trừ khi có justification từ Tech Lead.

### 2.1 Frontend

| Công nghệ | Phiên bản / Ghi chú |
|------------|---------------------|
| Next.js (App Router) | 16 |
| TypeScript | strict mode bắt buộc |
| shadcn/ui + Tailwind CSS | UI Components |
| Zustand | Client state management |
| TanStack Query | Server state management |
| @dnd-kit/core | Drag & Drop (Kanban board) |
| React Hook Form + Zod | Form + validation |

### 2.2 Backend

| Công nghệ | Phiên bản / Ghi chú |
|------------|---------------------|
| Node.js + Express | Runtime + framework |
| Prisma | ORM |
| Neon | Serverless PostgreSQL ≥ 14 |
| JWT | 7 ngày expiry |
| bcrypt | cost factor ≥ 12 |
| Brevo | Email service (invitations) - Yêu cầu cấu hình `BREVO_API_KEY` và `BREVO_SENDER_EMAIL` (phải là email đã xác thực trên Brevo) |

### 2.3 DevOps

| Công nghệ | Mục đích |
|------------|----------|
| Railway | Backend hosting |
| Vercel | Frontend hosting |
| GitHub Actions | CI/CD (lint + test + deploy on merge) |
| Sentry | Error tracking & monitoring |

---

## 3. Coding Conventions

### 3.1 Naming

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component files | PascalCase | `TaskCard.tsx` |
| API routes | kebab-case | `/api/tasks/update-status` |
| Variables/functions | camelCase | `getTaskById()` |
| Database tables | snake_case | `workspace_members` |
| Enum values | PascalCase | `ToDo`, `InProgress` |

### 3.2 API Response Format

Mọi API endpoint trả về format chuẩn:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### 3.3 Rules bắt buộc

- TypeScript strict mode
- Luôn có error handling (try-catch) cho mọi API call
- Mọi form dùng React Hook Form + Zod validation
- UI text bằng **tiếng Việt**
- Loading state hiển thị khi API call > 300ms
- Empty states phải có hướng dẫn hành động (không để trang trắng)
- Server Components by default, `'use client'` chỉ khi cần interactivity
- Soft delete cho tasks (`deleted_at` timestamp)
- Optimistic UI cho status changes, rollback nếu API lỗi
- Toast notifications: auto-dismiss sau 4 giây
- Slide-over panel cho task detail (không navigate ra trang mới)

### 3.4 Security Rules (KHÔNG BAO GIỜ vi phạm)

- KHÔNG hardcode secrets — dùng env variables
- Input sanitization cho mọi user input (ngăn XSS, SQL injection)
- Rate limiting: 100 requests/phút per IP
- Row-level isolation: data workspace A không lộ sang workspace B
- Password KHÔNG BAO GIỜ xuất hiện trong API response
- All traffic qua HTTPS/TLS 1.2+

### 3.5 Testing Requirements

- Viết test cho mọi API endpoint (Jest + Supertest)
- Component test cho interactive components (form, drag-drop)
- Edge case test theo section 9.10
- Test coverage mỗi module ≥ 80%

---

## 4. System Architecture

### 4.1 Tổng quan

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Vercel          │     │   Railway         │     │   Neon           │
│   (Frontend)      │────▶│   (Backend API)   │────▶│   (PostgreSQL)   │
│   Next.js 16      │     │   Express + Prisma│     │   Serverless     │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                         │                         
        │                         ├──▶ Brevo (Email)
        │                         ├──▶ Sentry (Monitoring)
        │                         │
        ▼                         ▼
   Client Browser            JWT Auth
   (React SPA)               Stateless API
```

### 4.2 Luồng Request

1. Client gửi request kèm JWT token trong `Authorization: Bearer <token>`
2. Express middleware verify JWT → extract `userId` + `workspaceId`
3. Route handler xử lý business logic qua Prisma ORM
4. Prisma query Neon PostgreSQL với workspace isolation (`WHERE workspace_id = ?`)
5. Response trả về format chuẩn `{ success, data?, error? }`

### 4.3 Authentication Flow

```
Register: Client → POST /api/auth/register → bcrypt hash → DB → JWT → Client
Login:    Client → POST /api/auth/login → verify bcrypt → JWT → Client
Auth:     Client → Request + Bearer JWT → Middleware verify → Route Handler
Expired:  API 401 → Client intercept → Redirect /login + message
```

### 4.4 Notification Strategy (MVP)

- **Polling 5 giây** (không dùng WebSocket cho MVP)
- Client `GET /api/notifications/unread-count` mỗi 5s (lightweight)
- Badge counter + dropdown list, sort `created_at` desc (mới nhất trước)
- Nút toggle đọc/chưa đọc từng notification + "Đánh dấu tất cả đã đọc"

### 4.5 Non-Functional Requirements

| NFR | Target |
|-----|--------|
| LCP (First page load) | < 2.5s trên 4G |
| API read (p95) | < 500ms |
| API write (p95) | < 1s |
| Uptime SLA | ≥ 99.5% |
| Scalability | 10 workspace, 50 member/workspace, 10,000 task/workspace |
| Responsive | ≥ 375px (mobile) đến ≥ 1024px (desktop) |
| Browser support | Chrome ≥110, Firefox ≥110, Safari ≥16, Edge ≥110 |
| Accessibility | WCAG 2.1 AA cho core components |
| Backup | Tự động hàng ngày, giữ 30 ngày |

---

## 5. Project Structure

### 5.1 Monorepo Layout

```
taskflow/
├── frontend/                    # Next.js 16 App
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── (auth)/          # Login, Register (public)
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (app)/           # Protected routes
│   │   │   │   ├── my-tasks/
│   │   │   │   ├── team/
│   │   │   │   ├── projects/
│   │   │   │   ├── reports/
│   │   │   │   ├── settings/
│   │   │   │   └── trash/       # Task Trash Bin (Admin only)
│   │   │   │       └── page.tsx # Danh sách soft-deleted tasks, Restore
│   │   │   ├── invite/          # Accept invite page
│   │   │   └── layout.tsx
│   │   ├── components/          # Shared UI components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── layout/          # Sidebar, Header, Navigation
│   │   │   └── common/          # Toast, Loading, EmptyState
│   │   ├── features/            # Feature-based modules
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── schemas/
│   │   │   │   └── stores/
│   │   │   ├── tasks/
│   │   │   │   ├── components/  # TaskCard, TaskForm, TaskDetail
│   │   │   │   ├── hooks/
│   │   │   │   ├── schemas/
│   │   │   │   └── stores/
│   │   │   ├── trash/           # Trash Bin feature (Admin)
│   │   │   │   ├── components/  # TrashList, TrashItem
│   │   │   │   └── hooks/       # useTrash (GET /api/tasks/trash, restore)
│   │   │   ├── projects/
│   │   │   ├── workspace/
│   │   │   ├── notifications/
│   │   │   ├── comments/
│   │   │   ├── reports/
│   │   │   └── search/
│   │   ├── lib/                 # Utilities
│   │   │   ├── api-client.ts    # Axios/fetch wrapper
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   └── types/               # Shared TypeScript types
│   ├── public/
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
│
├── backend/                     # Express API Server
│   ├── src/
│   │   ├── index.ts             # Entry point
│   │   ├── app.ts               # Express app setup
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT verification
│   │   │   ├── workspace.ts     # Workspace context + isolation
│   │   │   ├── rate-limit.ts    # 100 req/min per IP
│   │   │   ├── sanitize.ts      # Input sanitization
│   │   │   └── error-handler.ts # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── workspace.routes.ts
│   │   │   ├── project.routes.ts
│   │   │   ├── task.routes.ts
│   │   │   ├── comment.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── report.routes.ts
│   │   │   └── search.routes.ts
│   │   ├── services/            # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── workspace.service.ts
│   │   │   ├── project.service.ts
│   │   │   ├── task.service.ts
│   │   │   ├── comment.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── activity.service.ts
│   │   │   ├── report.service.ts
│   │   │   └── search.service.ts
│   │   ├── schemas/             # Zod validation schemas
│   │   ├── utils/
│   │   └── types/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tests/                   # Jest + Supertest
│   └── package.json
│
├── docs/
│   ├── requirements.md          # File này
│   ├── task.md                  # Implementation checklist
│   └── guide_taskflow.md        # Vibe coding guide
├── .env.example
├── .gitignore
├── package.json                 # Root scripts (dev, test)
└── README.md
```

---

## 6. Database Schema

### 6.1 Entity Relationship

```
users 1──N workspace_members N──1 workspaces
users 1──N tasks (as assignee)
users 1──N tasks (as creator)
users 1──N comments
users 1──N notifications
users 1──N activity_logs
workspaces 1──N projects
workspaces 1──N tasks
workspaces 1──N invite_tokens
projects 1──N tasks
tasks 1──N comments
tasks 1──N activity_logs
tasks 1──N notifications (as reference)
```

### 6.2 Tables

#### users

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default uuid |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| name | VARCHAR(100) | NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | auto update |

#### workspaces

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | auto update |

#### workspace_members

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces.id |
| user_id | UUID | FK → users.id |
| role | ENUM(Admin, Manager, Member) | NOT NULL |
| joined_at | TIMESTAMP | DEFAULT now() |

> UNIQUE constraint on (workspace_id, user_id)

#### projects

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces.id |
| name | VARCHAR(100) | NOT NULL |
| description | TEXT | nullable |
| color | VARCHAR(7) | NOT NULL, hex color |
| archived_at | TIMESTAMP | nullable |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | auto update |

#### tasks

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces.id |
| project_id | UUID | FK → projects.id |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | nullable, max 5000 chars |
| status | ENUM(ToDo, InProgress, InReview, Done) | DEFAULT ToDo |
| priority | ENUM(Low, Medium, High, Urgent) | DEFAULT Medium |
| assignee_id | UUID | FK → users.id, nullable |
| due_date | TIMESTAMP | nullable |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | auto update |
| deleted_at | TIMESTAMP | nullable (soft delete) |

#### comments

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| task_id | UUID | FK → tasks.id |
| user_id | UUID | FK → users.id |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | auto update |

#### activity_logs

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| task_id | UUID | FK → tasks.id |
| user_id | UUID | FK → users.id |
| action_type | VARCHAR(50) | NOT NULL (created, status_changed, field_edited, commented, deleted, restored) |
| field_changed | VARCHAR(50) | nullable |
| old_value | TEXT | nullable |
| new_value | TEXT | nullable |
| created_at | TIMESTAMP | DEFAULT now() |

> **KHÔNG có endpoint DELETE** — activity log không thể xóa (NFR-07).

#### notifications

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| type | VARCHAR(50) | NOT NULL (task_assigned, comment_added, mention, due_soon, invite_accepted, assignee_removed) |
| reference_id | UUID | nullable (task_id hoặc comment_id) |
| message | TEXT | NOT NULL |
| read_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | DEFAULT now() |

#### invite_tokens

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces.id |
| email | VARCHAR(255) | NOT NULL |
| role | ENUM(Manager, Member) | NOT NULL |
| token | VARCHAR(255) | UNIQUE, NOT NULL |
| expires_at | TIMESTAMP | NOT NULL (created_at + 48h) |
| accepted_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | DEFAULT now() |

### 6.3 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX idx_tasks_title_search ON tasks USING gin(to_tsvector('simple', title));
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_activity_logs_task_id ON activity_logs(task_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
```

### 6.4 Enums (Prisma)

```prisma
enum TaskStatus {
  ToDo
  InProgress
  InReview
  Done
}

enum TaskPriority {
  Low
  Medium
  High
  Urgent
}

enum MemberRole {
  Admin
  Manager
  Member
}
```

---

## 7. API Specifications

> Tất cả endpoint trả format: `{ success: boolean, data?: T, error?: string }`
> Tất cả protected routes yêu cầu header: `Authorization: Bearer <JWT>`
> User có thể thuộc nhiều workspace. Workspace context được xác định qua `x-workspace-id` header hoặc param.

### 7.1 Authentication

| Method | Endpoint | Auth | Body / Params | Success | Error |
|--------|----------|------|---------------|---------|-------|
| POST | `/api/auth/register` | No | `{ email, password, name }` | 201 `{ token, user }` | 409 email trùng |
| POST | `/api/auth/login` | No | `{ email, password }` | 200 `{ token, user }` | 401 sai password, 429 locked |
| POST | `/api/auth/logout` | Yes | — | 200 | — |
| GET | `/api/auth/me` | Yes | — | 200 `{ user }` | 401 |

### 7.2 Workspaces & Members

| Method | Endpoint | Auth | Role | Body / Params | Success | Error |
|--------|----------|------|------|---------------|---------|-------|
| GET | `/api/workspaces` | Yes | Any | — | 200 list workspaces | — |
| POST | `/api/workspaces` | Yes | — | `{ name }` | 201 workspace (creator = Admin) | 400 validation |
| GET | `/api/workspaces/:id` | Yes | Member | — | 200 workspace detail | 403 not member |
| PATCH | `/api/workspaces/:id` | Yes | Admin | `{ name }` | 200 updated | 403, 400 validation |
| DELETE | `/api/workspaces/:id` | Yes | Admin | — | 200 deleted | 403, 400 last workspace |
| POST | `/api/workspaces/invite` | Yes | Admin | `{ email, role }` | 200 invite sent (upsert: re-invite cập nhật invite cũ, không tạo duplicate). Email bao gồm: tên người mời, vai trò, tên workspace | 409 already member |
| GET | `/api/invite?token=xxx` | No | — | query param `token` | 200 `{ email, role, workspace, hasAccount }` | 404 not found, 400 used, 410 expired |
| POST | `/api/invite/accept` | Yes | Any | `{ token }` | 200 join workspace | 403 wrong email, 400 already used |
| POST | `/api/invite/register-and-accept` | No | — | `{ token, name, password }` | 201 `{ token, user, workspace }` (auto-login) | 409 email has account, 410 expired |
| GET | `/api/workspaces/members` | Yes | Any | — | 200 list members + pending invites (includes `expires_at` for countdown) | — |
| PATCH | `/api/workspaces/members/:id/role` | Yes | Admin | `{ role }` | 200 updated | 403 |
| DELETE | `/api/workspaces/members/:id` | Yes | Admin | — | 200 removed | 403 self-delete |

> **UI Note:** Member management page (`/app/settings/members`) hiển thị 2 section tách biệt: "Thành viên" (active members) và "Lời mời đang chờ" (pending invites với countdown 48h). Xem design-system.md mục 7.2 FR-02.

### 7.3 Projects

| Method | Endpoint | Auth | Role | Body / Params | Success | Error |
|--------|----------|------|------|---------------|---------|-------|
| GET | `/api/projects` | Yes | Any | — | 200 list (with task count) | — |
| POST | `/api/projects` | Yes | Admin/Manager | `{ name, description, color }` | 201 created | 403 Member |
| GET | `/api/projects/:id` | Yes | Any | — | 200 project detail | — |
| PATCH | `/api/projects/:id` | Yes | Admin/Manager | `{ name?, description?, color? }` | 200 updated | 403 |
| PATCH | `/api/projects/:id/archive` | Yes | Admin/Manager | — | 200 archived | 403 |

### 7.4 Tasks

| Method | Endpoint | Auth | Role | Body / Params | Success | Error |
|--------|----------|------|------|---------------|---------|-------|
| POST | `/api/tasks` | Yes | Any member | `{ title, project_id, description?, assignee_id?, priority?, due_date? }` | 201 created (status=ToDo) | 400 validation, 403 |
| GET | `/api/tasks/:id` | Yes | Any | — | 200 task detail | — |
| PATCH | `/api/tasks/:id` | Yes | Creator/Assignee/Manager | `{ title?, description?, assignee_id?, priority?, due_date? }` | 200 updated + activity log | 403 |
| DELETE | `/api/tasks/:id` | Yes | Admin/Manager | — | 200 soft delete (deleted_at set) | 403 |
| PATCH | `/api/tasks/:id/status` | Yes | Assignee/Manager | `{ status }` | 200 + activity log | 403 non-assignee member |
| GET | `/api/projects/:id/tasks` | Yes | Any | — | 200 list tasks in project | — |
| GET | `/api/my-tasks` | Yes | Any | `?status=ToDo` | 200 assigned tasks (excl. Done) | — |
| GET | `/api/team/tasks` | Yes | Admin/Manager | `?assignee=&project=&priority=&search=&due_from=&due_to=` | 200 all workspace tasks | 403 Member |
| GET | `/api/tasks/trash` | Yes | Admin | `?project=` | 200 list soft-deleted tasks (deleted_at != null, < 30 ngày) | 403 |
| POST | `/api/tasks/:id/restore` | Yes | Admin | — | 200 restored (deleted_at = null) | 403 |

### 7.5 Comments

| Method | Endpoint | Auth | Role | Body / Params | Success | Error |
|--------|----------|------|------|---------------|---------|-------|
| GET | `/api/tasks/:id/comments` | Yes | Any | — | 200 list (sorted created_at asc) | — |
| POST | `/api/tasks/:id/comments` | Yes | Any member | `{ content }` | 201 created + notification nếu @mention | 403 outsider |
| DELETE | `/api/tasks/:id/comments/:commentId` | Yes | Author | — | 200 deleted | 403 |

### 7.6 Notifications

| Method | Endpoint | Auth | Body | Success |
|--------|----------|------|------|---------|
| GET | `/api/notifications` | Yes | — | 200 list sorted `created_at` desc |
| GET | `/api/notifications/unread-count` | Yes | — | 200 `{ unreadCount }` (lightweight polling) |
| PATCH | `/api/notifications/:id/read` | Yes | — | 200 toggle read↔unread |
| PATCH | `/api/notifications/read-all` | Yes | — | 200 all marked read |

### 7.7 Activity Log

| Method | Endpoint | Auth | Success |
|--------|----------|------|---------|
| GET | `/api/tasks/:id/activity` | Yes | 200 list (sorted `created_at` desc — mới nhất trước) |

> **Không có DELETE endpoint** — activity log không thể xóa.

### 7.8 Reports

| Method | Endpoint | Auth | Role | Success | Error |
|--------|----------|------|------|---------|-------|
| GET | `/api/reports/weekly-completed` | Yes | Admin/Manager | 200 data 4 tuần | 403 |
| GET | `/api/reports/member-stats` | Yes | Admin/Manager | 200 bảng stats | 403 |
| GET | `/api/users/:id/tasks` | Yes | Admin/Manager | 200 member tasks (read-only) | 403 |

### 7.9 Search

| Method | Endpoint | Auth | Params | Success |
|--------|----------|------|--------|---------|
| GET | `/api/search` | Yes | `?q=keyword` (min 1 char) | 200 max 10 tasks |

### 7.10 Health

| Method | Endpoint | Auth | Success |
|--------|----------|------|---------|
| GET | `/health` | No | 200 `{ status: "ok" }` |

---

## 8. Authentication & Authorization

### 8.1 JWT Flow

```
1. Register/Login → Server tạo JWT với payload: { userId, email }
2. JWT expiry: 7 ngày
3. JWT access token expiry: 7 ngày; nếu triển khai refresh flow thì phải dùng refresh token rotation nhất quán với PRD
4. Cơ chế lưu session phải chọn một chiến lược nhất quán trong implementation; không mô tả song song `localStorage` và `httpOnly cookie` cho cùng MVP
5. Mọi request kèm header: Authorization: Bearer <token>
6. Middleware verify → extract userId → attach req.user
7. Token hết hạn → API trả 401 → Client intercept → redirect /login
```

### 8.2 Password Security

- Hash: bcrypt, cost factor ≥ 12
- DB hash phải bắt đầu bằng `$2b$12$`
- Password KHÔNG BAO GIỜ xuất hiện trong API response
- Minimum password length: 8 ký tự

### 8.3 Rate Limiting — Login

- 5 failed attempts liên tiếp → khóa tạm 15 phút
- Hiển thị countdown timer trên UI
- API trả 429 Too Many Requests

### 8.4 Multi-tab Logout

- Khi logout → clear token từ storage
- Các tab khác detect qua `storage` event → redirect /login

### 8.5 RBAC Permission Matrix

| Action | Admin | Manager | Member | Ghi chú |
|--------|:-----:|:-------:|:------:|:--------|
| Quản lý workspace settings | ✅ | ❌ | ❌ | |
| Invite/remove members | ✅ | ❌ | ❌ | |
| Đổi role members | ✅ | ❌ | ❌ | |
| Tạo project | ✅ | ✅ | ❌ | |
| Archive project | ✅ | ✅ | ❌ | |
| Tạo task | ✅ | ✅ | ✅ | Assignee có thể để trống |
| Assign task cho người khác | ✅ | ✅ | ✅ | Theo rule validation của endpoint |
| Edit task (any) | ✅ | ✅ | ❌ | |
| Edit task (created by self / assigned to self) | ✅ | ✅ | ✅ | |
| Đổi status task (assigned to self) | ✅ | ✅ | ✅ | |
| Đổi status task (not assigned to self) | ✅ | ✅ | ❌ | |
| Delete task (soft) | ✅ | ✅ | ❌ | |
| Restore task | ✅ | ❌ | ❌ | |
| Comment | ✅ | ✅ | ✅ | Mọi workspace member |
| Xem My Tasks | ✅ | ✅ | ✅ | |
| Xem Team Kanban | ✅ | ✅ | ❌ | |
| Xem Reports | ✅ | ✅ | ❌ | |
| Drag-drop Team Kanban | ✅ | ✅ | ❌ | Member không truy cập Team Kanban |
| Drag-drop Project Detail | ✅ | ✅ | ✅ | Member chỉ drag task assign cho mình |
| Search | ✅ | ✅ | ✅ | |

### 8.6 Workspace Context & Switching

- User có thể thuộc nhiều workspace với roles khác nhau ở mỗi workspace
- Workspace hiện tại được xác định qua `x-workspace-id` header gửi từ client
- Client lưu `currentWorkspaceId` trong Zustand store + localStorage
- Mọi API query filter theo `workspace_id` từ header context
- User A gọi API workspace B mà không phải member → 403 Forbidden
- Khi user switch workspace → client set `x-workspace-id` mới → reload data
- Khi bị xóa khỏi workspace đang active → auto-switch sang workspace khác trong list
- Khi bị xóa khỏi workspace duy nhất → redirect trang "Tạo Workspace"

---

## 9. Business Logic — Functional Requirements

### 9.1 FR-01: Authentication (P0)

- Đăng ký bằng email + password, đăng nhập → JWT 7 ngày
- Sau khi Đăng ký mới, chuyển hướng đến trang tạo Workspace đầu tiên.
- Sau khi Đăng nhập, kiểm tra user đã có workspace hay chưa. Nếu chưa có workspace nào, chuyển đến trang tạo Workspace; nếu đã có workspace, chuyển thẳng đến `/app/my-tasks`.
- Token hết hạn → redirect /login với message "Phiên làm việc đã hết hạn."
- Sai password 5 lần → khóa 15 phút + countdown
- Logout 1 tab → tab khác detect (storage event) → redirect /login
- Email trùng → "Email này đã được đăng ký. Bạn có muốn đăng nhập không?"

### 9.2 FR-02: Workspace & Member Management (P0)

**Workspace CRUD:**
- Mỗi user có thể tạo nhiều workspace, mỗi lần tạo → trở thành Admin của workspace đó
- User có thể thuộc nhiều workspace (qua invite) với roles khác nhau ở mỗi workspace
- Admin đổi tên workspace tại Settings (`PATCH /api/workspaces/:id`)
- Admin xóa workspace (`DELETE /api/workspaces/:id`):
  - **KHÔNG cho xóa nếu đây là workspace duy nhất còn lại của user** → API trả 400: "Bạn phải có ít nhất 1 workspace. Không thể xóa workspace cuối cùng."
  - Nút "Xóa workspace" disabled trên UI khi user chỉ còn 1 workspace, tooltip giải thích lý do
  - Xóa workspace → hard delete cascade: tất cả projects, tasks, comments, activity_logs, notifications, invite_tokens, workspace_members liên quan bị xóa
  - Confirm dialog: "Bạn chắc chắn muốn xóa workspace [name]? Tất cả dữ liệu sẽ bị xóa vĩnh viễn."
  - Tất cả members khác nhận notification: "Workspace [name] đã bị xóa bởi Admin."

**Workspace Switcher:**
- Sidebar hiển thị workspace hiện tại (name + avatar/icon)
- Click → dropdown danh sách workspaces user thuộc về, kèm role badge
- Switch workspace → client set `currentWorkspaceId` → reload toàn bộ data context
- Active workspace highlight trong dropdown
- Nút "+ Tạo workspace mới" ở cuối dropdown

**Member Management:**
- Admin mời member qua email (Brevo)
- Link invite hết hạn 48 giờ, hiển thị badge "Pending"
- Admin đổi role, xóa member (không tự xóa chính mình)
- Xóa member → task hiển thị "[Removed User]". Hệ thống tự động gửi notification cho Manager để re-assign.
- Xóa member → nếu đây là workspace duy nhất của member → member bị redirect trang "Tạo Workspace"
- Invite role chỉ cho phép: Manager hoặc Member (không cho invite Admin)
- Admin nhận notification khi member accept invite

**Invite Acceptance Flow (4 cases):**
- `/invite?token=xxx` frontend kiểm tra token qua `GET /api/invite?token`
- Case 1: Đang login đúng email → `POST /api/invite/accept` (cần auth)
- Case 2: Đang login sai email → hiển thị cảnh báo + nút đăng nhập lại
- Case 3: Chưa login, đã có account → redirect `/login?redirect=/invite?token=xxx`
- Case 4: Chưa có account → form đăng ký nhanh (tên + password, email cố định từ invite) → `POST /api/invite/register-and-accept` → auto-login luôn

### 9.3 FR-03: Quản lý Project (P0)

- Manager tạo project: tên, mô tả, màu sắc label
- Hiển thị số task tổng / task done
- Archive project → không tạo task mới, task cũ vẫn update status được
- Member không có quyền tạo project (403)
- **Project Detail layout (`/app/projects/:id`):** Breadcrumb (`← Dự án / [Tên]`) → Project Info Card (tên + mô tả + progress bar done/total + %) → Section header "Danh sách Task [count]" + nút "+ Thêm task" → Kanban board 4 cột
- **Nút "Chỉnh sửa" (Admin/Manager):** Mở `EditProjectDialog` sửa tên, mô tả, màu sắc (`PATCH /api/projects/:id`). Ẩn khi project archived
- **Progress bar:** `[done] / [total] tasks hoàn thành` + thanh gradient xanh lá + phần trăm

### 9.4 FR-04: Tạo và chỉnh sửa Task (P0)

- Fields: Title (required, max 200), Description (markdown, max 5000), Assignee (1 người), Project (required), Priority (Low/Medium/High/Urgent), Due date (optional), Status (default ToDo)
- **Description Markdown rendering:** View mode dùng `react-markdown` + `remark-gfm` (CSS class `.prose-task` trong `globals.css`). Hỗ trợ GFM: headings, bold/italic, strikethrough, lists, checklists, code, blockquotes, tables, links (mở tab mới). Edit mode dùng `<textarea>` nhập raw markdown
- **Admin/Manager tạo task:** assignee optional, có thể assign cho bất kỳ member nào trong workspace
- Assignee là optional cho mọi role; nếu được truyền thì phải thuộc workspace hiện tại
- Assignee phải thuộc workspace hiện tại
- Due date quá khứ → badge "Overdue" ngay lập tức
- XSS sanitization: `<script>` → lưu plain text
- Soft delete (deleted_at), chỉ Admin/Manager
- Mỗi thay đổi → activity log entry
- 2 user edit cùng lúc → last-write-wins, log từng lần

**Trash & Restore (Admin only):**
- Task bị soft delete → vào Trash bin, hiển thị tại `/app/trash`
- Trang Trash hiển thị: task title, project, người xóa, ngày xóa, **đếm ngược ngày giờ còn lại** (VD: "Còn 12 ngày 5 giờ")
- Admin có thể restore task trong vòng 30 ngày kể từ `deleted_at`
- Task > 30 ngày kể từ `deleted_at` → **tự động ẩn khỏi Trash list** (không hiển thị, không cho restore)
- Restore → `deleted_at = null`, task quay về project gốc với status cũ
- **KHÔNG cho restore nếu project gốc đã bị archive** → API trả 400: "Project đã archive. Không thể khôi phục task vào project này."
- **Khi restore, nếu assignee đã bị xóa khỏi workspace** → set `assignee_id = null` (trống), task trở thành unassigned
- MVP không có hard delete task (task > 30 ngày vẫn nằm trong DB nhưng ẩn khỏi UI)
- Filter trash theo project
- Activity log ghi lại thao tác delete/restore
- Xóa workspace (cascade) → tất cả soft-deleted tasks trong workspace cũng bị xóa vĩnh viễn

### 9.5 FR-05: Chuyển trạng thái Task (P0)

- Assignee + Manager kéo-thả hoặc click để đổi status
- Kéo **toàn bộ card** (không dùng drag handle riêng, toàn card là vùng kéo)
- Sau khi thả: **không reload trang**, **không flash** — optimistic UI cập nhật ngay + `toast.success("Đã đổi trạng thái thành [Status]")`, rollback + `toast.error` nếu API lỗi
- Member không phải assignee → card `draggable={false}`, `cursor: not-allowed`, `opacity-75` + tooltip trên card "Chỉ assignee hoặc Manager mới có thể đổi trạng thái". Click vẫn mở TaskDetailSheet, nút status bị `disabled`
- Mỗi lần đổi → activity log: "[Tên] changed status from X → Y at [timestamp]"
- Mobile fallback: click dropdown thay vì drag-drop

### 9.6 FR-06: Comment trong Task (P0)

- Mọi workspace member comment được, plain text + @mention
- @mention → autocomplete dropdown gợi ý members, **hiển thị phía trên textarea** (bottom: 100%) để tránh bị che
- @mention → notification cho người được mention (trừ self-mention)
- @mention highlight: tên multi-word (vd: `acc fam 3`) phải highlight **toàn bộ cụm** `@acc fam 3` — dùng character-scan, match tên dài nhất trước
- Comment chính task → notification cho assignee (trừ self-comment)
- XSS sanitization trên comment content
- Author có thể xóa comment của mình

### 9.7 FR-07: Dashboard cá nhân — My Tasks (P0)

- Hiển thị task assigned cho user, **trừ task Done**
- Sort: Overdue (đỏ) lên đầu → due date tăng dần → không có due date xuống cuối
- Filter: All / To Do / In Progress
- Task card 4 hàng: project label (color dot + name) → title → StatusBadge + PriorityBadge → assignee (avatar + tên hoặc "Chưa giao") + due date (icon lịch + ngày hoặc chỉ icon)
- Empty state: "Bạn chưa có task nào. Hãy liên hệ Manager để được assign công việc."

### 9.8 FR-08: Dashboard Team — Kanban Board (P0)

- 4 cột: To Do | In Progress | In Review | Done
- Mỗi cột hiển thị task count
- Drag-drop (@dnd-kit/core) đổi status + optimistic UI
- Kéo **toàn bộ card** — không dùng drag handle icon riêng
- Sau khi thả: **không reload**, **không flash** — cập nhật ngay tại chỗ
- Member không được assign → card không kéo được (`draggable={false}`), `cursor: not-allowed`, `opacity-75`, tooltip trên card
- Filter: Assignee, Project, Priority, Due date range
- Search theo task title (case-insensitive)
- Chỉ Admin/Manager truy cập, Member → redirect /app/my-tasks
- Keyboard navigation (WCAG)

### 9.9 FR-09: Thông báo In-App (P1)

**Trigger notifications khi:**
- Được assign task mới: "Bạn được assign task mới: [Title]"
- Task bị comment (trừ self-comment): "[Tên] đã comment vào task [Title]"
- Được @mention trong comment
- Task đến hạn trong 24h: "Task [Title] sắp đến hạn vào [date]"
- Member được mời đã accept invite: "[Tên] đã tham gia workspace" (gửi cho Admin)
- Assignee của một task bị xóa khỏi workspace: "Assignee của task [Title] đã rời workspace. Cần re-assign." (gửi cho Manager)

**KHÔNG notify khi:** self-assign, self-comment, self-mention

**UI:** Badge counter (max "99+"), dropdown list (sort mới nhất trước, scroll >5 items), click text → mark read + navigate to task, nút ✓ toggle read↔unread từng item. Polling 5s (`/api/notifications/unread-count`).

### 9.10 FR-10: Activity Log (P1)

- Tab "Activity" trong task detail, sorted theo thời gian (`created_at DESC` — mới nhất ở trên)
- Entry types: Created, Status changed (old→new), Field edited (field: old→new), Commented
- Format: avatar + tên + hành động + timestamp
- **Không cho xóa** — không có DELETE endpoint
- No-op edit (giá trị không đổi) → không tạo entry
- Task soft-deleted → activity log vẫn giữ nguyên

### 9.11 FR-11: Báo cáo Team (P1)

- Bar chart: Tasks Completed theo 4 tuần gần nhất (tuần hiện tại = partial)
- Bảng: Member | Assigned | Completed | Overdue | Completion Rate (%)
- Member 0 task → Rate = "N/A"
- Click tên member → My Tasks read-only (Manager KHÔNG edit/delete/comment)
- Chỉ Admin/Manager truy cập, data chỉ workspace hiện tại

### 9.12 FR-12: Search toàn cục (P2)

- Search box ở header, tìm task theo title trong workspace
- Debounce 300ms, max 10 kết quả
- Mỗi kết quả: task title, project name, assignee
- Click kết quả → mở slide-over task detail
- Keyword < 1 ký tự → không search
- Input sanitization (ngăn SQL injection)
- Empty state: "Không tìm thấy task nào với từ khóa này"

### 9.13 Edge Cases tổng hợp

#### Task Management
| Tình huống | Hành vi |
|------------|---------|
| Assignee bị xóa khỏi workspace | Task giữ nguyên, hiển thị "[Removed User]" |
| Project archive + task đang Open | Task tồn tại, không tạo mới, task cũ update được |
| 2 user edit cùng lúc | Last-write-wins, activity log ghi từng lần |
| Due date quá khứ | Cho phép, badge "Overdue" ngay |
| Task title `<script>` | Sanitize, lưu plain text |
| Member tự xóa mình | Không cho phép (chỉ Admin) |

#### Auth & Session
| Tình huống | Hành vi |
|------------|---------|
| Token hết hạn | Intercept 401 → redirect /login + message |
| Sai password 5 lần | Khóa 15 phút + countdown |
| 2 tab logout | Tab còn lại detect (storage event) → redirect |
| Email trùng khi register | Lỗi + gợi ý đăng nhập |

#### Network
| Tình huống | Hành vi |
|------------|---------|
| API 500/timeout | Toast "Có lỗi xảy ra. Thử lại?" + nút Retry |
| Mất internet | Banner "Bạn đang offline" |
| Upload > 5MB | Lỗi ngay trước khi upload |
| Empty response (lỗi quyền) | "Không có quyền truy cập" |

---

## 10. UI/UX Requirements

### 10.1 Navigation Structure

```
/login                  — Login page
/register               — Register page
/invite?token=xxx       — Accept invite

/app                    — Root (redirect → /app/my-tasks)
/app/my-tasks           — My Tasks (Member default view)
/app/team               — Team Kanban (Manager view)
/app/projects           — Danh sách project
/app/projects/:id       — Chi tiết project (Kanban board 4 cột)
/app/reports            — Báo cáo (Manager only)
/app/settings           — Workspace settings (Admin only)
/app/settings/members   — Member management
/app/trash              — Task trash bin (Admin)
```

**Workspace Switcher:** Sidebar component, hiển thị ở mọi trang `/app/*`. **Chỉ hiện 1 dòng trigger** (tên workspace hiện tại + chevron) — bấm vào mới mở dropdown danh sách workspaces (không đẩy nav items xuống). Dropdown cho phép switch workspace và tạo workspace mới.

### 10.2 Nguyên tắc thiết kế

- **Speed first:** Mọi action quan trọng ≤ 3 click
- **Clarity over features:** Trade-off → ưu tiên rõ ràng
- **Progressive disclosure:** Advanced settings ẩn đi cho đến khi cần

### 10.3 Key UX Patterns

| Pattern | Áp dụng |
|---------|---------|
| Kanban board | Drag-drop đổi status, fallback click dropdown (mobile) |
| Slide-over panel | Task detail mở từ phải, giữ context board |
| Optimistic UI | Update UI ngay, rollback nếu API lỗi |
| Toast notifications | Success/error, auto-dismiss 4 giây |
| Loading state | Hiển thị khi API > 300ms |
| Empty state | Hướng dẫn hành động (không trang trắng) |
| Overdue badge | Badge "Đỏ" trên TaskDetailSheet (góc trên-phải title) + due date đỏ trên card |
| Onboarding Flow | Chuyển hướng user tạo workspace đầu tiên ngay sau khi Register |
| Workspace Switcher | Sidebar: **1 dòng trigger** (tên workspace + chevron). Bấm mở dropdown float (không đẩy nội dung xuống): danh sách workspaces + RoleBadge + nút "+ Tạo workspace mới" |

### 10.4 Responsive

- Mobile: ≥ 375px
- Desktop: ≥ 1024px
- Kanban board: horizontal scroll trên mobile

### 10.5 Accessibility

- WCAG 2.1 AA cho core components
- Form elements có label rõ ràng
- Keyboard navigation cho Kanban board
- Lighthouse Accessibility score ≥ 90

---

## 11. Third-party Integrations

### 11.1 Brevo (Email)

- **Mục đích:** Gửi email invite workspace
- **Trigger:** Admin invite member → gửi email chứa link `/invite?token=xxx`
- **Cấu hình:** SPF/DKIM đúng để tránh spam filter
- **Env:** `BREVO_API_KEY`
- **Template:** Email chứa tên workspace + link invite + expiry info

### 11.2 Neon (Database)

- **Mục đích:** Serverless PostgreSQL ≥ 14
- **Connection:** Prisma + connection string
- **Env:** `DATABASE_URL`
- **Features:** Auto-scaling, branching (dev/staging/prod)
- **Backup:** Tự động hàng ngày, giữ 30 ngày

### 11.3 Sentry (Monitoring)

- **Mục đích:** Error tracking & performance monitoring
- **Setup:** Frontend (Next.js SDK) + Backend (Node.js SDK)
- **Env:** `SENTRY_DSN`
- **Alerts:** Notify khi error rate tăng đột biến

---

## 12. Environment & Configuration

### 12.1 Environment Variables

```bash
# === Backend ===
NODE_ENV=development|staging|production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/taskflow
JWT_SECRET=<random-64-chars>
JWT_EXPIRY=7d
BCRYPT_COST=12

# Brevo Email
BREVO_API_KEY=<brevo-api-key>
BREVO_SENDER_EMAIL=noreply@taskflow.app
BREVO_SENDER_NAME=TaskFlow

# Sentry
SENTRY_DSN=<sentry-dsn>

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# === Frontend ===
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SENTRY_DSN=<sentry-dsn>
```

### 12.2 File `.env.example`

- Phải có đủ tất cả variables ở trên
- KHÔNG chứa giá trị thật — chỉ placeholder
- Commit vào Git

### 12.3 File `.gitignore`

```
node_modules/
.env
.env.local
.next/
.vercel/
dist/
coverage/
*.log
```

### 12.4 Budget Constraint

- MVP phải deploy được trên tier miễn phí hoặc < $20/tháng
- Railway Starter (backend) + Neon Free (DB) + Vercel Free (frontend) + Brevo Free (300 emails/ngày)

---

### 13. Operational Notes (AI Agent Context)

- **Ports Setup**: Frontend (Next.js) chạy ở port `3000`, Backend (Express) chạy ở port `3001` (được định nghĩa trong `backend/.env`).
- **Dev Script**: Chạy `npm run dev` ở thư mục gốc (root) sẽ tự động khởi động cả 2 server nhờ `concurrently`.
- **Prisma Version**: Phải dùng `@prisma/client` và `prisma` **v5.x** (cụ thể `^5.21.1`) vì Prisma v7 có những breaking changes không tương thích với việc sử dụng biến `DATABASE_URL` trực tiếp trong file schema. **Không tự ý nâng cấp Prisma lên v7**.

---

> **Lưu ý:** File này là **nguồn truth kỹ thuật duy nhất** cho AI coding agent. Mọi thay đổi scope phải được ghi nhận và cập nhật tại đây.
