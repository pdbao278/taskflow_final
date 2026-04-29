# TaskFlow — Implementation Task List

---

## 📑 Mục lục nhanh (Index for AI)

> **Dành cho AI:** Sử dụng mục lục này để tra cứu nhanh các Milestone (M), Feature Request (FR) và Non-Functional Requirement (NFR). Hãy click vào link hoặc tìm kiếm (search) chính xác các tiêu đề này trong file thay vì đọc toàn bộ.

- **[Milestone M0 — Setup & Core Database + Authentication](#milestone-m0-—-setup--core-database--authentication)**
  - [FR-01: Authentication (P0)](#fr-01-authentication-p0)
    - [NFR áp dụng cho M0](#nfr-áp-dụng-cho-m0)
- **[Milestone M1 — Core CRUD](#milestone-m1-—-core-crud)**
  - [FR-02: Workspace & Member Management (P0)](#fr-02-workspace--member-management-p0)
    - [NFR áp dụng cho FR-02](#nfr-áp-dụng-cho-fr-02)
  - [FR-03: Quản lý Project (P0)](#fr-03-quản-lý-project-p0)
  - [FR-04: Tạo và chỉnh sửa Task (P0)](#fr-04-tạo-và-chỉnh-sửa-task-p0)
  - [FR-05: Chuyển trạng thái Task (P0)](#fr-05-chuyển-trạng-thái-task-p0)
- **[Milestone M2 — Collaboration](#milestone-m2-—-collaboration)**
  - [FR-06: Comment trong Task (P0)](#fr-06-comment-trong-task-p0)
    - [NFR áp dụng cho FR-06](#nfr-áp-dụng-cho-fr-06)
  - [FR-09: Thông báo In-App (P1)](#fr-09-thông-báo-in-app-p1)
    - [NFR áp dụng cho FR-09](#nfr-áp-dụng-cho-fr-09)
  - [FR-10: Activity Log trong Task (P1)](#fr-10-activity-log-trong-task-p1)
- **[Milestone M3 — Dashboards](#milestone-m3-—-dashboards)**
  - [FR-07: Dashboard cá nhân - My Tasks (P0)](#fr-07-dashboard-cá-nhân---my-tasks-p0)
    - [NFR áp dụng cho FR-07](#nfr-áp-dụng-cho-fr-07)
  - [FR-08: Dashboard Team - Kanban Board (P0)](#fr-08-dashboard-team---kanban-board-p0)
    - [NFR áp dụng cho FR-08](#nfr-áp-dụng-cho-fr-08)
  - [FR-11: Báo cáo Team (P1)](#fr-11-báo-cáo-team-p1)
  - [FR-13: Thùng Rác - Trash Bin (P1)](#fr-13-thùng-rác---trash-bin-p1)
    - [NFR áp dụng cho FR-13](#nfr-áp-dụng-cho-fr-13)
- **[Milestone M4 — Polish & QA](#milestone-m4-—-polish--qa)**
  - [FR-12: Search toàn cục (P2)](#fr-12-search-toàn-cục-p2)
    - [NFR-01: Performance](#nfr-01-performance)
    - [NFR-02: Availability](#nfr-02-availability)
    - [NFR-03: Security](#nfr-03-security)
    - [NFR-04: Scalability](#nfr-04-scalability)
    - [NFR-05: Usability](#nfr-05-usability)
    - [NFR-06: Accessibility](#nfr-06-accessibility)
    - [NFR-07: Data Integrity](#nfr-07-data-integrity)
    - [NFR-08: Browser Support](#nfr-08-browser-support)
- **[Milestone M5 — Deploy MVP](#milestone-m5-—-deploy-mvp)**

---

## 🤖 Hướng dẫn cho AI Coding Agent (Phải luôn ghi nhớ)

> **Context Bắt Buộc:** Trước khi bắt đầu làm việc, bạn **PHẢI** đọc hai file sau để nạp context:
> 1. `docs/requirements.md` (Scope, API specs, Database schema)
> 2. `docs/design-system.md` (UI patterns, Color tokens, Error states)

> **Role-play:** Bạn là **Senior Fullstack Developer**, tư duy logic chặt chẽ, cực kỳ cẩn thận.
>
> **Quy tắc tuyệt đối:**
> 1. **Tuần tự Milestone:** M0 → M1 → M2 → M3 → M4 → M5. Chỉ chuyển milestone khi pass 100% Acceptance Gate. **Tuyệt đối không nhảy cóc.**
> 2. **Tuần tự FR trong Milestone:** Mỗi Milestone có nhiều FR phải thực hiện **tuần tự theo thứ tự đã liệt kê**. FR trước phải pass 100% Checklist (bao gồm tất cả tests) thì mới được bắt đầu FR tiếp theo. **Không làm song song 2 FR cùng lúc.**
> 3. **Đúng rồi mới đi tiếp:** Mỗi tác vụ nhỏ phải verify xong mới làm việc khác.
> 4. **Không mock data:** DB Query → API Route → UI Component → Error Handling.
> 5. **Không hardcode secrets:** Dùng env variables.
> 6. **Verify mọi claim:** Sau khi implement, chạy test thực tế trước khi báo xong.
> 7. **Bắt buộc kiểm tra UI:** Sau khi xong MỖI Milestone (M) hoặc Feature Request (FR), AI **PHẢI TỰ ĐỘNG MỞ TRÌNH DUYỆT (bằng browser tool)** để kiểm tra hoạt động thực tế của các chức năng trên giao diện. Tuyệt đối KHÔNG được để xảy ra lỗi cú pháp (syntax error) hay lỗi thiếu module/dependency trên UI.
> 8. **API response format chuẩn:** `{ success: boolean, data?: T, error?: string }`
> 9. **Bắt buộc đọc design-system trước khi code UI:** Trước khi implement UI của BẤT KỲ FR nào, AI PHẢI đọc section `design-system.md §7.X` tương ứng. Sai layout, sai component variant, sai wording → coi như CHƯA XONG. Mapping FR → Design Section:
>    - FR-01 → §7.1 | FR-02 → §7.2 | FR-03 → §7.3 | FR-04 → §7.4 | FR-05 → §7.5
>    - FR-06 → §7.6 | FR-07 → §7.9 | FR-08 → §7.10 | FR-09 → §7.7 | FR-10 → §7.8
>    - FR-11 → §7.11 | FR-12 → §7.12 | FR-13 → §7.13
> 10. **Tuyệt đối không bịa đặt thông tin:** Không được bịa hoặc suy đoán bất kỳ thông tin nào không có trong codebase, tài liệu (`requirements.md`, `design-system.md`, `task.md`) hoặc kết quả thực tế từ công cụ. Nếu không chắc → đọc lại file, chạy lệnh kiểm tra, hoặc hỏi người dùng. **Tuyệt đối không hallucinate API, field, component, hay trạng thái nào chưa được xác nhận.**

---

## 📌 Phiên bản thực tế (2026-04-28)

> - **Prisma**: `v5.22.0`
> - **@prisma/client**: `v5.22.0`
> - **Next.js**: `v16.2.4`
> - **Node.js**: `v22.x`
> - **Route prefix**: Tất cả trang app dùng prefix `/app/` (vd: `/app/my-tasks`, `/app/projects`). Thư mục nguồn là `src/app/app/`.
> - **Invite flow**: Xem spec đầy đủ tại `requirements.md §FR-02`. Endpoints: `GET /api/invite?token`, `POST /api/invite/accept`, `POST /api/invite/register-and-accept`. Frontend: `/invite?token=xxx`.

---

## Milestone M0 — Setup & Core Database + Authentication

> **Timeline:** Week 1 | **Acceptance Gate:** Dev env chạy được locally, auth hoạt động end-to-end.

### FR Coverage: FR-01 (Authentication)

---

### FR-01: Authentication (P0)

**Mô tả từ PRD:** Hệ thống cho phép đăng ký bằng email + password và đăng nhập. Session kéo dài 7 ngày hoặc đến khi logout. Khi token hết hạn, redirect về trang login.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.1`**
> Layout Login/Register, form fields, lockout state, lockout countdown timer, multi-tab logout UX.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.1.

---

#### NFR áp dụng cho M0

| NFR | Yêu cầu |
|-----|---------|
| NFR-03 Security | bcrypt cost ≥ 12, JWT 7 ngày, HTTPS, password không xuất hiện trong response |
| NFR-05 Usability | Loading state khi API > 300ms, empty state có hướng dẫn |
| NFR-08 Browser | Chrome ≥ 110, Firefox ≥ 110, Safari ≥ 16, Edge ≥ 110 |

> Ghi chú auth: Không giả định JWT access token stateless có thể bị server-side invalidation nếu chưa có thiết kế revocation/session store rõ ràng. Nếu triển khai refresh flow, phải dùng refresh token rotation nhất quán với PRD.

---

#### User Stories & Acceptance Criteria

**US-AUTH-01: Đăng ký tài khoản**

> Với tư cách là người dùng mới, tôi muốn đăng ký bằng email + password để tạo tài khoản.

```
Given: Người dùng vào trang /register và điền email hợp lệ + password
When: Submit form
Then:
  - Tài khoản được tạo, JWT token trả về
  - Redirect về trang Tạo Workspace mới (Onboarding)
  - Password được hash bcrypt (cost ≥ 12), KHÔNG có plaintext trong DB

Given: Người dùng đăng ký email đã tồn tại
When: Submit form
Then:
  - Lỗi: "Email này đã được đăng ký. Bạn có muốn đăng nhập không?"
  - Tài khoản KHÔNG được tạo

Given: Người dùng submit form với email không hợp lệ
When: Submit form
Then:
  - Form validation hiển thị lỗi ngay (Zod), không gọi API
```

**US-AUTH-02: Đăng nhập**

> Với tư cách là người dùng đã có tài khoản, tôi muốn đăng nhập để truy cập workspace.

```
Given: Người dùng nhập email + password đúng
When: Submit form
Then:
  - JWT token được cấp (7 ngày expiry)
  - Kiểm tra người dùng đã có workspace hay chưa. Nếu có, redirect về /app/my-tasks. Nếu chưa có, redirect trang Tạo Workspace.

Given: Người dùng nhập sai password 5 lần liên tiếp
When: Lần thứ 5 submit
Then:
  - Khóa tạm 15 phút
  - Hiển thị countdown timer
  - API trả 429 Too Many Requests

Given: Token hết hạn giữa chừng khi đang dùng
When: API call bất kỳ trả về 401
Then:
  - Intercept 401, tự redirect về /login
  - Hiển thị thông báo: "Phiên làm việc đã hết hạn."

Given: Người dùng mở app trên 2 tab, logout 1 tab
When: Logout xảy ra
Then:
  - Tab còn lại detect qua storage event và redirect về /login
```

---

#### Edge Cases & Error States (M0)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Đăng ký email đã tồn tại | Lỗi: "Email này đã được đăng ký. Bạn có muốn đăng nhập không?" |
| Sai password 5 lần liên tiếp | Khóa tạm 15 phút, hiển thị countdown timer |
| Token hết hạn giữa chừng | Intercept 401, redirect /login với thông báo "Phiên làm việc đã hết hạn." |
| Mở 2 tab, logout 1 tab | Tab còn lại tự detect (storage event) và redirect login |
| API call thất bại (500/timeout) | Toast error: "Có lỗi xảy ra. Thử lại?" với nút Retry |
| Password để trống khi submit | Form validation lỗi ngay, không gọi API |

---

#### Test Plan (FR-01)

**1. API Tests (Jest + Supertest)**

| Test Case | Input | Expected Output |
|---|---|---|
| POST /api/auth/register - happy path | email hợp lệ, password ≥ 8 ký tự | 201, `{ success: true, data: { token, user } }`, password không có trong response |
| POST /api/auth/register - duplicate email | email đã tồn tại | 409, `{ success: false, error: "Email này đã được đăng ký..." }` |
| POST /api/auth/register - invalid email | "notanemail" | 400, validation error |
| POST /api/auth/login - correct credentials | email + password đúng | 200, JWT token |
| POST /api/auth/login - wrong password | password sai | 401, error message |
| POST /api/auth/login - 5 failed attempts | sai password 5 lần | 429, lockout 15 phút |
| POST /api/auth/logout | auth user | 200, logout thành công |
| GET /api/auth/me | auth user | 200, trả user hiện tại, không có password |
| GET /app/* - no token | không có Authorization header | 401 redirect |
| GET /app/* - expired token | token hết hạn | 401 redirect |
| POST /api/auth/register - bcrypt check | bất kỳ registration | DB hash phải bắt đầu bằng `$2b$12$` |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| hashPassword() dùng cost factor ≥ 12 | auth.service |
| comparePassword() đúng/sai | auth.service |
| generateJWT() payload đúng, expiry 7 ngày | auth.service |
| verifyJWT() valid/expired/tampered | auth.service |
| loginAttemptTracker tăng counter đúng | auth.service |
| loginAttemptTracker reset sau 15 phút | auth.service |
| Zod schema validate email format | auth.schema |
| Zod schema validate password min length | auth.schema |

**3. E2E Tests (Playwright)**

| Scenario | Steps | Expected |
|---|---|---|
| Đăng ký mới thành công | Vào /register → điền form → submit | Redirect màn hình Tạo Workspace, toast success |
| Đăng nhập thành công | Vào /login → điền form → submit | Lấy danh sách workspace, redirect /app/my-tasks |
| Đăng ký email trùng | Register lần 2 với cùng email | Hiển thị lỗi đúng text |
| Sai password 5 lần | Login sai 5 lần liên tiếp | Countdown timer hiện, nút submit disabled |
| Token hết hạn | Giả lập expired token → load /app | Redirect /login với message |
| Logout 2 tab | Mở 2 tab, logout tab 1 | Tab 2 redirect /login |
| Protected route redirect | Truy cập /app không có token | Redirect /login |

---

#### Checklist M0 — FR-01 ✅ Definition of Done

**Setup & Infrastructure**
- [ ] Repo khởi tạo, `npm run dev` chạy không lỗi (frontend + backend)
- [ ] Prisma schema có đủ 9 tables khớp PRD section 13
- [ ] `prisma migrate dev` chạy clean, không lỗi
- [ ] `.env.example` có đủ variables, không chứa giá trị thật (Đảm bảo có `BREVO_API_KEY` và `BREVO_SENDER_EMAIL`)
- [ ] `.gitignore` đúng (node_modules, .env, .next)
- [ ] Enum types đúng: Status (ToDo/InProgress/InReview/Done), Priority (Low/Medium/High/Urgent), Role (Admin/Manager/Member)

**FR-01 Implementation**
- [ ] `POST /api/auth/register` hoạt động, trả JWT
- [ ] `POST /api/auth/login` hoạt động, trả JWT
- [ ] `POST /api/auth/logout` hoạt động
- [ ] `GET /api/auth/me` trả đúng user hiện tại
- [ ] bcrypt cost factor = 12 (verify trong DB: hash bắt đầu `$2b$12$`)
- [ ] JWT expiry = 7 ngày (verify bằng jwt.io)
- [ ] Password KHÔNG xuất hiện trong bất kỳ API response nào
- [ ] Auth middleware apply cho toàn bộ `/app/*` routes
- [ ] Trang `/login` và `/register` có form validation (Zod + React Hook Form)
- [ ] Rate limiting: 5 failed attempts → lock 15 phút + countdown timer
- [ ] Token hết hạn → intercept 401 → redirect `/login` + message đúng
- [ ] 2 tab logout → storage event → tab còn lại redirect

**App Shell UI (Header + Layout — implement từ M0)**
- [ ] **App Layout** (`/app/*`): Sidebar (256px) + Header (56px sticky) + Main content (`flex-1 p-6`)
- [ ] **Header layout** CSS Grid 3 cột `grid-cols-[1fr_auto_1fr]`:
  - [ ] Cột Left: icon logo + chữ **"TaskFlow"** (`font-semibold text-primary`). Click → navigate `/app/my-tasks`. **Không có page title trong header**
  - [ ] Cột Center: Search box, ẩn trên mobile
  - [ ] Cột Right: Notification Bell + Avatar (32px) + **tên user** (`hidden sm:inline`)
- [ ] **UserDropdown** (bấm vào Avatar + Tên):
  - [ ] Header block: Tên user (`font-medium`) + Email (`text-xs text-muted`) — không phải nút
  - [ ] Separator
  - [ ] Nút **"Đăng xuất"** (`text-destructive`, icon `LogOut`). **Không có "Hồ sơ cá nhân"**
  - [ ] Bấm Đăng xuất → xóa token → redirect `/login` + toast "Đã đăng xuất."
- [ ] **Auth Layout** (`/login`, `/register`): centered card `max-w-[400px]`, logo + tên app phía trên form
- [ ] Mỗi trang `app/*` có `<h1>` riêng trong Main Content (không trong Header)
- [ ] **[UI] Sidebar kiểm tra trực quan (theo design-system.md §3.2):**
  - [ ] **Workspace Switcher** — 1 dòng duy nhất: icon + tên workspace (truncate) + chevron ▾
  - [ ] Bấm workspace → dropdown **float** (không đẩy nav items xuống), `z-index: 50`
  - [ ] Dropdown: danh sách workspaces + `RoleBadge`, active item có ✔ + highlight primary
  - [ ] Chevron xoay lên (▴) khi mở, xoay xuống (▾) khi đóng
  - [ ] Cuối dropdown có nút **"Tạo workspace mới"** (icon Plus, không có chữ "+" thừa, có separator phía trên)
  - [ ] Click ra ngoài → dropdown đóng
  - [ ] **Nút "+ Tạo task"** — chỉ hiện với Admin/Manager, ẩn với Member
  - [ ] Nav chính (tất cả roles): **Công việc của tôi**, **Dự án**
  - [ ] Nav chính (Admin/Manager): **Kanban Team**, **Báo cáo**
  - [ ] Nav dưới — separator — (Admin only): **Cài đặt**, **Thành viên**, **Thùng rác**
  - [ ] Nav item **Thành viên** nằm giữa Cài đặt và Thùng rác
  - [ ] Active nav item: background highlight + text primary, icon filled
  - [ ] Bottom user block: Avatar (initials) + tên user + role badge

**Tests**
- [ ] Tất cả API Tests pass (11/11 test cases)
- [ ] Tất cả Unit Tests pass
- [ ] Tất cả E2E Tests pass (7/7 scenarios)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage auth module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Security**
- [ ] Không hardcode JWT_SECRET (dùng env variable)
- [ ] Input sanitization trên tất cả form fields (ngăn XSS)
- [ ] Rate limiting middleware hoạt động

**Acceptance Gate M0**
- [ ] Dev env chạy được locally (frontend + backend + DB)
- [ ] Đăng ký → tạo workspace → đăng nhập → xem /app/my-tasks thành công
- [ ] Tất cả edge cases đã handle và test pass
- [ ] **[UI] Sidebar đủ thành phần (Admin role):**
  - [ ] Workspace Switcher (1 dòng, bấm ra dropdown float)
  - [ ] Nút "+ Tạo task" (primary, full-width)
  - [ ] Công việc của tôi | Kanban Team | Dự án | Báo cáo
  - [ ] Separator
  - [ ] Cài đặt | **Thành viên** | Thùng rác
  - [ ] Bottom: Avatar + tên user + role
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

## Milestone M1 — Core CRUD

> **Timeline:** Week 2–3 | **Acceptance Gate:** Tạo, assign, đổi status task hoạt động end-to-end.

### FR Coverage: FR-02, FR-03, FR-04, FR-05

> [!IMPORTANT]
> **Quy tắc tuần tự FR bắt buộc trong M1:**
> Phải thực hiện theo đúng thứ tự sau. FR trước phải **pass 100% Checklist Definition of Done** (bao gồm tất cả API Tests, Unit Tests, E2E Tests) trước khi bắt đầu FR tiếp theo.
>
> `FR-02 (Workspace & Members)` → `FR-03 (Project)` → `FR-04 (Task CRUD)` → `FR-05 (Task Status)`
>
> **Lý do thứ tự này:** FR-02 phải có trước vì cần workspace + member. FR-03 phải có trước vì task thuộc project. FR-04 phải có trước vì FR-05 cần task tồn tại để đổi status.

---

### FR-02: Workspace & Member Management (P0)

**Mô tả từ PRD:** Mỗi user có thể tạo và tham gia nhiều workspace. Admin tạo workspace, đổi tên, xóa workspace (không cho xóa nếu là workspace duy nhất còn lại của user). Mời thành viên qua email, link mời hết hạn sau 48 giờ. Admin có thể thay đổi role và xóa thành viên bất kỳ lúc nào. User chuyển đổi giữa các workspace qua workspace switcher.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.2`**
> Workspace Switcher dropdown, Settings page layout, Member table (2 sections: active + pending), invite countdown HH:MM:SS, RoleBadge, PendingBadge, confirm dialogs.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.2.

#### NFR áp dụng cho FR-02

| NFR | Yêu cầu |
|-----|---------|
| NFR-03 Security | Row-level isolation: workspace A không lộ sang workspace B |
| NFR-04 Scalability | Hỗ trợ tối thiểu 10 workspace, 50 member/workspace |
| NFR-07 Data Integrity | Invite token expire 48h, task không mất khi member bị xóa |

#### User Stories & Acceptance Criteria (FR-02)

**US-04: Invite thành viên vào workspace** *(copy từ PRD US-04)*

```
Given: Admin vào Settings > Members và nhập email hợp lệ
When: Click "Send Invite"
Then:
  - Hệ thống gửi email có link invite (dạng /invite?token=xxx)
  - Link có hiệu lực 48 giờ
  - Danh sách hiển thị email đó với badge "Pending"
  - Admin nhận thông báo in-app khi người được mời accept

Given: Admin nhập email đã là member
When: Click "Send Invite"
Then:
  - Hiển thị lỗi: "Email này đã là thành viên của workspace."
  - Không gửi email

Given: Link invite hết hạn (>48h) và người dùng click
When: Truy cập link
Then:
  - Trang hiển thị "Link mời đã hết hạn. Vui lòng liên hệ Admin để được mời lại."
```

**US-WORKSPACE-01: Tạo và lấy danh sách workspace**

```
Given: User đã đăng nhập nhưng chưa có workspace nào
When: Tạo workspace đầu tiên với tên hợp lệ
Then:
  - Workspace được tạo thành công, user trở thành Admin của workspace đó
  - User được redirect vào khu vực app của workspace vừa tạo

Given: User đã là thành viên của nhiều workspace
When: Gọi API lấy danh sách workspace
Then:
  - Trả về đúng danh sách workspaces user là member
  - Không lộ workspace mà user không thuộc về
```

**US-WORKSPACE-02: Đổi tên workspace**

```
Given: Admin vào Settings của workspace
When: Sửa tên workspace và lưu
Then:
  - Tên workspace cập nhật ngay trên sidebar/header
  - Toast: "Đã cập nhật tên workspace thành công"

Given: Admin submit tên workspace rỗng
When: Submit
Then:
  - Validation lỗi: "Tên workspace không được để trống"
  - Không gọi API

Given: Manager/Member cố đổi tên workspace qua API
When: PATCH /api/workspaces/:id
Then:
  - 403 Forbidden
```

**US-WORKSPACE-03: Xóa workspace**

```
Given: Admin có 2+ workspaces, vào Settings > click "Xóa workspace"
When: Confirm dialog xuất hiện, Admin xác nhận
Then:
  - Workspace bị xóa (hard delete cascade: projects, tasks, comments, activity_logs, notifications, invite_tokens, workspace_members)
  - Tất cả members khác nhận notification: "Workspace [name] đã bị xóa bởi Admin."
  - Admin tự động redirect sang workspace khác trong danh sách
  - Toast: "Workspace [name] đã được xóa."

Given: Admin chỉ còn 1 workspace duy nhất
When: Xem nút "Xóa workspace"
Then:
  - Nút "Xóa workspace" bị disabled
  - Tooltip: "Bạn phải có ít nhất 1 workspace. Không thể xóa workspace cuối cùng."

Given: Admin chỉ còn 1 workspace, gọi API DELETE trực tiếp
When: DELETE /api/workspaces/:id
Then:
  - 400: "Bạn phải có ít nhất 1 workspace. Không thể xóa workspace cuối cùng."

Given: Manager/Member cố xóa workspace qua API
When: DELETE /api/workspaces/:id
Then:
  - 403 Forbidden
```

**US-WORKSPACE-04: Chuyển đổi workspace (Workspace Switcher)**

```
Given: User thuộc 2+ workspaces
When: Click vào workspace name trên sidebar
Then:
  - Dropdown hiển thị danh sách workspaces, workspace hiện tại highlighted
  - Mỗi workspace hiển thị: name + role badge (Admin/Manager/Member)
  - Nút "+ Tạo workspace mới" ở cuối dropdown

Given: User click workspace khác trong dropdown
When: Switch
Then:
  - currentWorkspaceId cập nhật (Zustand store + localStorage)
  - Toàn bộ data reload: projects, tasks, notifications, members
  - URL không thay đổi, vẫn ở trang hiện tại
  - Sidebar cập nhật tên workspace mới

Given: User bị xóa khỏi workspace đang active
When: API call trả 403 (workspace context invalid)
Then:
  - Auto-switch sang workspace khác trong list (nếu còn)
  - Toast: "Bạn đã bị xóa khỏi workspace [name]."
  - Nếu không còn workspace nào → redirect trang "Tạo Workspace"
```

**US-MEMBER-01: Quản lý role & xóa thành viên**

```
Given: Admin đổi role của member từ Member → Manager
When: Lưu thay đổi
Then:
  - Role cập nhật, permission thay đổi từ lần reload tiếp theo

Given: Admin cố xóa chính mình khỏi workspace
When: Click xóa
Then:
  - Lỗi: "Không thể xóa Admin đang đăng nhập."

Given: Member cố tự xóa mình qua API
Then:
  - 403 Forbidden: chỉ Admin có quyền xóa member
```

#### Edge Cases & Error States (FR-02)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Invite email đã là member | Lỗi: "Email này đã là thành viên của workspace." |
| Invite email đã có pending invite | Upsert: cập nhật invite cũ (token/role/expires mới), không tạo duplicate. Toast "Đã gửi lại lời mời thành công" |
| Link invite hết hạn (>48h) | Trang báo "Link mời đã hết hạn." |
| Admin tự xóa chính mình | Không cho phép, hiển thị lỗi |
| Member tự xóa chính mình | 403 Forbidden |
| Xóa member còn task đang assign | Task giữ nguyên, hiển thị "[Removed User]" |
| Xóa workspace cuối cùng | 400: "Phải có ít nhất 1 workspace", nút disabled trên UI |
| Xóa workspace có members khác | Hard delete cascade + notification cho tất cả members |
| Rename workspace tên rỗng | Validation lỗi, không gọi API |
| Rename workspace bởi non-Admin | 403 Forbidden |
| User bị xóa khỏi workspace đang active | Auto-switch workspace khác hoặc redirect tạo mới |
| User accept invite → thuộc nhiều workspace | Workspace switcher cập nhật ngay |

#### Test Plan (FR-02)

**1. API Tests**

| Test Case | Input | Expected |
|---|---|---|
| GET /api/workspaces | auth user | 200, list workspaces của user |
| POST /api/workspaces | tên workspace hợp lệ | 201, workspace created, creator = Admin |
| GET /api/workspaces/:id | member | 200, workspace detail |
| GET /api/workspaces/:id - not member | outsider | 403 Forbidden |
| PATCH /api/workspaces/:id - Admin rename | name mới | 200, name updated |
| PATCH /api/workspaces/:id - non-Admin | Manager/Member | 403 Forbidden |
| PATCH /api/workspaces/:id - name rỗng | `{ name: "" }` | 400, validation error |
| DELETE /api/workspaces/:id - happy path | Admin, có 2+ workspaces | 200, workspace deleted, cascade data |
| DELETE /api/workspaces/:id - last workspace | Admin, chỉ còn 1 | 400, "Không thể xóa workspace cuối cùng" |
| DELETE /api/workspaces/:id - non-Admin | Manager/Member | 403 Forbidden |
| DELETE /api/workspaces/:id - cascade verify | sau delete | projects, tasks, members đều bị xóa |
| POST /api/workspaces/invite - happy path | email mới hợp lệ | 200, email gửi, badge Pending |
| POST /api/workspaces/invite - duplicate member | email đã là member | 409, error message |
| GET /invite?token= - expired | token > 48h | 410, "Link mời đã hết hạn" |
| GET /invite?token= - valid | token hợp lệ | 200, join workspace + notification cho Admin |
| PATCH /api/workspaces/members/:id/role | Admin đổi role | 200, role updated |
| DELETE /api/workspaces/members/:id | Admin xóa member khác | 200, removed |
| DELETE /api/workspaces/members/:id - self | Admin tự xóa | 403 Forbidden |
| GET /api/workspaces/members | list | 200, chỉ workspace hiện tại |
| Cross-workspace isolation | user A gọi API workspace B | 403 Forbidden |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| generateInviteToken() sinh token unique | invite.service |
| isTokenExpired() đúng với ngưỡng 48h | invite.service |
| canAdminDeleteMember(actorId, targetId) | permission.service |
| getWorkspaceCount(userId) đếm đúng | workspace.service |
| canDeleteWorkspace(userId) → false khi chỉ còn 1 | workspace.service |
| validateWorkspaceName() — rỗng, max length | workspace.schema |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Invite thành viên mới | Admin > Settings > Invite > nhập email > send | Email gửi, badge Pending hiện |
| Accept invite | Click link trong email | Join workspace, account tạo |
| Link hết hạn | Click link sau 48h | Trang báo lỗi đúng text |
| Đổi role member | Admin > Settings > đổi role | Permission thay đổi đúng |
| Xóa member | Admin > Settings > xóa | Task hiển thị "[Removed User]" |
| Rename workspace | Admin > Settings > đổi tên > save | Tên cập nhật trên sidebar |
| Xóa workspace (có 2+) | Admin > Settings > xóa > confirm | Workspace xóa, redirect sang workspace khác |
| Xóa workspace cuối cùng — blocked | Admin chỉ có 1 workspace | Nút disabled + tooltip lý do |
| Workspace switcher - switch | Click sidebar > chọn workspace khác | Data reload, context cập nhật |
| Workspace switcher - tạo mới | Click "+ Tạo workspace mới" | Form tạo workspace, sau tạo tự switch |

#### Checklist FR-02 ✅ Definition of Done

**Implementation — Workspace CRUD**
- [ ] `GET /api/workspaces` trả danh sách workspace user đang tham gia
- [ ] `POST /api/workspaces` tạo workspace mới, creator = Admin
- [ ] `GET /api/workspaces/:id` trả chi tiết workspace (chỉ member truy cập)
- [ ] `PATCH /api/workspaces/:id` Admin đổi tên workspace (validation: not empty, max 100 chars)
- [ ] `DELETE /api/workspaces/:id` Admin xóa workspace:
  - [ ] Business rule: KHÔNG xóa nếu là workspace duy nhất còn lại của Admin
  - [ ] Hard delete cascade: projects, tasks, comments, activity_logs, notifications, invite_tokens, workspace_members
  - [ ] Notification cho tất cả members khi workspace bị xóa
  - [ ] Confirm dialog trên UI trước khi xóa
  - [ ] Nút disabled + tooltip khi chỉ còn 1 workspace

**Implementation — Workspace Switcher**
- [ ] Sidebar hiển thị **1 dòng trigger duy nhất**: icon + tên workspace đang active (truncate) + chevron-down
- [ ] Bấm trigger → dropdown **float** bên ngoài sidebar (không đẩy nav items xuống), `z-dropdown`
- [ ] Dropdown: danh sách workspaces + `RoleBadge` mỗi item. Active item: check icon + highlight primary
- [ ] Chevron xoay lên khi mở, xoay xuống khi đóng (transition `duration-normal`)
- [ ] Click ra ngoài hoặc chọn workspace → đóng dropdown
- [ ] Switch workspace → cập nhật `currentWorkspaceId` (Zustand + localStorage)
- [ ] Switch workspace → gửi `x-workspace-id` header trong mọi API request
- [ ] Switch workspace → reload toàn bộ data (projects, tasks, notifications)
- [ ] Nút "+ Tạo workspace mới" cuối dropdown (có separator phía trên)
- [ ] Auto-switch khi bị xóa khỏi workspace đang active

**Implementation — Header**
- [ ] Cột Left: **Logo + chữ "TaskFlow"** (`font-semibold text-primary`), click navigate về `/app/my-tasks`. **Không dùng page title/breadcrumb ở đây**
- [ ] Cột Center: Search box (`clamp(280px, 36vw, 520px)`). Không hiển trên mobile
- [ ] Cột Right: Notification Bell + **Avatar (32px) + tên user** (bấm mở `UserDropdown`)
- [ ] **UserDropdown** chỉ có 2 phần: header block (tên + email, không phải nút) + nút **"Đăng xuất"** (`text-destructive`). **Không có "Hồ sơ cá nhân"**
- [ ] Đăng xuất: xóa token/session → redirect `/login` + toast info "Đã đăng xuất."
- [ ] Tên user ẩn trên mobile (`hidden sm:inline`)
- [ ] Grid layout 3 cột `grid-cols-[1fr_auto_1fr]` đảm bảo search luôn chính giữa

**Implementation — Member Management**
- [ ] `POST /api/workspaces/invite` gửi email + tạo invite token 48h
  - [ ] **Upsert:** Mời lại email đã có pending → cập nhật invite cũ (token/role/expires mới), KHÔNG tạo duplicate
  - [ ] **Email nội dung:** Subject có tên người mời. Body có: tên workspace, tên người mời, vai trò được mời (Quản lý/Thành viên), link accept, thời hạn 48h
- [ ] `GET /invite?token=` validate + join workspace
- [ ] `PATCH /api/workspaces/members/:id/role` Admin đổi role
- [ ] `DELETE /api/workspaces/members/:id` Admin xóa member (không self)
- [ ] Row-level isolation: không lộ data giữa workspaces
- [ ] Task của member bị xóa hiển thị "[Removed User]"
- [ ] Notification gửi cho Manager khi assignee bị xóa
- [ ] Notification gửi cho Admin khi member mới accept invite
- [ ] Trang `/app/settings/members` UI bám sát design-system.md mục 7.2:
  - [ ] **Section "Thành viên" (active):** Data table tách riêng — Tên | Email | Vai trò | Hành động
  - [ ] **Section "Lời mời đang chờ" (pending):** Tách riêng dưới section thành viên
  - [ ] Pending invite hiển thị: email + RoleBadge + PendingBadge + **countdown timer 48h**
  - [ ] Countdown format: `HH:MM:SS` đếm ngược thời gian thực (cập nhật mỗi giây, font monospace). Khi hết hạn: "Đã hết hạn" (text destructive)
  - [ ] Ẩn section pending khi không có invite nào
  - [ ] Admin tự xóa chính mình → nút disabled + tooltip "Không thể xóa Admin đang đăng nhập."
- [ ] Badge "Pending" hiển thị đúng (warning-bg, warning text)
- [ ] Link invite hết hạn → trang báo lỗi đúng text

**Tests**
- [ ] Tất cả API Tests pass (20/20)
- [ ] Tất cả Unit Tests pass (6/6)
- [ ] Tất cả E2E Tests pass (10/10)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage workspace/invite module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Acceptance Gate FR-02**
- [ ] User tạo workspace đầu tiên và lấy danh sách workspaces hoạt động đúng
- [ ] Workspace CRUD hoạt động: tạo, xem, đổi tên, xóa (với rule không xóa cái cuối)
- [ ] **[UI] Workspace Switcher kiểm tra trực quan:**
  - [ ] Sidebar chỉ hiện **1 dòng** (icon + tên workspace + chevron ▾)
  - [ ] Bấm vào → dropdown **float** (không đẩy nav items xuống)
  - [ ] Workspace đang active: có ✔ + highlight primary
  - [ ] Chevron xoay lên khi mở, xoay xuống khi đóng
  - [ ] Cuối dropdown có nút "+ Tạo workspace mới"
  - [ ] Click ra ngoài → đóng dropdown
- [ ] **[UI] Header kiểm tra trực quan:**
  - [ ] Bên trái: logo + chữ "TaskFlow" (màu primary). Không có page title
  - [ ] Bên phải: Avatar + tên user hiển thị cạnh nhau
  - [ ] Bấm Avatar/Tên → dropdown chỉ có: Tên + Email + Đăng xuất. **Không có "Hồ sơ cá nhân"**
  - [ ] Bấm Đăng xuất → redirect `/login` + toast "Đã đăng xuất."
- [ ] Admin invite → member nhận email → accept → join workspace hoạt động end-to-end
- [ ] Tất cả edge cases FR-02 đã handle (duplicate invite, expired link, self-delete, last workspace)
- [ ] Xóa member → task hiển thị "[Removed User]" đã verify
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

### FR-03: Quản lý Project (P0)

**Mô tả từ PRD:** Manager tạo project với tên, mô tả, màu sắc label. Hiển thị số task tổng / done. Manager archive project khi hoàn thành.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.3`**
> Project list layout, ProjectCard (color bar, task count, ArchivedBadge), Project Detail (breadcrumb + Info Card + progress bar + Kanban), EditProjectDialog, confirm dialog archive.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.3.

#### User Stories & Acceptance Criteria (FR-03)

**US-PROJECT-01: Tạo và quản lý project**

```
Given: Manager vào /app/projects và click "+ New Project"
When: Điền tên, mô tả, chọn màu và submit
Then:
  - Project được tạo, hiển thị trong danh sách với "0 / 0 tasks"
  - Toast: "Project đã tạo thành công"

Given: Manager archive project có task đang Open
When: Click Archive
Then:
  - Project bị archive, không tạo task mới được
  - Task cũ vẫn update status được
  - Project hiển thị badge "Archived"

Given: Member cố tạo project
When: Gọi API tạo project
Then:
  - 403 Forbidden
```

#### Edge Cases & Error States (FR-03)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Archive project còn task đang Open | Task tồn tại, không tạo task mới, task cũ update được |
| Tạo task trong project archived | 400: "Project đã archive, không thể tạo task mới" |
| Member cố tạo project | 403 Forbidden |
| Project name để trống | Validation lỗi, không gọi API |

#### Test Plan (FR-03)

**1. API Tests**

| Test Case | Input | Expected |
|---|---|---|
| POST /api/projects - Manager | name, desc, color | 201, project created |
| POST /api/projects - Member | same | 403 Forbidden |
| PATCH /api/projects/:id/archive | Manager archive | 200, archived_at set |
| POST /api/tasks vào archived project | project_id đã archive | 400, error message |
| GET /api/projects | — | 200, chỉ projects của workspace |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| canCreateTask(project) = false khi archived | project.service |
| getTaskCount(projectId) đúng | project.service |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Tạo project | Manager > Projects > New | Project xuất hiện, task count "0/0" |
| Archive project | Manager > Project > Archive | Badge Archived, nút New Task disabled |
| Task count update | Tạo task mới | Counter tăng đúng |

#### Checklist FR-03 ✅ Definition of Done

**Implementation**
- [ ] `POST /api/projects` Manager tạo được, Member bị 403
- [ ] `GET /api/projects` list đúng workspace
- [ ] `PATCH /api/projects/:id` cập nhật name/desc/color
- [ ] `PATCH /api/projects/:id/archive` archive project (set archived_at)
- [ ] Project hiển thị task count (total/done) tính đúng
- [ ] Không tạo task mới trong archived project (UI disabled + API 400)
- [ ] Badge "Archived" hiển thị đúng trên UI
- [ ] Trang `/app/projects` đúng navigation PRD 12.2
- [ ] Trang `/app/projects/:id` hiển thị Kanban board 4 cột (To Do | In Progress | In Review | Done)
- [ ] **Project Detail layout:** Breadcrumb (`← Dự án / [Tên]`) + Project Info Card (tên, mô tả, progress bar done/total %) + Section header "Danh sách Task"
- [ ] **Nút "✏ Chỉnh sửa":** Admin/Manager, ẩn khi archived. Click → `EditProjectDialog` (sửa tên, mô tả, màu sắc, `PATCH /api/projects/:id`)
- [ ] **Progress bar:** Hiển thị `[done] / [total] tasks hoàn thành` + thanh progress gradient xanh lá + `[%]`
- [ ] Member chỉ drag-drop task assign cho mình trong Project Detail. Task người khác `draggable={false}`

**Tests**
- [ ] Tất cả API Tests pass (5/5)
- [ ] Tất cả Unit Tests pass (2/2)
- [ ] Tất cả E2E Tests pass (3/3)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage project module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Acceptance Gate FR-03**
- [ ] Manager tạo project → archive → task cũ vẫn update được hoạt động end-to-end
- [ ] Tất cả edge cases FR-03 đã handle (archived project, member permission)
- [ ] Task count hiển thị chính xác sau khi tạo/xóa task
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

### FR-04: Tạo và chỉnh sửa Task (P0)

**Mô tả từ PRD:** Manager và Member tạo task: Title (required, max 200), Description (markdown, max 5000), Assignee (optional), Project (required), Priority, Due date, Status.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.4`**
> TaskForm slide-over layout, form fields (markdown textarea, assignee combobox, date picker), TaskDetailSheet (view mode vs edit mode), Description markdown rendering (class `.prose-task`), OverdueBadge, TaskCard variants.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.4.

> Ghi chú implementation theo requirements hiện tại: `assignee` là optional cho mọi role. Nếu được truyền thì assignee phải thuộc workspace hiện tại; rule assign/edit cụ thể phải được enforce ở endpoint thay vì chỉ dựa vào UI.

#### User Stories & Acceptance Criteria (FR-04)

**US-01: Tạo task mới** *(copy từ PRD US-01)*

```
Given: Manager đang ở trong bất kỳ trang nào của workspace
When: Click nút "+ Tạo task" trên Sidebar và điền đủ Title + Project, rồi Submit
Then:
  - Task được tạo và hiển thị ngay trong project ở status "To Do"
  - Nếu có Assignee, người đó nhận thông báo "Bạn được assign task mới: [Title]"
  - Activity log ghi "Created by [Tên Manager] at [timestamp]"
  - Form đóng, user thấy task vừa tạo

Given: Manager submit form với Title để trống
When: Click Submit
Then:
  - Form hiển thị lỗi "Title không được để trống" ngay dưới trường Title
  - Task KHÔNG được tạo

Given: User tạo hoặc sửa task với `assignee_id` không thuộc workspace hiện tại
When: Submit request
Then:
  - API trả 400 Bad Request
  - Task KHÔNG được tạo hoặc cập nhật
```

#### Edge Cases & Error States (FR-04)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Task title có `<script>alert('xss')</script>` | Sanitize, lưu plain text, không render HTML |
| Assignee bị xóa khỏi workspace | Task giữ nguyên, hiển thị "[Removed User]" |
| 2 user cùng edit title cùng lúc | Last-write-wins, activity log ghi từng lần |
| Due date set ngày quá khứ | Cho phép, badge "Overdue" ngay lập tức |
| Title > 200 ký tự | Validation lỗi, không submit |
| Description > 5000 ký tự | Validation lỗi, không submit |
| Assignee không thuộc workspace | 400 Bad Request |
| Restore task khi project gốc đã archive | 400: "Project đã archive. Không thể khôi phục task." |
| Restore task khi assignee đã bị kick | Restore thành công, `assignee_id = null` (unassigned) |
| Task > 30 ngày trong trash | Tự động ẩn khỏi Trash list, không cho restore |
| Double restore (task đã restore rồi) | 400: task không nằm trong trash |
| Xóa workspace → soft-deleted tasks | Cascade xóa vĩnh viễn luôn |

#### Test Plan (FR-04)

**1. API Tests**

| Test Case | Input | Expected |
|---|---|---|
| POST /api/tasks - happy path | title, project_id hợp lệ | 201, task created, status=ToDo |
| POST /api/tasks - no title | title rỗng | 400, validation error |
| POST /api/tasks - title > 200 chars | 201 ký tự | 400, validation error |
| POST /api/tasks - XSS title | `<script>` trong title | 201, title sanitized plain text |
| POST /api/tasks - past due date | due_date hôm qua | 201, isOverdue=true |
| POST /api/tasks - invalid assignee | assignee không trong workspace | 400 error |
| PATCH /api/tasks/:id - invalid assignee | assignee không trong workspace | 400 error |
| GET /api/tasks/:id | task id | 200, full task detail |
| PATCH /api/tasks/:id - update | Manager/creator edit | 200, activity log tạo |
| DELETE /api/tasks/:id | Admin/Manager soft delete | 200, deleted_at set |
| GET /api/projects/:id/tasks | project id | 200, chỉ task của project |
| GET /api/tasks/trash | Admin | 200, list soft-deleted tasks (< 30 ngày), kèm countdown |
| GET /api/tasks/trash - non-Admin | Manager/Member | 403 Forbidden |
| GET /api/tasks/trash - task > 30 ngày | Admin | Task > 30 ngày KHÔNG xuất hiện trong list |
| POST /api/tasks/:id/restore - happy path | Admin, task < 30 ngày, project active | 200, deleted_at = null, task quay về project |
| POST /api/tasks/:id/restore - expired | Admin, task > 30 ngày | 410 Gone, không restore được |
| POST /api/tasks/:id/restore - archived project | Admin, project đã archive | 400, "Project đã archive" |
| POST /api/tasks/:id/restore - assignee kicked | Admin, assignee đã rời workspace | 200, assignee_id = null |
| POST /api/tasks/:id/restore - double restore | Admin, task đã active | 400, "Task không nằm trong trash" |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| sanitizeInput() loại bỏ HTML tags | task.service |
| isOverdue(dueDate) kiểm tra đúng | task.service |
| validateTaskInput() Zod schema đúng | task.schema |
| softDelete() set deleted_at, không xóa record | task.service |
| createActivityLog() khi task created | activity.service |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Tạo task từ Sidebar | Admin/Manager click "+ Tạo task" trên Sidebar | Slide-over mở, submit, task xuất hiện |
| Tạo task từ Project Detail | Member click "+ Tạo task" trong /app/projects/:id | Slide-over mở với project pre-fill |
| Validation lỗi | Submit không có title | Lỗi hiện ngay dưới field |
| XSS prevention | Title = `<script>alert(1)</script>` | Hiển thị plain text |
| Due date quá khứ | Set due date hôm qua | Badge "Overdue" ngay |
| Soft delete | Admin/Manager xóa task | Không hiện trong list, còn trong DB |
| Edit task | Sửa title → save | Activity log ghi thay đổi |
| Xem Trash + countdown | Admin vào /app/trash | List task đã xóa, hiển đếm ngược ngày giờ còn lại |
| Trash ẩn task > 30 ngày | Task quá 30 ngày | Không hiện trong Trash list |
| Restore task | Admin click Restore trong Trash | Task quay về project gốc, status cũ |
| Restore blocked - archived project | Project gốc đã archive | Toast lỗi, task vẫn trong trash |
| Restore - assignee kicked | Assignee đã rời workspace | Restore OK, assignee = trống |
| Trash permission | Manager/Member truy cập /app/trash | Redirect hoặc 403 |

#### Checklist FR-04 ✅ Definition of Done

- [ ] `POST /api/tasks` đủ validation (title required/max 200, desc max 5000, project required)
- [ ] `GET /api/tasks/:id` trả đủ fields
- [ ] `PATCH /api/tasks/:id` cập nhật fields, tạo activity log
- [ ] `DELETE /api/tasks/:id` soft delete (deleted_at), chỉ Admin/Manager
- [ ] Rule assign/edit assignee được validate ở backend, không phụ thuộc riêng vào UI
- [ ] XSS sanitization hoạt động (test với `<script>`)
- [ ] Due date quá khứ → badge "Overdue" ngay
- [ ] Assignee phải thuộc workspace
- [ ] Nút "+ Tạo task" trên Sidebar: chỉ hiển cho Admin/Manager, Member ẩn (design-system 3.2)
- [ ] Nút "+ Tạo task" trong `/app/projects/:id`: hiển cho tất cả roles, disabled khi project archived
- [ ] Mở từ Project Detail → form pre-fill project hiện tại
- [ ] Slide-over panel mở từ phải (design-system 4.13)
- [ ] **Description Markdown rendering:** View mode dùng `react-markdown` + `remark-gfm` (class `.prose-task`). Hỗ trợ: headings, bold/italic, strikethrough, lists, checklists (GFM), code blocks, blockquotes, tables, links (mở tab mới), images. Edit mode dùng `<textarea>` nhập raw markdown
- [ ] Optimistic UI khi create, rollback nếu API lỗi
- [ ] **Trash & Restore:**
- [ ] `GET /api/tasks/trash` trả list task soft-deleted (chỉ Admin, chỉ task < 30 ngày)
- [ ] `POST /api/tasks/:id/restore` khôi phục task (chỉ Admin, trong 30 ngày)
- [ ] Trang `/app/trash` hiển thị: title, project, người xóa, ngày xóa, **đếm ngược ngày giờ còn lại**
- [ ] Task > 30 ngày **tự động ẩn** khỏi Trash list (không hiển thị, API không trả)
- [ ] Restore blocked nếu project gốc đã archive → API trả 400
- [ ] Restore khi assignee đã bị kick → set `assignee_id = null`
- [ ] Double restore (task đã active) → API trả 400
- [ ] Soft delete dùng `deleted_at`; MVP không có hard delete
- [ ] Activity log ghi "Deleted by" và "Restored by"
- [ ] Tất cả API Tests pass (19/19)
- [ ] Tất cả Unit Tests pass (5/5)
- [ ] Tất cả E2E Tests pass (12/12)

---

### FR-05: Chuyển trạng thái Task (P0)

**Mô tả từ PRD:** Assignee và Manager kéo-thả hoặc click để chuyển trạng thái. Mỗi lần đổi tạo 1 activity log entry với timestamp và người thực hiện.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.5`**
> Drag-drop card states (ghost, DragOverlay rotate, cột target dashed), optimistic UI flow, not-draggable state (opacity-75, cursor-not-allowed, tooltip), StatusSelector dropdown, mobile fallback.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.5.

#### User Stories & Acceptance Criteria (FR-05)

**US-02: Cập nhật trạng thái task** *(copy từ PRD US-02)*

```
Given: Member đang xem task được assign cho mình
When: Đổi Status từ "To Do" sang "In Progress"
Then:
  - Trạng thái thay đổi ngay lập tức (optimistic UI, không cần reload)
  - Activity log ghi "[Tên Member] changed status from To Do → In Progress at [timestamp]"
  - Dashboard team của Manager cập nhật trong vòng 5 giây

Given: Member cố đổi status của task KHÔNG được assign cho mình
When: Truy cập task đó
Then:
  - Nút đổi status bị disabled với tooltip "Chỉ assignee hoặc Manager mới có thể đổi trạng thái"
```

#### Edge Cases & Error States (FR-05)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Kéo thả task | Kéo **toàn bộ card** (không dùng drag handle riêng). Sau khi thả: **không reload trang**, **không flash** — optimistic UI cập nhật ngay |
| Member đổi status task không phải của mình | Card `draggable={false}`, `cursor: not-allowed`, `opacity-75`. Tooltip trên card: "Chỉ assignee hoặc Manager mới có thể đổi trạng thái". Click vẫn mở TaskDetailSheet, nút status bị `disabled` |
| Optimistic UI: API lỗi sau khi update | Rollback UI về status cũ, toast error |
| Drag-drop trên mobile | Fallback: click dropdown để đổi status |
| Đổi status task trong archived project | Vẫn cho phép |

#### Test Plan (FR-05)

**1. API Tests**

| Test Case | Input | Expected |
|---|---|---|
| PATCH /api/tasks/:id/status - assignee | assignee đổi status | 200, activity log tạo |
| PATCH /api/tasks/:id/status - Manager | Manager đổi | 200, activity log tạo |
| PATCH /api/tasks/:id/status - other member | member không phải assignee | 403 Forbidden |
| PATCH /api/tasks/:id/status - invalid enum | "InvalidStatus" | 400, validation error |
| GET /api/tasks/:id/activity sau đổi status | — | Entry mới với old→new values |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| canChangeStatus(userId, task) permission check | task.service |
| createStatusChangeLog(old, new, userId) format | activity.service |
| isValidStatus(status) enum validation | task.schema |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Đổi status qua dropdown | Click status badge → chọn mới | UI cập nhật ngay + toast.success("Đã đổi trạng thái thành [Status]") |
| Đổi status qua drag-drop Kanban | Kéo task card sang cột khác | Task move + toast.success + activity log tạo |
| Permission check dropdown | Member xem task người khác ở TaskDetail | Nút dropdown bị disabled, hiện tooltip "Chỉ assignee hoặc Manager mới có thể đổi trạng thái" |
| Permission check Kanban | Member kéo task người khác ở Kanban | Task card bị mờ (opacity), không thể kéo, hiện tooltip "Chỉ assignee hoặc Manager mới có thể đổi trạng thái" |
| Optimistic rollback | Giả lập API lỗi | UI rollback, toast.error |

#### Checklist FR-05 ✅ Definition of Done

**Implementation**
- [x] `PATCH /api/tasks/:id/status` với permission check (chỉ assignee + Manager)
- [x] Activity log entry tạo mỗi lần đổi status (timestamp + actor + old→new)
- [x] Optimistic UI: update ngay, rollback nếu API lỗi
- [x] Toast success: "Đã đổi trạng thái thành [Status]" khi đổi status thành công (cả drag-drop và dropdown)
- [x] Nút status disabled + tooltip "Chỉ assignee hoặc Manager mới có thể đổi trạng thái" đúng
- [x] Drag-drop Kanban hoạt động (@dnd-kit/core) trên cả Team Kanban và Project Detail
- [x] Project Detail: Admin/Manager drag mọi task, Member chỉ drag task assign cho mình
- [x] Member task không phải của mình: `draggable={false}`, cursor default
- [x] Fallback click dropdown trên mobile
- [x] Task trong archived project vẫn đổi status được

**Tests**
- [ ] Tất cả API Tests pass (5/5)
- [ ] Tất cả Unit Tests pass (3/3)
- [ ] Tất cả E2E Tests pass (4/4)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage task status module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Acceptance Gate FR-05**
- [x] Assignee đổi status (click + drag-drop), activity log ghi đúng hoạt động end-to-end
- [x] Optimistic UI rollback khi API lỗi đã verify
- [x] Tất cả edge cases FR-05 đã handle (permission, archived project, mobile fallback)
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

### Acceptance Gate M1

- [x] Workspace CRUD hoạt động: tạo, xem, đổi tên, xóa (rule không xóa cái cuối)
- [x] Workspace Switcher: switch giữa workspaces, data reload đúng
- [x] Tạo task với đủ fields hoạt động
- [x] Assign task cho member hoạt động
- [x] Đổi status task hoạt động (click + drag-drop)
- [x] Activity log ghi đúng mỗi thay đổi
- [x] Workspace/Project/Member management hoạt động
- [x] Row-level isolation giữa workspaces đã verify
- [ ] Tất cả tests M1 pass (FR-02 + FR-03 + FR-04 + FR-05)
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

## Milestone M2 — Collaboration

> **Timeline:** Week 4 | **Acceptance Gate:** Comment, notification, activity log hoạt động đầy đủ.

### FR Coverage: FR-06, FR-09, FR-10

> [!IMPORTANT]
> **Quy tắc tuần tự FR bắt buộc trong M2:**
> Phải thực hiện theo đúng thứ tự sau. FR trước phải **pass 100% Checklist Definition of Done** trước khi bắt đầu FR tiếp theo.
>
> `FR-06 (Comment)` → `FR-09 (Notification)` → `FR-10 (Activity Log)`
>
> **Lý do thứ tự này:** FR-06 (Comment) phải có trước vì FR-09 phụ thuộc vào comment để trigger notification @mention. FR-09 (Notification) phải có trước FR-10 vì Activity Log cần verify rằng comment + notification đều được log đúng.

---

### FR-06: Comment trong Task (P0)

**Mô tả từ PRD:** Bất kỳ member nào trong workspace có thể comment vào task. Comment hỗ trợ plain text và mention `@username`. Người được mention nhận thông báo in-app.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.6`**
> CommentThread layout, CommentForm (textarea + submit), MentionAutocomplete dropdown (vị trí phía TRÊN textarea, `bottom: 100%`), @mention highlight toàn bộ cụm tên multi-word, avatar + timestamp.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.6.

#### NFR áp dụng cho FR-06

| NFR | Yêu cầu |
|-----|---------|
| NFR-03 Security | Input sanitization, ngăn XSS trong comment content |
| NFR-05 Usability | Loading state khi API > 300ms, empty state "Chưa có comment nào" |

#### User Stories & Acceptance Criteria (FR-06)

**US-COMMENT-01: Viết comment vào task**

```
Given: Member vào task detail
When: Nhập comment và submit
Then:
  - Comment xuất hiện ngay trong thread (optimistic UI)
  - Activity log ghi "Commented by [Tên] at [timestamp]"

Given: Member viết comment có @username
When: Gõ @, hệ thống gợi ý danh sách member trong workspace
When: Chọn username và submit
Then:
  - Comment hiển thị @mention được highlight
  - Người được mention nhận notification in-app
  - Chính tác giả comment KHÔNG nhận notification khi mention chính mình

Given: Member không thuộc workspace cố comment
When: Gọi API comment
Then:
  - 403 Forbidden
```

#### Edge Cases & Error States (FR-06)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Comment có `<script>` XSS | Sanitize, lưu plain text, không render HTML |
| @mention user không thuộc workspace | Không gợi ý, nếu force thì không tạo notification |
| Comment rỗng | Validation lỗi, không gọi API |
| API call thất bại khi post comment | Toast error, nội dung comment vẫn còn trong textarea |

#### Test Plan (FR-06)

**1. API Tests**

| Test Case | Input | Expected |
|---|---|---|
| POST /api/tasks/:id/comments - happy path | content hợp lệ | 201, comment created |
| POST /api/tasks/:id/comments - XSS | `<script>` trong content | 201, content sanitized |
| POST /api/tasks/:id/comments - empty | content rỗng | 400, validation error |
| POST /api/tasks/:id/comments - outsider | user không thuộc workspace | 403 Forbidden |
| POST /api/tasks/:id/comments - @mention | @validUser | 201, notification tạo cho mentioned user |
| POST /api/tasks/:id/comments - self mention | @chính mình | 201, KHÔNG tạo notification |
| GET /api/tasks/:id/comments | task id | 200, list comments sorted by created_at |
| DELETE /api/tasks/:id/comments/:id | author xóa comment của mình | 200, comment removed |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| parseMentions(content) extract @usernames đúng | comment.service |
| sanitizeComment(content) loại bỏ HTML | comment.service |
| shouldNotifyMention(authorId, mentionedId) | notification.service |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Viết comment | Vào task > nhập comment > submit | Comment xuất hiện ngay |
| @mention autocomplete | Gõ @ trong comment box | Dropdown gợi ý members xuất hiện |
| @mention notification | Mention user B > submit | User B nhận notification |
| XSS prevention | Comment = `<script>alert(1)</script>` | Hiển thị plain text |
| Tác giả không nhận notification | @mention chính mình | Không có notification |

#### Checklist FR-06 ✅ Definition of Done

**Implementation**
- [ ] `POST /api/tasks/:id/comments` với validation (content required, max length)
- [ ] `GET /api/tasks/:id/comments` list sorted by created_at
- [ ] XSS sanitization trên comment content
- [ ] @mention autocomplete gợi ý members trong workspace khi gõ @
- [ ] @mention dropdown hiển thị **phía trên** textarea (`bottom: 100%`), không phải phía dưới
- [ ] @mention highlight: tên multi-word (vd: `acc fam 3`) highlight **toàn bộ cụm** — dùng character-scan, match tên dài nhất trước
- [ ] @mention tạo notification cho người được mention (trừ self-mention)
- [ ] Comment thread hiển thị đúng trong task detail (slide-over panel)
- [ ] Empty state: "Chưa có comment nào"
- [ ] Author có thể xóa comment của chính mình

**Tests**
- [ ] Tất cả API Tests pass (8/8)
- [ ] Tất cả Unit Tests pass (3/3)
- [ ] Tất cả E2E Tests pass (5/5)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage comment module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Acceptance Gate FR-06**
- [ ] Comment plain text + @mention hiển thị đúng trong task detail hoạt động end-to-end
- [ ] XSS với `<script>` bị sanitize, hiển thị plain text đã verify
- [ ] Tất cả edge cases FR-06 đã handle (XSS, self-mention, empty content, outsider)
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

### FR-09: Thông báo In-App (P1)

**Mô tả từ PRD:** Notification khi: được assign task mới, task bị comment (trừ self), task đến hạn trong 24h, được @mention. Hiển thị badge counter và dropdown list. Đánh dấu đã đọc khi click.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.7`**
> NotificationBell (badge "99+"), NotificationDropdown (width 380px, scroll >5 items), read/unread styles, polling 5s, mark-all-read button, click → navigate to task.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.7.

#### NFR áp dụng cho FR-09

| NFR | Yêu cầu |
|-----|---------|
| NFR-01 Performance | API response < 500ms cho endpoint đọc notifications |
| NFR-06 Availability | Polling 5s (không dùng WebSocket cho MVP) |

#### User Stories & Acceptance Criteria (FR-09)

**US-NOTIFY-01: Nhận và đọc notification**

```
Given: User được assign task mới
When: Manager assign task
Then:
  - Badge counter tăng +1 trên icon bell
  - Notification xuất hiện trong dropdown: "Bạn được assign task mới: [Title]"

Given: Task của user bị comment bởi người khác
When: Comment được tạo
Then:
  - Badge counter tăng +1
  - Notification: "[Tên] đã comment vào task [Title]"
  - KHÔNG notify nếu chính user tự comment

Given: Task của user đến hạn trong 24h
When: Scheduled check chạy
Then:
  - Notification: "Task [Title] sắp đến hạn vào [date]"

Given: User click vào notification
When: Click
Then:
  - Notification đánh dấu là "đã đọc"
  - Badge counter giảm đi
  - Navigate đến task tương ứng
```

#### Edge Cases & Error States (FR-09)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Task comment do chính tác giả tạo | KHÔNG gửi notification cho chính mình |
| Self-assign task | KHÔNG gửi notification cho chính mình |
| User offline khi notification được tạo | Notification vẫn lưu trong DB, hiện lại khi online |
| Nhiều notification chưa đọc | Badge hiển thị số đúng (max hiển thị "99+") |

#### Test Plan (FR-09)

**1. API Tests**

| Test Case | Input | Expected |
|---|---|---|
| GET /api/notifications | auth user | 200, list sorted by `created_at` desc (mới nhất trước) |
| GET /invite?token= (accept invite) | user accept invite | notification `invite_accepted` tạo cho Admin |
| DELETE /api/workspaces/members/:id | admin xóa member | notification `assignee_removed` tạo cho Manager |
| PATCH /api/notifications/:id/read (toggle) | notification chưa đọc | 200, read_at set (đánh dấu đã đọc) |
| PATCH /api/notifications/:id/read (toggle) | notification đã đọc | 200, read_at = null (đánh dấu chưa đọc) |
| PATCH /api/notifications/read-all | — | 200, tất cả đánh dấu đã đọc |
| POST assign task → notification tạo | assign task cho user | notification record tạo trong DB |
| POST comment → notification cho assignee | comment trên task | assignee nhận notification |
| POST comment by assignee → no self-notify | assignee tự comment | KHÔNG tạo notification cho assignee |
| Deadline 24h check | task due trong 23h | notification `due_soon` tạo |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| createAssignNotification(taskId, assigneeId, actorId) | notification.service |
| createCommentNotification(commentId) không tạo khi self | notification.service |
| isDueSoon(dueDate, hoursThreshold=24) | notification.service |
| getUnreadCount(userId) | notification.service |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Assign notification | Manager assign task cho Member | Badge +1, notification đúng text |
| Comment notification | User A comment task của User B | User B nhận notification |
| Self-comment no notify | User comment task của chính mình | Không nhận notification |
| Toggle read (unread→read) | Click ✓ trên notification chưa đọc | Badge -1, ✓ chuyển xanh lá |
| Toggle read (read→unread) | Click ✓ xanh lá trên notification đã đọc | Badge +1, ✓ chuyển xám, dot xanh hiện lại |
| Mark all read | Click "Đánh dấu tất cả đã đọc" | Badge = 0, tất cả ✓ xanh lá |

#### Checklist FR-09 ✅ Definition of Done

**Implementation**
- [ ] `GET /api/notifications` trả list sorted by `created_at` descending (mới nhất trước)
- [ ] `PATCH /api/notifications/:id/read` toggle read/unread (read→unread, unread→read)
- [ ] `PATCH /api/notifications/read-all` mark all read (optimistic UI + rollback)
- [ ] Badge counter đúng (increment khi toggle unread, decrement khi toggle read)
- [ ] Notification tạo khi: assign task, comment task, @mention, task due trong 24h
- [ ] KHÔNG tạo self-notification (self-assign, self-comment, self-mention)
- [ ] Polling 5s cập nhật unread count (lightweight `/api/notifications/unread-count`)
- [ ] Dropdown sort mới nhất trước, click text navigate đến task, ✓ toggle read/unread
- [ ] Nút ✓ luôn hiện: xám (chưa đọc, click→đã đọc), xanh lá (đã đọc, click→chưa đọc)
- [ ] Nút "Đánh dấu tất cả đã đọc" (header, hiện khi unreadCount > 0)
- [ ] Scrollbar hiện khi > 5 notifications (`max-h-[360px]`)
- [ ] Badge hiển thị "99+" khi vượt 99 notifications chưa đọc

**Tests**
- [ ] Tất cả API Tests pass (7/7)
- [ ] Tất cả Unit Tests pass (4/4)
- [ ] Tất cả E2E Tests pass (6/6)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage notification module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Acceptance Gate FR-09**
- [ ] Assign task → notification → mark as read hoạt động end-to-end
- [ ] Self-notification KHÔNG xảy ra (self-assign, self-comment) đã verify
- [ ] Tất cả edge cases FR-09 đã handle (offline user, badge 99+, self-notify)
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

### FR-10: Activity Log trong Task (P1)

**Mô tả từ PRD:** Mỗi task có tab "Activity" hiển thị toàn bộ lịch sử thay đổi: ai tạo, ai chỉnh sửa trường nào (giá trị cũ → giá trị mới), ai đổi status, ai comment. Không cho xóa activity log.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.8`**
> Activity tab trong TaskDetailSheet, entry format (avatar + tên + action + timestamp), sort mới→cũ (descending — mới nhất ở trên), không có nút xóa.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.8.

#### User Stories & Acceptance Criteria (FR-10)

**US-ACTIVITY-01: Xem lịch sử hoạt động của task**

```
Given: User vào task detail > tab "Activity"
When: Tab load
Then:
  - Hiển thị toàn bộ lịch sử theo thứ tự thời gian (mới nhất ở trên)
  - Mỗi entry có: avatar + tên người thực hiện + hành động + timestamp
  - Các loại entry: Created, Status changed (old→new), Field edited (field: old→new), Commented

Given: Admin cố xóa activity log
When: Gọi API delete activity
Then:
  - 405 Method Not Allowed (endpoint không tồn tại)
  - Activity log không thể xóa (NFR-07)
```

#### Edge Cases & Error States (FR-10)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Task có 0 activity | Tab Activity hiển thị "Chưa có hoạt động nào" |
| 2 user edit cùng lúc | Mỗi lần save đều tạo 1 entry riêng trong activity log |
| Activity log của task bị soft delete | Vẫn hiển thị activity log đầy đủ (không xóa) |
| Field được edit nhưng giá trị không thay đổi | Không tạo activity log entry (no-op) |

#### Test Plan (FR-10)

**1. API Tests**

| Test Case | Input | Expected |
|---|---|---|
| GET /api/tasks/:id/activity | task id | 200, list entries sorted by created_at DESC (mới nhất trước) |
| Verify entry khi tạo task | POST /api/tasks | activity entry "Created by..." tồn tại |
| Verify entry khi đổi status | PATCH /api/tasks/:id/status | entry "Status: ToDo → InProgress" tồn tại |
| Verify entry khi edit field | PATCH /api/tasks/:id | entry "title: old → new" tồn tại |
| DELETE /api/tasks/:id/activity - any | bất kỳ | 404 hoặc 405 (endpoint không có) |
| No entry khi edit no-op | PATCH với giá trị không đổi | Không tạo entry mới |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| createActivityEntry(taskId, action, oldVal, newVal, userId) format đúng | activity.service |
| isNoOp(oldValue, newValue) không tạo khi giống nhau | activity.service |
| formatActivityMessage(entry) hiển thị đúng | activity.service |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Xem activity tab | Vào task > tab Activity | Hiển thị entry "Created by..." |
| Activity sau đổi status | Đổi status > xem Activity | Entry "Status: To Do → In Progress" xuất hiện |
| Activity sau edit title | Sửa title > xem Activity | Entry "title: old → new" xuất hiện |
| Activity sau comment | Thêm comment > xem Activity | Comment entry xuất hiện |
| Không xóa được | Thử gọi API xóa | 404/405 error |

#### Checklist FR-10 ✅ Definition of Done

**Implementation**
- [ ] `GET /api/tasks/:id/activity` trả list sorted by `created_at DESC` (hoạt động mới nhất ở trên)
- [ ] Không có endpoint DELETE cho activity log (NFR-07 — không thể xóa)
- [ ] Activity entry tạo tự động khi: task created, status changed, field edited, comment added, **task deleted, task restored**
- [ ] Entry format đúng: actor + action + old_value → new_value + timestamp
- [ ] Không tạo entry khi edit no-op (giá trị không đổi)
- [ ] Tab "Activity" trong task detail UI hiển thị đúng
- [ ] Empty state: "Chưa có hoạt động nào"
- [ ] Activity log của task bị soft delete vẫn giữ nguyên

**Tests**
- [ ] Tất cả API Tests pass (6/6)
- [ ] Tất cả Unit Tests pass (3/3)
- [ ] Tất cả E2E Tests pass (5/5)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage activity module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Acceptance Gate FR-10**
- [ ] Tạo task → đổi status → edit title → comment → xóa → khôi phục → Activity tab hiển thị đủ 6 loại entry đúng (created, status_changed, field_edited, commented, deleted, restored)
- [ ] DELETE /api/tasks/:id/activity trả 404/405 đã verify
- [ ] Tất cả edge cases FR-10 đã handle (no-op edit, soft-deleted task, 0 activity)
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

### NFR áp dụng cho M2

| NFR | Kiểm tra |
|-----|---------|
| NFR-03 Security | XSS sanitization trong comment content |
| NFR-07 Data Integrity | Activity log không thể xóa, comment lưu history |
| NFR-01 Performance | API notification < 500ms |

### Acceptance Gate M2

- [ ] Comment trong task hoạt động (plain text + @mention)
- [ ] @mention tạo notification cho đúng người
- [ ] Notification badge + dropdown hoạt động
- [ ] Activity log ghi đầy đủ mọi thay đổi
- [ ] Activity log không thể xóa
- [ ] Tất cả tests M2 pass (FR-06 + FR-09 + FR-10)
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

## Milestone M3 — Dashboards

> **Timeline:** Week 5–6 | **Acceptance Gate:** My Tasks, Kanban board, Reports hoạt động đầy đủ.

### FR Coverage: FR-07, FR-08, FR-11, FR-13

> [!IMPORTANT]
> **Quy tắc tuần tự FR bắt buộc trong M3:**
> Phải thực hiện theo đúng thứ tự sau. FR trước phải **pass 100% Checklist Definition of Done** trước khi bắt đầu FR tiếp theo.
>
> `FR-07 (My Tasks)` → `FR-08 (Kanban Board)` → `FR-11 (Reports)` → `FR-13 (Thùng Rác)`
>
> **Lý do thứ tự này:** FR-07 (My Tasks) là view đơn giản nhất, làm trước để thiết lập pattern query tasks. FR-08 (Kanban) phức tạp hơn, cần drag-drop và filter — phải có task data từ FR-04/07. FR-11 (Reports) làm tiếp vì phụ thuộc vào data từ toàn bộ M1 + M2 + FR-07/08. FR-13 (Thùng Rác) làm cuối cùng trong M3 vì tái dùng task card pattern + filter pattern đã thiết lập bởi FR-07/08.

---

### FR-07: Dashboard cá nhân — My Tasks (P0)

**Mô tả từ PRD:** Mỗi user thấy danh sách task được assign cho mình, sort theo due date tăng dần. Filter: All / To Do / In Progress. Task quá hạn highlight màu đỏ.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.8`**
> My Tasks page layout, List Row Card variant (border-left overdue, 4 hàng thông tin), Filter Chip (All/To Do/In Progress), sort order (Overdue trước → due date → no due date), empty state text chuẩn.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.8.

#### NFR áp dụng cho FR-07

| NFR | Yêu cầu |
|-----|---------|
| NFR-01 Performance | LCP < 2.5s, API < 500ms |
| NFR-05 Usability | Empty state có hướng dẫn, loading state khi API > 300ms |
| NFR-06 Accessibility | Keyboard navigation, form labels rõ ràng |

#### User Stories & Acceptance Criteria (FR-07)

**US-03: Xem My Tasks** *(copy từ PRD US-03)*

```
Given: Member vào trang My Tasks
When: Trang load
Then:
  - Hiển thị tất cả task assigned cho user, trừ task đã Done
  - Sắp xếp: task Overdue (đỏ) lên đầu, sau đó sort by due date tăng dần
  - Task không có due date xuống cuối
  - Hiển thị badge "Overdue" nếu due date < ngày hôm nay

Given: User không có task nào
When: Vào trang My Tasks
Then:
  - Empty state: icon + "Bạn chưa có task nào. Hãy liên hệ Manager để được assign công việc."
```

**US-MYTASKS-02: Filter My Tasks**

```
Given: Member ở My Tasks > click filter "To Do"
Then: Chỉ hiển thị task status = To Do

Given: Member click filter "In Progress"
Then: Chỉ hiển thị task status = In Progress
```

#### Edge Cases & Error States (FR-07)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| User không có task nào | Empty state với hướng dẫn hành động |
| Task due date = hôm nay | Không phải Overdue, không highlight đỏ |
| Task không có due date | Xuống cuối danh sách |
| API lỗi khi load | Error state + nút Retry |

#### Test Plan (FR-07)

**1. API Tests**

| Test Case | Input | Expected |
|---|---|---|
| GET /api/my-tasks - có tasks | auth user có tasks | 200, chỉ tasks assigned cho user |
| GET /api/my-tasks - không có tasks | user không có task | 200, empty array |
| GET /api/my-tasks - sort order | mix overdue + future | overdue trước, sort due_date asc |
| GET /api/my-tasks?status=TODO | filter status | 200, chỉ tasks status=ToDo |
| GET /api/my-tasks - exclude Done | user có task Done | Done tasks không có trong list |
| GET /api/my-tasks - workspace isolation | user A | chỉ tasks của workspace mình |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| sortMyTasks(tasks) overdue trước, no-date cuối | task.service |
| isOverdue(dueDate) đúng với hôm nay | task.service |
| filterByStatus(tasks, status) đúng | task.service |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Load My Tasks | Đăng nhập > /app/my-tasks | Tasks assigned hiển thị đúng order |
| Overdue highlight | Task due date hôm qua | Badge "Overdue" đỏ, nằm đầu list |
| Filter To Do | Click filter "To Do" | Chỉ hiện task To Do |
| Empty state | User không có task | Icon + text hướng dẫn hiển thị |
| Task card info | Xem task card | Hiển thị: project label, title, StatusBadge + PriorityBadge, assignee (avatar+tên) + due date |

#### Checklist FR-07 ✅ Definition of Done

**Implementation**
- [ ] `GET /api/my-tasks` trả tasks assigned cho user (trừ Done), sorted đúng
- [ ] Filter All / To Do / In Progress hoạt động
- [ ] Task Overdue highlight đỏ + badge "Overdue"
- [ ] Task không có due date xuống cuối danh sách
- [ ] Empty state: icon + text hướng dẫn (không trang trắng — NFR-05)
- [ ] Loading state khi API > 300ms
- [ ] Workspace isolation (chỉ thấy tasks của workspace mình)
- [ ] Task card hiển thị: project label, title, status badge, priority badge, assignee (avatar+tên hoặc "Chưa giao"), due date (icon lịch hoặc ngày)
- [ ] Trang `/app/my-tasks` đúng navigation PRD 12.2

**Tests**
- [ ] Tất cả API Tests pass (6/6)
- [ ] Tất cả Unit Tests pass (3/3)
- [ ] Tất cả E2E Tests pass (5/5)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage my-tasks module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Acceptance Gate FR-07**
- [ ] Member đăng nhập → /app/my-tasks → thấy tasks sorted đúng (overdue trước, no-date cuối) hoạt động end-to-end
- [ ] Filter To Do / In Progress lọc đúng đã verify
- [ ] Tất cả edge cases FR-07 đã handle (empty state, no due date, API error + Retry)
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

### FR-08: Dashboard Team — Kanban Board (P0)

**Mô tả từ PRD:** Manager xem tất cả task trên Kanban board (cột theo status). Filter theo Assignee, Project, Priority, Due date range. Search theo title.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.9`**
> Kanban board 4 cột layout, filter bar inline row (search + 3 dropdowns + date range + refresh + Thêm Task), task count header, column empty state, drag-drop visual states, Member không truy cập → redirect.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.9.

#### NFR áp dụng cho FR-08

| NFR | Yêu cầu |
|-----|---------|
| NFR-01 Performance | API < 500ms, LCP < 2.5s |
| NFR-05 Usability | Đổi status không quá 3 click |
| NFR-06 Accessibility | Keyboard navigation cho Kanban |

#### User Stories & Acceptance Criteria (FR-08)

**US-KANBAN-01: Xem và tương tác Kanban board**

```
Given: Manager vào /app/team
When: Trang load
Then:
  - Hiển thị 4 cột: To Do | In Progress | In Review | Done
  - Mỗi cột hiển thị task count
  - Task card 4 hàng: project label (color dot + name) → title (font-semibold) → StatusBadge + PriorityBadge → assignee (avatar + tên) + due date (góc phải)

Given: Manager kéo task từ "To Do" sang "In Progress"
When: Drop task vào cột mới
Then:
  - Task move ngay (optimistic UI)
  - Status cập nhật qua API, activity log tạo
  - Rollback nếu API lỗi

Given: Manager filter by Assignee
Then:
  - Chỉ hiển thị tasks assigned cho member đó
```

#### Edge Cases & Error States (FR-08)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Member cố truy cập /app/team | Redirect /app/my-tasks hoặc 403 |
| Kanban board không có task | Mỗi cột hiển thị empty state nhỏ |
| Drag-drop API lỗi | Rollback UI, toast error |
| Drag-drop trên mobile | Fallback: click dropdown |
| Search không có kết quả | "Không tìm thấy task nào" |

#### Test Plan (FR-08)

**1. API Tests**

| Test Case | Input | Expected |
|---|---|---|
| GET /api/team/tasks | Manager auth | 200, tất cả tasks workspace |
| GET /api/team/tasks?assignee=userId | filter | 200, chỉ tasks của user |
| GET /api/team/tasks?project=projectId | filter | 200, chỉ tasks của project |
| GET /api/team/tasks?priority=HIGH | filter | 200, chỉ tasks HIGH |
| GET /api/team/tasks?search=keyword | search | 200, tasks có keyword |
| GET /api/team/tasks - Member auth | Member | 403 Forbidden |
| PATCH /api/tasks/:id/status (kanban drag) | new status | 200, activity log tạo |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| groupTasksByStatus(tasks) → 4 columns | board.service |
| applyFilters(tasks, filters) đúng | board.service |
| searchTasks(tasks, keyword) case-insensitive | board.service |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Load Kanban board | Manager > /app/team | 4 cột, tasks phân bổ đúng |
| Drag-drop đổi status | Kéo task sang cột khác | Task move, status cập nhật |
| Filter by assignee | Chọn member | Chỉ hiện tasks của member |
| Search task | Gõ keyword | Tasks filter theo title |
| Permission check | Member truy cập /app/team | Redirect /app/my-tasks |

#### Checklist FR-08 ✅ Definition of Done

**Implementation**
- [ ] `GET /api/tasks/team` (client-side filtering — no API params needed, fetch once)
- [ ] Kanban board 4 cột: To Do / In Progress / In Review / Done
- [ ] Drag-drop (@dnd-kit/core) + optimistic UI + rollback khi API lỗi
- [ ] Filter client-side: Assignee / Project / Priority / Due date range / Search
- [ ] Filter bar single inline row: Search + 3 dropdowns + date range + Refresh + Them Task button
- [ ] Column headers: colored dot + uppercase colored label + plain count (no pill)
- [ ] Member không truy cập /app/team (redirect /app/my-tasks)
- [ ] Mobile fallback: click dropdown đổi status thay vì drag-drop
- [ ] Mỗi cột hiển thị task count
- [ ] Trang `/app/team` đúng navigation PRD 12.2
- [ ] Silent refresh sau drag-drop và tạo task mới
- [ ] + Thêm Task button mở TaskFormSheet slide-over

**Tests**
- [ ] Tất cả API Tests pass (7/7)
- [ ] Tất cả Unit Tests pass (3/3)
- [ ] Tất cả E2E Tests pass (5/5)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage team/kanban module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Acceptance Gate FR-08**
- [ ] Manager xem Kanban board, drag-drop task sang cột khác, activity log ghi đúng hoạt động end-to-end
- [ ] Optimistic UI rollback khi drag-drop API lỗi đã verify
- [ ] Tất cả edge cases FR-08 đã handle (member permission, empty board, mobile fallback)
- [ ] Filter bar inline row khớp mockup đã verify trực tiếp trên browser
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

### FR-11: Báo cáo Team (P1)

**Mô tả từ PRD:** Manager xem Reports: bar chart tasks completed theo tuần (4 tuần gần nhất), bảng completion rate theo member, task overdue theo member.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.11`**
> Reports page layout, bar chart 3-row layout (counts | bars bottom-aligned | labels), bảng member stats (Assigned/Completed/Overdue/Rate), click member → My Tasks read-only, "N/A" khi 0 task.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.11.

#### User Stories & Acceptance Criteria (FR-11)

**US-05: Xem báo cáo team** *(copy từ PRD US-05)*

```
Given: Manager vào trang Reports
When: Trang load
Then:
  - Bar chart "Tasks Completed" theo 4 tuần gần nhất (mỗi tuần 1 cột)
  - Bảng: Member | Assigned | Completed | Overdue | Completion Rate (%)
  - Dữ liệu chỉ tính trong workspace hiện tại

Given: Manager click vào tên thành viên trong bảng
When: Click
Then:
  - My Tasks của thành viên đó (read-only)
  - Manager KHÔNG thể edit, delete, comment
```

#### Edge Cases & Error States (FR-11)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Workspace mới, chưa có data | Chart = 0 tất cả tuần, bảng rỗng có empty state |
| Member không có task | Hiển thị trong bảng, giá trị = 0, Rate = "N/A" |
| Member truy cập /app/reports | 403 Forbidden |
| Chart tuần hiện tại | Tính partial (thứ Hai đến hôm nay) |

#### Test Plan (FR-11)

**1. API Tests**

| Test Case | Input | Expected |
|---|---|---|
| GET /api/reports/weekly-completed | Manager auth | 200, data 4 tuần |
| GET /api/reports/member-stats | Manager auth | 200, bảng stats |
| GET /api/reports - Member auth | Member | 403 Forbidden |
| GET /api/reports - workspace isolation | Manager A | Chỉ data workspace A |
| GET /api/users/:id/tasks (read-only view) | Manager | 200, tasks list |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| getWeeklyCompletedTasks(workspaceId, weeks=4) đúng range | report.service |
| getMemberStats(workspaceId) tính đúng rate | report.service |
| getWeekRange(weekOffset) start/end đúng | report.service |
| completionRate(0, 0) = "N/A" | report.service |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Load Reports | Manager > /app/reports | Bar chart 4 cột, bảng members |
| Bar chart data | Tạo completed tasks | Chart phản ánh đúng |
| Member stats table | Xem bảng | Assigned/Completed/Overdue/Rate đúng |
| Click member name | Manager click tên member | My Tasks read-only mở |
| Read-only view | Manager xem tasks member | Nút edit/delete/comment disabled |
| Permission check | Member > /app/reports | 403 redirect |

#### Checklist FR-11 ✅ Definition of Done

**Implementation**
- [ ] `GET /api/reports/weekly-completed` data 4 tuần gần nhất (bao gồm tuần hiện tại partial)
- [ ] `GET /api/reports/member-stats` bảng stats đúng (Assigned/Completed/Overdue/Rate)
- [ ] `GET /api/reports/member/:id/tasks` danh sách tasks theo member (read-only)
- [ ] Bar chart 4 tuần — 3-row layout (counts | bars bottom-aligned | labels) — không bị lệch
- [ ] Click tên member → My Tasks read-only của member đó
- [ ] Manager KHÔNG được edit/delete/comment trên My Tasks read-only (`readOnly` prop)
- [ ] Member không truy cập được /app/reports (redirect /app/my-tasks)
- [ ] Workspace isolation: chỉ data của workspace hiện tại
- [ ] Empty state khi chưa có data (workspace mới)
- [ ] Member không có task: hiển thị 0 + Rate = "N/A"
- [ ] Trang `/app/reports` đúng navigation PRD 12.2
- [ ] TaskDetailSheet hỗ trợ prop `readOnly` — ẩn edit/delete/comment khi true

**Tests**
- [ ] Tất cả API Tests pass (5/5)
- [ ] Tất cả Unit Tests pass (4/4)
- [ ] Tất cả E2E Tests pass (6/6)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage reports module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Acceptance Gate FR-11**
- [ ] Manager xem Reports → bar chart 4 tuần → bảng stats → click member → My Tasks read-only hoạt động end-to-end
- [ ] Manager không thể edit/delete/comment trên My Tasks read-only đã verify
- [ ] Tất cả edge cases FR-11 đã handle (empty workspace, member 0 task, partial week)
- [ ] Bar chart không bị lệch, bars canh đáy đúng, có divider line giữa bars và labels
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

### FR-13: Thùng Rác — Trash Bin (P1)

**Mô tả từ PRD:** Admin xem danh sách task đã bị soft-delete, khôi phục task trong vòng 30 ngày. Task quá 30 ngày tự động ẩn khỏi list. Trang chỉ Admin truy cập. Backend API đã implement trong FR-04; FR-13 là UI trang `/app/trash` + restore flow.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.13`**
> Table layout (6 cột), countdown format (>= 1 ngày vs < 1 ngày), màu countdown (secondary/warning/destructive), filter dropdown, nút Khôi phục states (normal/loading/disabled+tooltip), skeleton loading, empty state.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.13.

#### NFR áp dụng cho FR-13

| NFR | Yêu cầu |
|-----|---------|
| NFR-03 Security | Chỉ Admin truy cập, workspace isolation |
| NFR-05 Usability | Empty state có hướng dẫn, countdown realtime |
| NFR-07 Data Integrity | Không hard delete từ UI, restore blocked nếu project archived |

#### User Stories & Acceptance Criteria (FR-13)

**US-TRASH-01: Xem danh sách task đã xóa**

```
Given: Admin vào /app/trash
When: Trang load
Then:
  - Hiển thị list tất cả task soft-deleted < 30 ngày trong workspace
  - Mỗi task hiển thị: Tiêu đề, Dự án, Người xóa, Ngày xóa, Còn lại (countdown)
  - Task > 30 ngày KHÔNG xuất hiện trong list
  - Loading skeleton khi API đang fetch

Given: Không có task nào trong trash
When: Trang load
Then:
  - Empty state: icon 🗑️ + "Thùng rác trống" + "Không có task nào đã xóa."
```

**US-TRASH-02: Lọc theo dự án**

```
Given: Admin đang ở /app/trash
When: Chọn project trong dropdown filter
Then:
  - List lọc chỉ hiện task thuộc project đó
  - Filter hiển thị tên project đang chọn
  - "Tất cả" reset filter về full list
```

**US-TRASH-03: Khôi phục task**

```
Given: Admin click nút "Khôi phục" trên task trong trash
When: Confirm
Then:
  - Task được restore: deleted_at = null, quay về project gốc với status cũ
  - Toast success: "Task [Title] đã được khôi phục."
  - Task biến mất khỏi Trash list
  - Activity log ghi "Restored by [Tên Admin] at [timestamp]"

Given: Admin click "Khôi phục" task có project gốc đã archive
When: API call
Then:
  - Nút "Khôi phục" bị disabled + tooltip: "Dự án đã archive. Không thể khôi phục task."
  - Task vẫn nằm trong trash

Given: Task được restore khi assignee đã bị xóa khỏi workspace
When: Restore thành công
Then:
  - assignee_id = null (unassigned)
  - Toast success vẫn hiện, task về project gốc

Given: Manager hoặc Member truy cập /app/trash
When: Vào URL trực tiếp
Then:
  - Redirect về /app/my-tasks
```

#### Edge Cases & Error States (FR-13)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Task > 30 ngày | Không hiện trong list (API filter, không hiện nút restore) |
| Project gốc đã archive | Nút "Khôi phục" disabled + tooltip giải thích |
| Assignee đã bị kick | Restore OK, assignee_id = null |
| Double restore (task đã active) | API 400: "Task không nằm trong trash" |
| Manager/Member truy cập | Redirect /app/my-tasks |
| Network lỗi khi restore | Toast error: "Có lỗi khi khôi phục task. Thử lại?" + nút Retry |
| Trash trống | Empty state với icon + text hướng dẫn |
| Countdown < 1 ngày | Format: "Còn 2 giờ 30 phút" (không hiện "ngày") |

#### Test Plan (FR-13)

**1. API Tests** *(đã có trong FR-04 — chỉ verify lại, không viết mới)*

| Test Case | Input | Expected |
|---|---|---|
| GET /api/tasks/trash — Admin | Admin call | 200, list task < 30 ngày |
| GET /api/tasks/trash — non-Admin | Manager/Member | 403 Forbidden |
| GET /api/tasks/trash?project=xxx | filter param | 200, filtered list |
| GET /api/tasks/trash — task > 30 ngày | expired task | Không xuất hiện trong response |
| POST /api/tasks/:id/restore — happy path | Admin, task < 30 ngày, project active | 200, deleted_at = null |
| POST /api/tasks/:id/restore — archived project | project đã archive | 400, error message |
| POST /api/tasks/:id/restore — assignee kicked | assignee đã rời workspace | 200, assignee_id = null |
| POST /api/tasks/:id/restore — expired | task > 30 ngày | 410 Gone |
| POST /api/tasks/:id/restore — double restore | task đã active | 400, "Task không nằm trong trash" |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| getTrashTimeRemaining(deletedAt) — ngày còn lại | trash.utils |
| getTrashTimeRemaining(deletedAt) — format < 1 ngày | trash.utils |
| isExpiredFromTrash(deletedAt) — > 30 ngày | trash.utils |
| formatTrashCountdown(ms) — "X ngày Y giờ" | trash.utils |
| formatTrashCountdown(ms) — "X giờ Y phút" khi < 1 ngày | trash.utils |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Xem Trash list | Admin → /app/trash | List task đã xóa, đủ thông tin |
| Countdown hiển thị | Load trang | "Còn X ngày Y giờ" hiện đúng |
| Filter theo project | Chọn project trong dropdown | Chỉ hiện task của project đó |
| Restore task thành công | Admin click Khôi phục | Task biến khỏi trash, toast success |
| Restore blocked — archived project | Task project đã archive | Nút disabled, tooltip hiện |
| Restore — assignee kicked | Task assignee đã rời ws | Restore OK, task unassigned |
| Trash empty state | Trash không có task nào | Empty state hiện đúng icon + text |
| Permission check | Manager vào /app/trash | Redirect /app/my-tasks |

#### Checklist FR-13 ✅ Definition of Done

**Implementation**
- [ ] Trang `/app/trash` chỉ Admin truy cập (Manager/Member → redirect `/app/my-tasks`)
- [ ] Gọi `GET /api/tasks/trash` lấy list soft-deleted tasks (< 30 ngày)
- [ ] Table/List hiển thị đủ: Tiêu đề task, Tên dự án, Người xóa, Ngày xóa (dd/mm/yyyy), Còn lại
- [ ] **Countdown "Còn lại":** Tính từ `deleted_at + 30 ngày`. Format:
  - `>= 1 ngày`: "Còn X ngày Y giờ" (cập nhật mỗi phút)
  - `< 1 ngày`: "Còn X giờ Y phút" (cập nhật mỗi phút)
- [ ] Task > 30 ngày tự động ẩn khỏi list (API không trả)
- [ ] Filter dropdown theo project ("Tất cả" | [Tên project])
- [ ] Nút **"Khôi phục"** gọi `POST /api/tasks/:id/restore`:
  - [ ] Thành công → toast success "Task [Title] đã được khôi phục.", task biến khỏi list
  - [ ] Project đã archive → nút **disabled** + tooltip: "Dự án đã archive. Không thể khôi phục task."
  - [ ] Assignee đã bị kick → restore OK, `assignee_id = null`
  - [ ] API lỗi → toast error + nút Retry
- [ ] Empty state: icon 🗑️ + "Thùng rác trống" + "Không có task nào đã xóa."
- [ ] Skeleton loading khi API call > 300ms
- [ ] Workspace isolation: chỉ hiện task của workspace hiện tại
- [ ] Activity log "Restored by" ghi đúng (verify qua API)
- [ ] UI bám sát `design-system.md §7.13`

**Tests**
- [ ] API Tests verify pass (9/9 — tái dùng từ FR-04)
- [ ] Tất cả Unit Tests pass (5/5)
- [ ] Tất cả E2E Tests pass (8/8)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage trash module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Acceptance Gate FR-13**
- [ ] Admin vào `/app/trash` → thấy list task đã xóa với countdown đúng
- [ ] Filter theo project hoạt động
- [ ] Restore task thành công → task quay về project gốc
- [ ] Restore blocked khi project archived → UI disabled + tooltip đúng
- [ ] Manager/Member không truy cập được → redirect
- [ ] Tất cả edge cases FR-13 đã handle và verify
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

### Acceptance Gate M3 ✅

- [ ] My Tasks sort đúng, filter đúng, highlight Overdue
- [ ] Kanban board 4 cột, drag-drop hoạt động
- [ ] Reports bar chart + bảng member stats đúng
- [ ] Manager xem My Tasks member là read-only
- [ ] Team Kanban filter bar inline row khớp mockup (search + 3 dropdowns + date range + refresh + Thêm Task)
- [ ] Bar chart bars canh đáy đúng (3-row layout)
- [ ] Trang Trash `/app/trash` Admin xem được, countdown đúng, restore hoạt động
- [ ] Manager/Member không truy cập Trash (redirect /app/my-tasks)
- [ ] Tất cả tests M3 pass (FR-07 + FR-08 + FR-11 + FR-13)
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

## Milestone M4 — Polish & QA

> **Timeline:** Week 7 | **Acceptance Gate:** QA pass, performance SLA đạt, tất cả edge cases handle.

### FR Coverage: FR-12 + Tất cả NFRs + Edge Cases (PRD Section 10)

> [!IMPORTANT]
> **Quy tắc tuần tự bắt buộc trong M4:**
> Phải thực hiện theo đúng thứ tự sau. Bước trước phải **pass 100%** trước khi bắt đầu bước tiếp theo.
>
> `FR-12 (Global Search)` → `NFR Verification` → `Edge Cases (10.1 Task)` → `Edge Cases (10.2 Auth)` → `Edge Cases (10.3 Network)` → `Browser Compatibility`
>
> **Lý do thứ tự này:** FR-12 implement trước để có đủ feature. NFR verification chạy sau khi codebase ổn định. Edge cases test sau NFR vì cần toàn bộ hệ thống hoạt động để test end-to-end. Browser compat test cuối cùng khi UI đã hoàn thiện.

---

### FR-12: Search toàn cục (P2)

**Mô tả từ PRD:** Thanh search ở header tìm task theo title trên toàn workspace. Kết quả hiển thị ngay khi gõ (debounce 300ms), tối đa 10 kết quả.

> [!IMPORTANT]
> **Đọc trước khi implement UI — `design-system.md §7.12`**
> SearchBar layout (CSS grid 3-cột, center, `clamp(280px, 36vw, 520px)`), SearchDropdown (width match search bar, max 10 items), SearchResultItem (4-dòng mini card, keyword highlight), keyboard navigation (Arrow/Enter/Escape), debounce 300ms.
> AI KHÔNG được tự suy ra UI — mọi chi tiết đã định nghĩa sẵn trong §7.12.

#### User Stories & Acceptance Criteria (FR-12)

**US-SEARCH-01: Search task toàn cục**

```
Given: User gõ keyword vào search bar ở header
When: Gõ ký tự (debounce 300ms)
Then:
  - Kết quả xuất hiện ngay dưới search bar (dropdown)
  - Tối đa 10 kết quả, sort by relevance
  - Mỗi kết quả hiển thị: task title, project name, assignee
  - Chỉ tìm trong workspace hiện tại

Given: Search không có kết quả
When: Không có task nào match keyword
Then:
  - Hiển thị "Không tìm thấy task nào với từ khóa này"

Given: User click vào kết quả
When: Click
Then:
  - Mở task detail (slide-over panel)
  - Search bar đóng
```

#### Edge Cases & Error States (FR-12)

| Tình huống | Hành vi kỳ vọng |
|---|---|
| Keyword < 1 ký tự | Không search, không hiển thị dropdown |
| Keyword có ký tự đặc biệt | Escape properly, không SQL injection |
| Search API chậm > 300ms | Loading spinner trong dropdown |
| Không có kết quả | Empty state "Không tìm thấy task nào" |

#### Test Plan (FR-12)

**1. API Tests**

| Test Case | Input | Expected |
|---|---|---|
| GET /api/search?q=keyword | keyword hợp lệ | 200, max 10 tasks matching |
| GET /api/search?q=keyword - workspace isolation | user A | Chỉ tasks của workspace A |
| GET /api/search?q=sql injection | `'; DROP TABLE` | 200, safe (no SQL injection) |
| GET /api/search?q=x - 1 char | keyword ngắn | 200, empty |
| GET /api/search?q= - empty | rỗng | 200, empty array |

**2. Unit Tests**

| Test Case | Module |
|---|---|
| searchTasks(workspaceId, keyword, limit=10) đúng | search.service |
| escapeSearchInput(keyword) tránh injection | search.service |
| debounce(fn, 300ms) hoạt động đúng | useSearch hook |

**3. E2E Tests**

| Scenario | Steps | Expected |
|---|---|---|
| Search happy path | Gõ keyword vào search bar | Dropdown hiện max 10 kết quả |
| Debounce 300ms | Gõ nhanh "abc" | Chỉ 1 API call sau 300ms |
| Click kết quả | Click task trong dropdown | Slide-over mở task đó |
| Empty result | Gõ keyword không tồn tại | Empty state hiện |
| Workspace isolation | User A search | Không thấy tasks workspace B |

#### Checklist FR-12 ✅ Definition of Done

**Implementation**
- [ ] `GET /api/search?q=keyword` trả max 10 tasks của workspace
- [ ] Debounce 300ms (không spam API khi gõ nhanh)
- [ ] Search box ở header accessible từ mọi trang (max 1 click)
- [ ] Click kết quả → mở slide-over task detail
- [ ] Empty state "Không tìm thấy task nào"
- [ ] Workspace isolation (không lộ data workspace khác)
- [ ] Input sanitization (ngăn SQL injection, XSS)
- [ ] Keyword < 1 ký tự không search
- [ ] Loading spinner trong dropdown khi search chậm > 300ms

**Tests**
- [ ] Tất cả API Tests pass (5/5)
- [ ] Tất cả Unit Tests pass (3/3)
- [ ] Tất cả E2E Tests pass (5/5)
- [ ] `npm test` green, không có failing tests
- [ ] Test coverage search module ≥ 80%
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

**Acceptance Gate FR-12**
- [ ] Gõ keyword → dropdown kết quả hiển thị (debounce 300ms) → click mở task hoạt động end-to-end
- [ ] SQL injection với `'; DROP TABLE` không gây lỗi đã verify
- [ ] Tất cả edge cases FR-12 đã handle (keyword ngắn, empty result, workspace isolation)
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

### NFR Verification Checklist (M4)

#### NFR-01: Performance

| Kiểm tra | Target | Cách test | Status |
|---|---|---|---|
| LCP trang đầu tiên | < 2.5s trên 4G | Lighthouse audit | [ ] |
| API read endpoints (p95) | < 500ms | k6 load test | [ ] |
| API write endpoints (p95) | < 1s | k6 load test | [ ] |
| Search debounce | 300ms | E2E test timing | [ ] |

#### NFR-02: Availability

| Kiểm tra | Target | Cách test | Status |
|---|---|---|---|
| Uptime SLA | ≥ 99.5% | Monitor 7 ngày staging | [ ] |
| Health check endpoint | GET /health → 200 | Automated ping | [ ] |

#### NFR-03: Security

| Kiểm tra | Cách test | Status |
|---|---|---|
| bcrypt cost factor ≥ 12 | Kiểm tra DB hash prefix `$2b$12$` | [ ] |
| HTTPS/TLS | Browser DevTools Network tab | [ ] |
| JWT expiry 7 ngày | Decode token, check exp | [ ] |
| XSS prevention (task title, comment) | Nhập `<script>alert(1)</script>` | [ ] |
| SQL injection (search, filters) | Nhập `'; DROP TABLE tasks;--` | [ ] |
| Rate limiting 100 req/min | Gửi 101 requests, expect 429 | [ ] |
| Row-level isolation | Login user A, access workspace B API | [ ] |
| Password không có trong API response | Inspect bất kỳ API response có user | [ ] |

#### NFR-04: Scalability

| Kiểm tra | Target | Status |
|---|---|---|
| Database indexes trên FK và search fields | `EXPLAIN ANALYZE` query | [ ] |
| Stateless API (không session server-side) | API hoạt động với nhiều instance | [ ] |

#### NFR-05: Usability

| Kiểm tra | Target | Status |
|---|---|---|
| Tạo task không quá 3 click | Count click từ bất kỳ trang nào | [ ] |
| Đổi status không quá 3 click | Count click | [ ] |
| Loading state khi API > 300ms | Throttle network, quan sát spinner | [ ] |
| Empty states có hướng dẫn | Kiểm tra tất cả pages | [ ] |

#### NFR-06: Accessibility

| Kiểm tra | Target | Status |
|---|---|---|
| WCAG 2.1 AA cho core components | Lighthouse Accessibility score ≥ 90 | [ ] |
| Form elements có label | Inspect DOM | [ ] |
| Keyboard navigation Kanban board | Tab + Enter để di chuyển | [ ] |

#### NFR-07: Data Integrity

| Kiểm tra | Target | Status |
|---|---|---|
| Soft delete (deleted_at) | Task xóa không mất trong DB | [ ] |
| Activity log không xóa được | API DELETE /activity trả 404/405 | [ ] |
| Restore task trong 30 ngày | Admin restore soft-deleted task | [ ] |

#### NFR-08: Browser Support

| Browser | Version | Status |
|---|---|---|
| Chrome | ≥ 110 | [ ] |
| Firefox | ≥ 110 | [ ] |
| Safari | ≥ 16 | [ ] |
| Edge | ≥ 110 | [ ] |

---

### Edge Cases Verification (PRD Section 10)

#### 10.1 Task Management

| Edge Case | File xử lý | Test | Status |
|---|---|---|---|
| Assignee bị xóa → "[Removed User]" | task.service | API test | [ ] |
| Archive project + task cũ vẫn update được | project.service | E2E test | [ ] |
| 2 user edit cùng lúc → last-write-wins + log | task.service | API test (race condition) | [ ] |
| Due date quá khứ → badge "Overdue" ngay | task.service | Unit test + E2E | [ ] |
| Task title `<script>` → sanitize | task.service | API test | [ ] |
| Member tự xóa chính mình | member.service | API test (403) | [ ] |

#### 10.2 Authentication & Session

| Edge Case | File xử lý | Test | Status |
|---|---|---|---|
| Token hết hạn → intercept 401 → redirect login | auth middleware | E2E test | [ ] |
| Sai password 5 lần → lock 15 phút + countdown | auth.service | API test | [ ] |
| 2 tab logout → storage event → tab còn lại redirect | auth store | E2E test (2 tabs) | [ ] |
| Email đã tồn tại khi register | auth.service | API test | [ ] |

#### 10.3 Network & Performance

| Edge Case | File xử lý | Test | Status |
|---|---|---|---|
| API 500/timeout → toast "Thử lại?" + nút Retry | api client | E2E test (mock 500) | [ ] |
| Mất internet → banner "Bạn đang offline" | network detector | E2E test (offline mode) | [ ] |
| Upload ảnh > 5MB → lỗi trước khi upload | file handler | Unit test | [ ] |
| Empty response (lỗi quyền) → "Không có quyền truy cập" | API client | E2E test | [ ] |

---

### Acceptance Gate M4

- [ ] FR-12 Search toàn cục hoạt động
- [ ] Tất cả NFR tests pass (Performance, Security, Accessibility, Browser)
- [ ] Tất cả Edge Cases (10.1, 10.2, 10.3) đã handle và verify
- [ ] `npm test` green — không có failing tests
- [ ] Lighthouse Performance score ≥ 80
- [ ] Lighthouse Accessibility score ≥ 90
- [ ] Không có blocker Severity 1 hoặc 2 (PRD 3.3)
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

## Milestone M5 — Deploy MVP

> **Timeline:** Week 8 | **Acceptance Gate:** Stakeholder sign-off ✅

### Pre-Deploy Checklist

- [ ] Tất cả FR-01 → FR-12 pass QA
- [ ] `npm test` green
- [ ] `.env.example` đủ variables, không chứa giá trị thật
- [ ] `.gitignore` đúng (node_modules, .env, .next, .vercel)
- [ ] `npx prisma migrate deploy` chạy clean trên production DB
- [ ] README.md có hướng dẫn setup cho developer mới
- [ ] Sentry error tracking cài và test gửi sample error
- [ ] CI/CD pipeline chạy lint + test trên PR
- [ ] Không có Severity 1-2 blockers

### Deploy Checklist

- [ ] Backend deploy lên Railway (Node.js + PostgreSQL)
- [ ] Frontend deploy lên Vercel (Next.js)
- [ ] Environment variables set đúng trên Railway + Vercel
- [ ] Database migration chạy thành công
- [ ] Health check endpoint `/health` trả 200

### Post-Deploy Smoke Test

- [ ] Đăng ký tài khoản mới → đăng nhập thành công
- [ ] Invite member qua email → accept invite
- [ ] Tạo project → tạo task → assign cho member
- [ ] Member đổi status task
- [ ] Comment + @mention → notification nhận được
- [ ] Kanban board drag-drop hoạt động
- [ ] Reports hiển thị data đúng
- [ ] Search toàn cục trả kết quả đúng

### Acceptance Gate M5

- [ ] Production deployment hoạt động ổn định
- [ ] Smoke test pass tất cả (9/9)
- [ ] Stakeholder demo thành công
- [ ] PM + Tech Lead + User đại diện sign-off ✅
- [ ] Uptime ≥ 99% trong 24h sau deploy
- [ ] Tự động mở trình duyệt kiểm tra UI các chức năng, đảm bảo không có lỗi cú pháp hay thiếu module

---

> **Tổng kết Milestones:**
> - M0 (W1): Setup + FR-01 Auth
> - M1 (W2-3): FR-02 + FR-03 + FR-04 + FR-05 Core CRUD
> - M2 (W4): FR-06 + FR-09 + FR-10 Collaboration
> - M3 (W5-6): FR-07 + FR-08 + FR-11 + FR-13 Dashboards & Trash
> - M4 (W7): FR-12 + All NFRs + Edge Cases Polish & QA
> - M5 (W8): Production Deploy + Stakeholder Sign-off

---

### Operational Notes cho AI Agents

- **Ports**: Chạy `npm run dev` ở thư mục gốc (root) sẽ tự động bật Frontend (Next.js) ở port `3000` và Backend (Express) ở port `3001` qua `concurrently`.
- **Prisma**: Bắt buộc sử dụng `@prisma/client` và `prisma` version `^5.21.1`. Tuyệt đối không dùng Prisma v7 do v7 có breaking changes yêu cầu adapter thay vì truyền `DATABASE_URL` trực tiếp. Mọi lệnh migration cần tuân thủ v5.x.
- **Biến môi trường**: Đảm bảo `BREVO_API_KEY` và `BREVO_SENDER_EMAIL` đã được người dùng điền đầy đủ và `BREVO_SENDER_EMAIL` là email thực đã được xác thực trên Brevo để tránh lỗi gửi email invite.
