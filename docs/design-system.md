# TaskFlow — Design System

> **Phiên bản:** v1.0 | **Ngày:** 2026-04-25
> **Nguồn truth:** `requirements.md` (hành vi/UI) + `task.md` (milestone, state, edge case).
> **Phạm vi:** Design tokens, layout, component library, interaction patterns, role-based UI, responsive, accessibility, content guidelines, codebase mapping.
> **Ngoài phạm vi:** API spec chi tiết, DB schema, deployment — xem `requirements.md`.

---

## Mục lục

1. [Mục tiêu hệ thống thiết kế](#1-mục-tiêu-hệ-thống-thiết-kế)
2. [Nền tảng thị giác](#2-nền-tảng-thị-giác)
3. [App Shell và điều hướng](#3-app-shell-và-điều-hướng)
4. [Core UI Components](#4-core-ui-components)
5. [Pattern biểu mẫu](#5-pattern-biểu-mẫu)
6. [Pattern trạng thái chung](#6-pattern-trạng-thái-chung)
7. [Thiết kế theo Feature](#7-thiết-kế-theo-feature)
8. [Ma trận quyền và hành vi UI](#8-ma-trận-quyền-và-hành-vi-ui)
9. [Responsive và Accessibility](#9-responsive-và-accessibility)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Content Guidelines và Microcopy](#11-content-guidelines-và-microcopy)
12. [Mapping sang Codebase Frontend](#12-mapping-sang-codebase-frontend)

---

## 1. Mục tiêu hệ thống thiết kế

### 1.1 Mục tiêu

| Mục tiêu | Mô tả |
|-----------|--------|
| **Đồng nhất UI** | Mọi màn hình dùng chung tokens, components, patterns — không có sai khác giữa các feature |
| **Tăng tốc implement** | Developer đọc doc này → biết ngay cần dùng component nào, variant nào, text nào |
| **Giảm rework** | Mọi trạng thái (loading, empty, error, permission, mobile) được định nghĩa trước — không ai phải đoán |
| **Chuẩn hóa cho AI Agent** | Agent đọc file này để biết chính xác UI cần render cho từng FR, edge case, role |

### 1.2 Nguyên tắc sản phẩm

| Nguyên tắc | Giải thích |
|-------------|------------|
| **Speed first** | Mọi action quan trọng ≤ 3 click. Tạo task từ bất kỳ trang nào — max 3 click. Đổi status — max 3 click |
| **Clarity over features** | Khi trade-off → ưu tiên rõ ràng hơn nhiều tính năng. UI text phải dễ hiểu ngay lần đầu |
| **Progressive disclosure** | Advanced settings, filters, bulk actions — ẩn đi cho đến khi cần. Không overwhelm user mới |

### 1.3 Quy ước bắt buộc (từ requirements.md)

| Quy ước | Chi tiết |
|---------|----------|
| **UI text bằng tiếng Việt** | Tất cả label, placeholder, toast, error message, empty state — tiếng Việt |
| **Loading state** | Hiển thị skeleton/spinner khi API call > 300ms |
| **Empty state** | PHẢI có icon + text hướng dẫn hành động — KHÔNG BAO GIỜ để trang trắng |
| **Toast notifications** | Auto-dismiss sau 4 giây. Success = xanh, Error = đỏ, Info = xanh dương |
| **Task detail** | Mở bằng slide-over panel từ phải — KHÔNG navigate ra trang mới |
| **Optimistic UI** | Áp dụng cho status changes. Update UI ngay → rollback nếu API lỗi |
| **Form validation** | React Hook Form + Zod. Validate client-side trước, hiển thị lỗi inline tiếng Việt |

---

## 2. Nền tảng thị giác

> **Stack:** shadcn/ui + Tailwind CSS. Dùng CSS custom properties cho semantic tokens.

### 2.1 Color Tokens

#### Semantic Colors (CSS Variables)

```css
:root {
  /* --- Background & Surface --- */
  --background:        hsl(0 0% 100%);        /* Nền chính */
  --surface:           hsl(210 20% 98%);       /* Card, panel */
  --surface-hover:     hsl(210 20% 96%);       /* Hover state */
  --surface-active:    hsl(210 20% 94%);       /* Active/pressed */

  /* --- Text --- */
  --text-primary:      hsl(222 47% 11%);       /* Heading, body chính */
  --text-secondary:    hsl(215 16% 47%);       /* Label, caption */
  --text-muted:        hsl(215 16% 65%);       /* Placeholder, helper */
  --text-inverse:      hsl(0 0% 100%);         /* Text trên nền tối */

  /* --- Border --- */
  --border:            hsl(214 32% 91%);       /* Border mặc định */
  --border-focus:      hsl(221 83% 53%);       /* Focus ring */

  /* --- Primary (Brand) --- */
  --primary:           hsl(221 83% 53%);       /* Nút chính, link active */
  --primary-hover:     hsl(221 83% 47%);       /* Hover */
  --primary-foreground: hsl(0 0% 100%);        /* Text trên primary */

  /* --- Semantic States --- */
  --success:           hsl(142 71% 45%);       /* Thành công */
  --success-bg:        hsl(142 76% 96%);       /* Background success */
  --warning:           hsl(38 92% 50%);        /* Cảnh báo */
  --warning-bg:        hsl(48 96% 95%);        /* Background warning */
  --destructive:       hsl(0 84% 60%);         /* Xóa, lỗi, nguy hiểm */
  --destructive-bg:    hsl(0 86% 97%);         /* Background destructive */
  --info:              hsl(199 89% 48%);       /* Thông tin */
  --info-bg:           hsl(199 95% 96%);       /* Background info */
  --muted:             hsl(210 40% 96%);       /* Muted background */
  --muted-foreground:  hsl(215 16% 47%);       /* Muted text */
}

.dark {
  --background:        hsl(222 47% 11%);
  --surface:           hsl(217 33% 17%);
  --surface-hover:     hsl(217 33% 20%);
  --text-primary:      hsl(210 40% 98%);
  --text-secondary:    hsl(215 20% 65%);
  --border:            hsl(217 33% 25%);
  /* ...tương tự các token khác */
}
```

#### Status Colors (Task Status)

| Status | CSS Variable | Giá trị | Dùng cho |
|--------|-------------|---------|----------|
| `ToDo` | `--status-todo` | `hsl(215 16% 47%)` — Xám | Badge, cột Kanban header, dot indicator |
| `InProgress` | `--status-in-progress` | `hsl(221 83% 53%)` — Xanh dương | Badge, cột Kanban header |
| `InReview` | `--status-in-review` | `hsl(38 92% 50%)` — Vàng cam | Badge, cột Kanban header |
| `Done` | `--status-done` | `hsl(142 71% 45%)` — Xanh lá | Badge, cột Kanban header |

#### Priority Colors

| Priority | CSS Variable | Giá trị | Dùng cho |
|----------|-------------|---------|----------|
| `Low` | `--priority-low` | `hsl(215 16% 65%)` — Xám nhạt | PriorityBadge |
| `Medium` | `--priority-medium` | `hsl(199 89% 48%)` — Xanh dương nhạt | PriorityBadge |
| `High` | `--priority-high` | `hsl(38 92% 50%)` — Cam | PriorityBadge |
| `Urgent` | `--priority-urgent` | `hsl(0 84% 60%)` — Đỏ | PriorityBadge, kèm icon ⚡ |

#### Trạng thái đặc biệt

| Trạng thái | Màu/Style | Dùng ở đâu |
|------------|-----------|------------|
| **Overdue** | `--destructive` (đỏ) + icon clock | Task card, My Tasks list, badge |
| **Archived** | `--muted` xám + icon archive | Project card, badge "Archived" |
| **Pending invite** | `--warning` vàng cam | Member list badge "Pending" |
| **Unread notification** | `--primary` dot xanh | Notification item, bell badge |
| **Disabled** | `opacity: 0.5` + `cursor: not-allowed` | Nút bị vô hiệu hóa |
| **Forbidden** | Ẩn hoàn toàn hoặc disabled + tooltip | Action không có quyền |
| **Read-only** | Không có edit controls, chỉ hiển thị data | Manager xem My Tasks member |

### 2.2 Typography

> **Font:** Inter (Google Fonts) — fallback: `system-ui, -apple-system, sans-serif`

| Token | Size | Weight | Line Height | Dùng cho |
|-------|------|--------|-------------|----------|
| `heading-1` | 24px / 1.5rem | 700 (Bold) | 1.33 | Page title (h1) — mỗi trang chỉ có 1 |
| `heading-2` | 20px / 1.25rem | 600 (Semibold) | 1.4 | Section title (h2) |
| `heading-3` | 16px / 1rem | 600 (Semibold) | 1.5 | Card title, modal title |
| `body` | 14px / 0.875rem | 400 (Regular) | 1.57 | Body text, paragraph, comment |
| `body-medium` | 14px / 0.875rem | 500 (Medium) | 1.57 | Label nổi bật, nav item active |
| `caption` | 12px / 0.75rem | 400 (Regular) | 1.5 | Timestamp, helper text, badge text |
| `label` | 14px / 0.875rem | 500 (Medium) | 1.43 | Form label |
| `helper` | 12px / 0.75rem | 400 (Regular) | 1.5 | Form helper/error text |
| `overline` | 11px / 0.6875rem | 600 (Semibold) | 1.45 | Kanban column header, section label |

### 2.3 Spacing Scale

> Base unit: 4px. Dùng Tailwind spacing utilities.

| Token | Value | Tailwind | Dùng cho |
|-------|-------|----------|----------|
| `space-0` | 0px | `p-0` | Reset |
| `space-1` | 4px | `p-1` | Inline gap nhỏ (icon-text) |
| `space-2` | 8px | `p-2` | Badge padding, gap nhỏ |
| `space-3` | 12px | `p-3` | Card padding compact |
| `space-4` | 16px | `p-4` | Card padding chuẩn, form gap |
| `space-5` | 20px | `p-5` | Section gap |
| `space-6` | 24px | `p-6` | Page padding, card padding lớn |
| `space-8` | 32px | `p-8` | Section separation |
| `space-10` | 40px | `p-10` | Page margin lớn |
| `space-12` | 48px | `p-12` | Auth page centering |

### 2.4 Border Radius

| Token | Value | Tailwind | Dùng cho |
|-------|-------|----------|----------|
| `radius-sm` | 4px | `rounded-sm` | Badge, small chip |
| `radius-md` | 6px | `rounded-md` | Input, button, card |
| `radius-lg` | 8px | `rounded-lg` | Modal, dropdown, sheet |
| `radius-xl` | 12px | `rounded-xl` | Dialog, large card |
| `radius-full` | 9999px | `rounded-full` | Avatar, dot indicator |

### 2.5 Shadow

| Token | Value | Dùng cho |
|-------|-------|----------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Card nhẹ, input focus |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Dropdown, popover |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modal, dialog |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Slide-over panel |

### 2.6 Icon

| Token | Size | Dùng cho |
|-------|------|----------|
| `icon-xs` | 12px | Inline indicator (dot) |
| `icon-sm` | 16px | Badge icon, caption icon |
| `icon-md` | 20px | Button icon, nav icon, form icon |
| `icon-lg` | 24px | Header icon, empty state |
| `icon-xl` | 40px | Empty state illustration |
| `icon-2xl` | 64px | Empty state large illustration |

> Icon library: **Lucide React** (tích hợp sẵn trong shadcn/ui)

### 2.7 Z-Index Scale

| Token | Value | Dùng cho |
|-------|-------|----------|
| `z-base` | 0 | Content cơ bản |
| `z-dropdown` | 50 | Dropdown menu, popover, autocomplete |
| `z-sticky` | 100 | Sticky header, sidebar |
| `z-overlay` | 200 | Overlay backdrop |
| `z-modal` | 300 | Dialog, confirm dialog |
| `z-sheet` | 400 | Slide-over panel (task detail) |
| `z-toast` | 500 | Toast notification |
| `z-tooltip` | 600 | Tooltip |

### 2.8 Motion / Animation

| Token | Duration | Easing | Dùng cho |
|-------|----------|--------|----------|
| `duration-fast` | 100ms | `ease-out` | Hover state, active press |
| `duration-normal` | 200ms | `ease-in-out` | Dropdown open/close, fade |
| `duration-slow` | 300ms | `ease-in-out` | Slide-over enter/exit, modal |
| `duration-debounce` | 300ms | — | Search input debounce |
| `duration-toast` | 4000ms | — | Toast auto-dismiss |

> **Quy tắc:** Mọi transition dùng `transition-all` + duration tương ứng. Không dùng animation nặng trên mobile.

### 2.9 Breakpoints

| Token | Width | Dùng cho |
|-------|-------|----------|
| `mobile` | ≥ 375px | Layout mặc định (mobile-first) |
| `tablet` | ≥ 768px | Sidebar collapse/expand |
| `desktop` | ≥ 1024px | Full layout: sidebar + main + panel |
| `wide` | ≥ 1280px | Kanban board mở rộng |

#### Responsive Rules tổng quát

| Element | Mobile (< 768px) | Tablet (768–1023px) | Desktop (≥ 1024px) |
|---------|-------------------|---------------------|---------------------|
| **Sidebar** | Ẩn, mở bằng hamburger menu | Collapsed (icon only) | Expanded (icon + text) |
| **Kanban board** | Horizontal scroll, 1 cột visible | 2 cột visible | 4 cột full |
| **Slide-over** | Full-screen | 480px width | 480px width |
| **Search bar (header)** | Ẩn (`hidden sm:flex`) | `clamp(280px, 36vw, 520px)` | `clamp(280px, 36vw, 520px)` — tối đa 520px |
| **Search dropdown** | Full-width | match search bar width | match search bar width |
| **Data table** | Horizontal scroll | Full | Full |
| **Filter bar** | Collapsible chip | Inline chip | Inline chip |
| **Notification dropdown** | Full-width | 380px fixed | 380px fixed |

---

## 3. App Shell và điều hướng

### 3.1 Cấu trúc Layout

#### Auth Layout (Public)

Dùng cho: `/login`, `/register`, `/invite?token=xxx`

```
┌─────────────────────────────────────────┐
│              Auth Layout                │
│  ┌─────────────────────────────────┐    │
│  │       Logo + App Name           │    │
│  │     (centered, max-w-400px)     │    │
│  │                                 │    │
│  │     ┌─────────────────────┐     │    │
│  │     │    Auth Form Card   │     │    │
│  │     │    (login/register) │     │    │
│  │     └─────────────────────┘     │    │
│  │                                 │    │
│  │     Footer link (toggle)        │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- Background: `--surface` hoặc gradient nhẹ
- Form card: `max-w-[400px]`, centered cả ngang lẫn dọc
- Logo ở trên form, footer link ở dưới ("Đã có tài khoản? Đăng nhập" / "Chưa có tài khoản? Đăng ký")

#### App Layout (Protected)

Dùng cho: Tất cả route `/app/*`

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Header                                       │
│          │  [Page Title]        [Search] [🔔 3] [Avatar] │
│          ├──────────────────────────────────────────────┤
│ Sidebar  │                                               │
│          │  Main Content Area                            │
│ [WS]     │                                               │
│ [Nav]    │  ┌─────────────────┐  ┌────────────────────┐  │
│ [Items]  │  │  Content         │  │  Slide-over Panel │  │
│          │  │  (page content)  │  │  (task detail)     │  │
│          │  │                  │  │  width: 480px      │  │
│          │  └─────────────────┘  └────────────────────┘  │
│          │                                               │
└──────────┴──────────────────────────────────────────────┘
```

- Sidebar: `width: 256px` (expanded) / `64px` (collapsed) / hidden (mobile)
- Header: `height: 56px`, sticky top, z-index: `z-sticky`
- Main content: `flex-1`, padding `p-6`, scrollable
- **Page content wrapper**: `w-full` — **KHÔNG dùng `max-w-*xl mx-auto`** ở outer wrapper. Content phải scale đầy đủ theo màn hình. Chỉ cho phép `max-w-*` ở element con cụ thể (ví dụ: `max-w-sm` cho đoạn text empty state, `max-w-2xl` cho form settings đơn lẻ).
- Slide-over: overlay từ phải, `width: 480px` (desktop) / full-screen (mobile)

### 3.2 Sidebar

#### Cấu trúc Sidebar

```
┌──────────────────────┐
│ [] Tên workspace ▾    │  ← Chỉ hiện 1 dòng, bấm mở dropdown
├──────────────────────┤
│ [+ Tạo task]         │  ← Nút primary (Admin, Manager)
├──────────────────────┤
│ 📋 Công việc của tôi │  ← /app/my-tasks     (All roles)
│ 👥 Kanban Team       │  ← /app/team         (Admin, Manager)
│ 📁 Dự án            │  ← /app/projects     (All roles)
│ 📊 Báo cáo          │  ← /app/reports      (Admin, Manager)
├──────────────────────┤
│ ⚙️ Cài đặt           │  ← /app/settings          (Admin only)
│ 👥 Thành viên        │  ← /app/settings/members  (Admin only)
│ 🗑️ Thùng rác         │  ← /app/trash             (Admin only)
└──────────────────────┘
```

Khi bấm vào Workspace Switcher, dropdown mở ra (float bên trên sidebar, không đẩy nội dung xuống):

```
┌──────────────────────┐
│ [] Tên workspace ▴    │  ← Chevron đổi hướng (lên)
└──────────────────────┘
┌──────────────────────┐  ┌────────────────────────────┐
│                      │  │ ✔ Tên workspace   [Admin] │  ← Active (check + highlight)
│ Nav items ...        │  │   Workspace khác  [Member]│  ← Inactive
│                      │  ├────────────────────────────┤
│                      │  │ + Tạo workspace mới          │  ← Footer
└──────────────────────┘  └────────────────────────────┘
```

#### Workspace Switcher (trong Sidebar)

| Thành phần | Mô tả |
|------------|--------|
| **Trigger (collapsed)** | **1 dòng duy nhất** hiển thị trong sidebar: icon workspace (square grid `16px`) + **tên workspace đang active** (truncate, `font-medium`) + chevron-down. **Không hiện danh sách cho đến khi bấm.** |
| **Dropdown (expanded)** | Panel float bên ngoài sidebar (không đẩy nav items xuống), `min-w-[220px]`, `shadow-md`, `rounded-lg`, `z-dropdown` (50). Mở ngay bên dưới trigger |
| **Mỗi item** | Tên workspace (truncate) + `RoleBadge` (Admin/Manager/Member) |
| **Active item** | Check icon ✔ bên trái + background `--primary/10` + text `--primary` |
| **Chevron** | Quay lên (`▴`) khi mở, quay xuống (`▾`) khi đóng. Transition `duration-normal` |
| **Footer dropdown** | Nút **"Tạo workspace mới"** (icon Plus + text, không có "+" thừa), có separator bên trên |
| **Đóng dropdown** | Click ra ngoài hoặc chọn workspace |
| **Switch action** | Cập nhật `currentWorkspaceId` (Zustand + localStorage) → reload toàn bộ data → set `x-workspace-id` header → **navigate `/app/my-tasks`** của workspace mới → **toast success** `"Đã chuyển sang workspace \"[tên]\""` (bottom-right, duration 2.5s) |

#### Role-aware Sidebar Visibility

| Nav Item | Admin | Manager | Member |
|----------|:-----:|:-------:|:------:|
| **Nút "+ Tạo task"** | ✅ | ✅ | ❌ Ẩn |
| Công việc của tôi | ✅ | ✅ | ✅ |
| Kanban Team | ✅ | ✅ | ❌ Ẩn |
| Dự án | ✅ | ✅ | ✅ |
| Báo cáo | ✅ | ✅ | ❌ Ẩn |
| Cài đặt | ✅ | ❌ Ẩn | ❌ Ẩn |
| Thành viên | ✅ | ❌ Ẩn | ❌ Ẩn |
| Thùng rác | ✅ | ❌ Ẩn | ❌ Ẩn |

> **Quy tắc:** Nav item không có quyền → **ẩn hoàn toàn** (không hiển thị disabled).

#### Sidebar Layout — Quy tắc vị trí

| Quy tắc | Chi tiết |
|---------|----------|
| **CSS layout** | `display: flex; flex-direction: column; height: 100%` — sidebar là flex column chiếm toàn bộ chiều cao |
| **Nav items flow** | Tất cả nav items (chính + admin) flow tự nhiên từ trên xuống, **không** dùng `position: absolute` hay `margin-top: auto` |
| **Separator** | `border-top: 1px solid var(--border)` đặt **ngay trên** Cài đặt — chỉ 1 dòng kẻ mỏng, không có padding lớn |
| **Thứ tự nhóm dưới** | Cài đặt → Thành viên → Thùng rác (Admin only). Ba item này nằm **ngay sau** Báo cáo, chỉ cách 1 dòng kẻ |
| **User info block** | Nằm ở **đáy sidebar**. Dùng `<div style="flex: 1" />` spacer giữa nav và user block để đẩy user block xuống |
| **Không có khoảng trắng lớn** | Giữa Thùng rác và user block chỉ có flex spacer tự nhiên — không thêm margin/padding thừa |

### 3.3 Header

```
┌──────────────────────────────────────────────────────────────────────┐
│ [🔷 TaskFlow]         [🔍 Tìm kiếm task...     ⌘K]    [🔔] [👤 Tên] │
│  ← Left 1fr               ← Center auto →              ← Right 1fr  │
└──────────────────────────────────────────────────────────────────────┘
```

> **Layout:** CSS Grid 3 cột `grid-cols-[1fr_auto_1fr]` — đảm bảo search bar **luôn nằm chính giữa** header bất kể nội dung hai bên.

| Thành phần | Mô tả |
|------------|--------|
| **Hamburger** (mobile) | Chỉ hiển thị < 768px (cùng cột Left), toggle sidebar overlay |
| **Logo + Tên app** | Cột Left (`1fr`), căn trái. Gồm icon logo (SVG hoặc emoji ⚡ thương hiệu, `24px`) + chữ **"TaskFlow"** (`font-semibold`, `text-primary`). **Không dùng page title/breadcrumb ở vị trí này.** Click logo → navigate về `/app/my-tasks` |
| **Search Box** | Cột Center (`auto`). Width responsive: `clamp(280px, 36vw, 520px)`. Icon 🔍 bên trái, placeholder "Tìm kiếm task...", badge **⌘K** bên phải (ẩn trên mobile). Hover: border đổi `primary/40`, icon đổi màu primary. Click mở `SearchDropdown` |
| **Notification Bell** | Cột Right (`1fr`), căn phải. Icon bell + `NotificationBadge` counter (số hoặc "99+"), click mở `NotificationDropdown` |
| **User Avatar + Tên** | Cùng cột Right, cạnh Notification Bell. Gồm Avatar (32px, initials khi không có ảnh) + **tên đầy đủ** của user (ẩn trên mobile `hidden sm:inline`). Toàn bộ vùng này là một **nút bấm** (`button` hoặc `DropdownMenuTrigger`). Click mở `UserDropdown` |

#### User Dropdown (bấm vào Avatar + Tên)

```
┌─────────────────────────────┐
│  Nguyễn Văn A               │  ← Tên đầy đủ (font-medium)
│  user@email.com             │  ← Email (text-muted, caption)
├─────────────────────────────┤
│  🚪  Đăng xuất              │  ← text-destructive, click → logout
└─────────────────────────────┘
```

| Item | Mô tả |
|------|--------|
| **Header block** | Tên user (`font-medium`) + Email (`text-xs text-muted`). Không phải nút, chỉ hiển thị thông tin |
| **Divider** | `<DropdownMenuSeparator />` |
| **Đăng xuất** | Icon `LogOut` + label **"Đăng xuất"**. `text-destructive`. Click → xóa token/session → redirect `/login` + toast info "Đã đăng xuất." |

#### Page Title Mapping

> **Lưu ý:** Page title không còn hiển thị trong Header. Thay vào đó, mỗi trang tự render `<h1>` (heading-1) ở đầu vùng **Main Content** tương ứng với route.

| Route | Page Title (h1 trong Main Content) |
|-------|-------------------------------------|
| `/app/my-tasks` | Công việc của tôi |
| `/app/team` | Kanban Team |
| `/app/projects` | Dự án |
| `/app/projects/:id` | [Tên project] |
| `/app/reports` | Báo cáo |
| `/app/settings` | Cài đặt Workspace |
| `/app/settings/members` | Quản lý thành viên |
| `/app/trash` | Thùng rác |

### 3.4 Route và Redirect Rules

| Tình huống | Hành vi |
|------------|---------|
| Chưa đăng nhập, truy cập `/app/*` | Redirect → `/login` |
| Token hết hạn (API 401) | Intercept → redirect `/login` + toast "Phiên làm việc đã hết hạn." |
| Đăng ký xong (register) | Redirect → trang Tạo Workspace (onboarding) |
| Đăng nhập, chưa có workspace | Redirect → trang Tạo Workspace |
| Đăng nhập, có workspace | Redirect → `/app/my-tasks` |
| Bị xóa khỏi workspace đang active (API 403) | Auto-switch sang workspace khác (nếu còn) + toast "Bạn đã bị xóa khỏi workspace [name]." |
| Bị xóa khỏi workspace duy nhất | Redirect → trang Tạo Workspace |
| Member truy cập `/app/team` | Redirect → `/app/my-tasks` |
| Member truy cập `/app/reports` | Redirect → `/app/my-tasks` |
| Member truy cập `/app/settings` | Redirect → `/app/my-tasks` |
| Member truy cập `/app/trash` | Redirect → `/app/my-tasks` |
| Logout tab 1 → tab 2 | Tab 2 detect qua `storage` event → redirect `/login` |

---

## 4. Core UI Components

> Tất cả component dựa trên **shadcn/ui**. Dưới đây định nghĩa: mục đích, variants, sizes, states, icon usage, text rules, và khi nào dùng.

### 4.1 Button

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Trigger action (submit, navigate, delete, cancel) |
| **Variants** | `primary` (filled), `secondary` (outlined), `ghost` (transparent), `destructive` (đỏ), `link` (text only) |
| **Sizes** | `sm` (h-8, text-xs), `md` (h-10, text-sm), `lg` (h-12, text-base), `icon` (h-10 w-10, chỉ icon) |
| **States** | `default`, `hover` (darker), `active` (pressed), `focus` (ring), `disabled` (opacity-50, cursor-not-allowed), `loading` (spinner thay text) |
| **Icon** | Icon bên trái text (gap-2), hoặc icon-only (variant `icon`) |
| **Text rule** | Tiếng Việt, ngắn gọn, động từ hành động: "Tạo mới", "Lưu", "Xóa", "Hủy" |
| **Loading** | Khi submit form, nút hiển thị spinner + text "Đang xử lý..." hoặc disable |

**Khi nào dùng:**
- `primary`: CTA chính — "Tạo task", "Lưu thay đổi", "Gửi lời mời"
- `secondary`: Action phụ — "Hủy", "Bộ lọc"
- `ghost`: Toolbar action, icon button
- `destructive`: "Xóa workspace", "Xóa task", "Xóa thành viên"
- `link`: Navigation inline — "Đăng nhập", "Xem tất cả"

### 4.2 Input

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Nhập text đơn dòng |
| **Variants** | `default`, `error` (border đỏ), `disabled` |
| **States** | `default` (border nhạt), `focus` (ring primary), `error` (border destructive + helper text đỏ), `disabled` (opacity-50) |
| **Label** | Luôn có, phía trên input, font `label` |
| **Helper text** | Phía dưới input, font `helper`, màu `text-muted` hoặc `destructive` khi lỗi |
| **Placeholder** | Tiếng Việt, ví dụ: "Nhập email của bạn", "Tên workspace" |
| **Icon** | Optional, bên trái trong input (search icon, email icon) |

### 4.3 Password Input

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Nhập mật khẩu với toggle hiển thị |
| **Thêm so với Input** | Nút eye icon bên phải toggle show/hide password |
| **Validation** | Min 8 ký tự. Helper text: "Mật khẩu phải có ít nhất 8 ký tự" |

### 4.4 Textarea

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Nhập text đa dòng (mô tả task, comment) |
| **Max length** | Task description: 5000 chars. Hiển thị character count khi gần limit |
| **States** | Giống Input |
| **Auto-resize** | Tự mở rộng chiều cao theo nội dung (min 3 rows, max 10 rows) |

### 4.5 Select / Combobox

| Thuộc tính | Chi tiết |
|------------|----------|
| **Select** | Dropdown chọn 1 giá trị — dùng cho: Priority, Status, Role, Project |
| **Combobox** | Select + search (không áp dụng cho Assignee, Assignee dùng Dropdown list thường) |
| **States** | `default`, `open`, `focus`, `disabled`, `error` |
| **Empty state** | "Không có kết quả" khi search không match |

### 4.6 Date Picker

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Chọn due date cho task |
| **Cho phép** | Ngày quá khứ (hiển thị "Overdue" ngay khi chọn) |
| **Format hiển thị** | `DD/MM/YYYY` — ví dụ: "25/04/2026" |
| **Clear** | Nút clear để bỏ due date (optional field) |

### 4.7 Badge

| Variant | Dùng cho | Style |
|---------|----------|-------|
| `StatusBadge` | Status task (ToDo, InProgress, InReview, Done) | Dot + text, màu theo status color |
| `PriorityBadge` | Priority task (Low, Medium, High, Urgent) | Filled/outlined, màu theo priority color |
| `RoleBadge` | Role member (Admin, Manager, Member) | Outlined, text nhỏ |
| `OverdueBadge` | Task quá hạn | Background `destructive-bg`, text `destructive`, icon clock |
| `ArchivedBadge` | Project đã archive | Background `muted`, text `muted-foreground`, icon archive |
| `PendingBadge` | Invite chưa accept | Background `warning-bg`, text `warning`, "Pending" |
| `NotificationBadge` | Số notification chưa đọc | Dot đỏ nhỏ + number, "99+" khi > 99 |

### 4.8 Avatar

| Size | Dimension | Dùng cho |
|------|-----------|----------|
| `xs` | 20px | Inline mention, activity log |
| `sm` | 28px | Task card assignee, comment thread |
| `md` | 32px | Header user menu, member list |
| `lg` | 40px | Profile, member detail |

- Hiển thị initials (2 ký tự đầu tên) khi không có ảnh
- Background: hash-to-color từ user id cho consistency

### 4.9 Tooltip

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Giải thích action bị disabled hoặc thông tin thêm |
| **Trigger** | Hover (desktop) / long-press (mobile) |
| **Position** | Top preferred, auto-flip |
| **Delay** | 300ms trước khi hiện |
| **Dùng khi** | Nút disabled cần giải thích: "Chỉ assignee hoặc Manager mới có thể đổi trạng thái", "Bạn phải có ít nhất 1 workspace. Không thể xóa workspace cuối cùng." |

### 4.10 Dropdown Menu

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Menu context cho actions (user menu, workspace switcher, status picker) |
| **Structure** | Label + divider + menu items |
| **Item** | Icon (optional) + text + shortcut (optional) |
| **Destructive item** | Text đỏ — "Xóa", "Đăng xuất" |
| **z-index** | `z-dropdown` (50) |

### 4.11 Dialog / Confirm Dialog

| Thuộc tính | Chi tiết |
|------------|----------|
| **Dialog** | Form dialog — tạo workspace, tạo project |
| **Confirm Dialog** | Xác nhận action nguy hiểm — xóa workspace, xóa member, archive project |
| **Cấu trúc** | Title + Description + Content/Form + Footer (Cancel + Action) |
| **Confirm variant** | Action button dùng `destructive` variant cho xóa, `default` variant cho archive. Text cụ thể: "Xóa workspace", "Archive dự án" |
| **Backdrop** | Overlay tối `rgba(0,0,0,0.5)`, click ngoài = close (trừ confirm dialog) |
| **z-index** | `z-modal` (300) |

**Confirm text mẫu cho xóa workspace:**
> Title: "Xóa workspace"
> Description: "Bạn chắc chắn muốn xóa workspace **[name]**? Tất cả dữ liệu sẽ bị xóa vĩnh viễn."
> Cancel: "Hủy" | Action: "Xóa workspace" (destructive)

**Confirm text mẫu cho archive project:**
> Title: "Archive dự án"
> Description: "Bạn chắc chắn muốn archive dự án **[name]**? Sau khi archive, không thể tạo task mới trong dự án này. Các task hiện tại vẫn có thể cập nhật trạng thái."
> Cancel: "Hủy" | Action: "Archive dự án" (default)

### 4.12 Tabs

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Chuyển đổi view trong cùng context |
| **Dùng ở** | Task detail (Chi tiết / Activity), My Tasks filter (All / To Do / In Progress) |
| **Active tab** | Underline primary, text bold |
| **Inactive tab** | Text `text-muted`, hover highlight |

### 4.13 Sheet / Slide-over Panel

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Hiển thị task detail mà không rời khỏi trang hiện tại |
| **Direction** | Slide từ **phải** |
| **Width** | `480px` (desktop/tablet) / `100vw` (mobile) |
| **z-index** | `z-sheet` (400) |
| **Backdrop** | Overlay tối, click = close |
| **Animation** | `duration-slow` (300ms), slide-in từ phải |
| **Cấu trúc** | Header (title + close btn) → Scrollable body → Fixed footer (nếu có action) |
| **Dùng ở** | `TaskDetailSheet` — mở từ task card click |
| **Mô tả task (Markdown)** | Phần Description trong view mode render Markdown (headings, bold, italic, lists, checklists, code blocks, blockquotes, tables, links, images). Dùng `react-markdown` + `remark-gfm`. CSS class `.prose-task` (định nghĩa trong `globals.css`). Links mở tab mới (`target="_blank" rel="noopener noreferrer"`). Edit mode vẫn dùng `<textarea>` nhập raw markdown |

### 4.14 Toast

| Variant | Style | Icon | Dùng cho |
|---------|-------|------|----------|
| `success` | Background `success-bg`, border `success` | ✓ Check | "Project đã tạo thành công", "Đã đổi trạng thái thành [Status]", "Đã cập nhật tên workspace thành công" |
| `error` | Background `destructive-bg`, border `destructive` | ✕ X | "Có lỗi xảy ra. Thử lại?", API error |
| `info` | Background `info-bg`, border `info` | ℹ️ | "Phiên làm việc đã hết hạn." |
| `warning` | Background `warning-bg`, border `warning` | ⚠️ | Cảnh báo trước action |

- **Auto-dismiss:** 4 giây
- **Position:** Bottom-right (desktop), bottom-center (mobile)
- **z-index:** `z-toast` (500)
- **Close button:** Manual dismiss nếu cần
- **Retry:** Toast error có thể kèm nút "Thử lại" cho API failures

### 4.15 Skeleton / Loading

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Placeholder khi data đang load (API > 300ms) |
| **Variants** | `text` (rectangle), `avatar` (circle), `card` (full card skeleton), `table-row` |
| **Animation** | Pulse shimmer effect |
| **Quy tắc** | Skeleton phải match layout thật — same height, width, spacing |
| **Dùng ở** | My Tasks list, Kanban board, Project list, Member list, Report charts |

### 4.16 Empty State

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Hiển thị khi không có data — KHÔNG BAO GIỜ để trang trắng |
| **Cấu trúc** | Icon lớn (`icon-2xl`) + Heading + Description + CTA button (optional) |
| **Text** | Tiếng Việt, hướng dẫn action cụ thể |

**Empty State Text chuẩn:**

| Trang/Context | Icon | Heading | Description |
|---------------|------|---------|-------------|
| My Tasks — 0 task | 📋 | Chưa có công việc | Bạn chưa có task nào. Hãy liên hệ Manager để được assign công việc. |
| Kanban — cột trống | — | (nhỏ) Chưa có task | (chỉ text nhỏ dưới column header, không có icon lớn) |
| Projects — 0 project | 📁 | Chưa có dự án | Hãy tạo dự án đầu tiên để bắt đầu quản lý công việc. [+ Tạo dự án] |
| Comments — 0 comment | 💬 | Chưa có comment nào | Hãy viết comment đầu tiên. |
| Activity — 0 entry | 📝 | Chưa có hoạt động nào | |
| Notifications — 0 | 🔔 | Không có thông báo mới | |
| Search — 0 result | 🔍 | Không tìm thấy | Không tìm thấy task nào với từ khóa này |
| Trash — 0 task | 🗑️ | Thùng rác trống | Không có task nào đã xóa. |
| Reports — workspace mới | 📊 | Chưa có dữ liệu | Tạo task và hoàn thành để xem báo cáo. |

### 4.17 Error State

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Hiển thị khi API lỗi (500, timeout, network error) |
| **Cấu trúc** | Icon ⚠️ + "Có lỗi xảy ra" + Description + Nút "Thử lại" |
| **Retry** | Click "Thử lại" → re-fetch API |
| **Offline** | Banner sticky top, full-width, `bg-destructive text-white`, icon `WifiOff`. Text: **"Bạn đang offline. Một số tính năng không hoạt động."** Tự động ẩn khi reconnect. `z-index: 600` (trên tất cả). Component: `OfflineBanner` (`/components/common/OfflineBanner.tsx`) |
| **Rate Limit (Khóa 15 phút)** | Lỗi 429 khi đăng nhập/đăng ký sai quá nhiều. Alert đỏ (Destructive) hiển thị to ở đầu form, đi kèm icon ⚠️ và đồng hồ đếm ngược `MM:SS` cập nhật thời gian thực. Nút Submit bị `disabled` cho đến khi hết thời gian khóa. |

### 4.18 Bảng dữ liệu (Data Table)

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Hiển thị data dạng bảng — Member list, Report stats |
| **Header** | Sticky, font `overline`, text `text-secondary` |
| **Row** | Hover highlight `surface-hover`, border-bottom nhẹ |
| **Mobile** | Horizontal scroll với indicator |
| **Empty** | Empty state bên trong table body |

### 4.19 Task Card (List Item)

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Hiển thị task trong list (My Tasks) hoặc board (Kanban) |
| **Cấu trúc** | Project label + Title + StatusBadge + PriorityBadge + Assignee (avatar + name) |
| **Click** | Mở `TaskDetailSheet` (slide-over) |
| **Drag** | Kéo **toàn bộ card** (không chỉ handle) trên Kanban board (desktop). `cursor: grab` / `active:cursor-grabbing`. Sau khi thả: optimistic UI + `toast.success("Đã đổi trạng thái thành [Status]")` — không reload trang, không flash |
| **Removed User** | Assignee hiển thị "[Removed User]" với avatar placeholder xám |

#### Card Variants

Có **2 variant** tùy context sử dụng:

##### Variant 1: Kanban Card (dùng trong Team Kanban + Project Detail)

```
┌──────────────────────────────────────────┐
│  ● DỰ ÁN 1*                             │   ← Row 1: Project label (color dot + name, uppercase, caption)
│                                          │
│  NHẬP MÔN                               │   ← Row 2: Title (heading-3, font-semibold, lớn)
│                                          │
│  ┌───────┐  ┌────────┐  ┌─────────┐    │
│  │ To Do │  │ Medium │  │ Overdue │    │   ← Row 3: StatusBadge + PriorityBadge + OverdueBadge (nếu quá hạn)
│  └───────┘  └────────┘  └─────────┘    │
│                                          │
│  (L)  lalaboy                  25/04/26  │   ← Row 4: Avatar+Name (trái) + Due date (phải)
└──────────────────────────────────────────┘
```

**Layout chi tiết — 4 hàng:**

| Row | Nội dung | Style |
|-----|----------|-------|
| **Row 1 — Project** | Color dot (`w-2.5 h-2.5 rounded-full`, màu hex project) + Tên project (uppercase) | `text-[11px]`, `text-text-muted`, `uppercase`, `font-medium`, `tracking-wider` |
| **Row 2 — Title** | Tiêu đề task | `text-base`, `font-semibold`, `text-text-primary`, `line-clamp-2`, `mb-2` |
| **Row 3 — Badges** | StatusBadge + PriorityBadge + OverdueBadge (nếu quá hạn, cạnh nhau) | `flex items-center gap-2 flex-wrap`, `mb-3` |
| **Row 4 — Assignee + Due date** | **Trái:** Avatar circle (28px, initials) + Tên assignee. Nếu null → avatar placeholder xám + "Chưa assign" (italic, `text-text-muted`). **Phải:** Icon 📅 (`Calendar`, `w-3.5 h-3.5`) + Due date (`dd/mm/yy`). Nếu null → chỉ hiện icon 📅 (không có text). Quá hạn → `text-destructive font-medium`, icon vẫn là 📅 | `flex items-center justify-between`, `text-sm`, `text-text-secondary` |

> **Lưu ý — Row 3:** StatusBadge **hiển thị** trên card (khác với convention "column = status") vì người dùng cần nhìn thấy trạng thái + mức ưu tiên ngay trên card mà không cần mở detail.

**Kích thước:**

| Thuộc tính | Giá trị |
|------------|---------|
| **Min width** | 260px |
| **Max width** | 320px |
| **Padding** | 16px (`p-4`) |
| **Border** | 1px solid `border` |
| **Border radius** | `radius-lg` (8px) |
| **Background** | `white` |
| **Shadow** | `shadow-sm` |
| **Border-left** | 3px solid `--status-todo` (hoặc màu status tương ứng, viền bên trái) |

##### Variant 2: List Row Card (dùng trong My Tasks)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ▌ Fix responsive layout     ● Website   📅 Overdue  25/04  [Cao]  │
│                                                                     │
│   ← border-left đỏ (Overdue)   ← Title    ← Project  ← Due   ← Priority │
└──────────────────────────────────────────────────────────────────────┘
```

**Layout chi tiết:**

| Vùng | Nội dung | Style |
|------|----------|-------|
| **Title** | Tiêu đề task | `text-sm`, `font-medium`, `text-text-primary`, `truncate` |
| **Project** | Color dot + Tên project | `text-xs`, `text-text-secondary`, inline |
| **Due date** | Ngày hết hạn (dd/mm format) | `text-xs`, `text-text-muted`. Quá hạn → `text-destructive font-medium` |
| **OverdueBadge** | Icon `CalendarX2` + "Overdue" | `text-xs`, `text-destructive`, chỉ hiện khi `due_date < now && status !== Done` |
| **PriorityBadge** | Label theo mức ưu tiên | Badge style (xem bảng bên dưới) |
| **StatusBadge** | Trạng thái hiện tại | Badge màu status (xem bảng bên dưới) |

#### Thông tin hiển thị trên card

Mọi task card (cả 2 variant) phải hiển thị **đủ các thông tin sau** khi dữ liệu tồn tại:

| # | Thông tin | Bắt buộc | Ghi chú |
|---|-----------|:--------:|---------|
| 1 | **Tên project** | ✅ | Color dot + tên project uppercase. Caption style |
| 2 | **Tiêu đề task** | ✅ | Kanban: `text-base font-semibold line-clamp-2`. List: `text-sm truncate` |
| 3 | **StatusBadge** | ✅ | Luôn hiện trên card. Badge pill với dot color |
| 4 | **PriorityBadge** | ✅ | Luôn hiện trên card, cạnh StatusBadge. Màu theo mức |
| 5 | **Người thực hiện** (Assignee) | Nếu có | Avatar circle (28px) + **tên đầy đủ** (không chỉ avatar). Nếu null → ẩn cả row |
| 6 | **Ngày hết hạn** (Due date) | Nếu có | Format `dd/mm/yyyy` (vi-VN). Nếu null → ẩn. Quá hạn → đỏ |
| 7 | **Overdue badge** | Tự động | Chỉ hiện khi `due_date < now && status !== Done` |

#### PriorityBadge — Chi tiết từng mức

| Priority | Label | Background | Text color | Icon/Prefix |
|----------|-------|------------|------------|-------------|
| **Low** | "Low" | `muted` | `muted-foreground` | — |
| **Medium** | "Medium" | `hsl(38 92% 50% / 0.12)` | `hsl(38 92% 40%)` | — |
| **High** | "High" | `warning-bg` | `warning` | — |
| **Urgent** | "Urgent" | `destructive-bg` | `destructive` | — |

**Style chung:** `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold`

#### OverdueBadge

| Thuộc tính | Giá trị |
|------------|---------|
| **Điều kiện hiển thị** | `due_date !== null && due_date < Date.now() && status !== 'Done'` |
| **Icon** | `CalendarX2` (lucide, `w-3.5 h-3.5`) |
| **Text** | "Overdue" |
| **Style** | `bg-destructive/10 text-destructive text-xs font-semibold px-2.5 py-1 rounded-full` |
| **Vị trí** | Góc trên-phải title trên TaskDetailSheet. Trên card → cạnh PriorityBadge hoặc cạnh due date |

#### StatusBadge

| Status | Label | Dot color | Background | Text color |
|--------|-------|-----------|------------|------------|
| **ToDo** | "To Do" | `--status-todo` | `hsl(215 16% 47% / 0.1)` | `--status-todo` |
| **InProgress** | "In Progress" | `--status-in-progress` | `hsl(221 83% 53% / 0.1)` | `--status-in-progress` |
| **InReview** | "In Review" | `--status-in-review` | `hsl(38 92% 50% / 0.1)` | `--status-in-review` |
| **Done** | "Done" | `--status-done` | `hsl(142 71% 45% / 0.1)` | `--status-done` |

**Style chung:** `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold`
- Dot: `w-1.5 h-1.5 rounded-full` với background = dot color

#### Visual States

| State | Thay đổi UI |
|-------|-------------|
| **Default** | Background `white`, border `border`, shadow `shadow-sm` |
| **Hover** | Shadow nâng lên `shadow-md`, border → `border-focus/30`, cursor `pointer` |
| **Overdue** | Border-left 3px solid `destructive` (đỏ). OverdueBadge hiện trên Detail. Due date text → `text-destructive font-medium` |
| **High Priority** | PriorityBadge vàng (`warning-bg`). Không ảnh hưởng card border/background |
| **Urgent Priority** | PriorityBadge đỏ (`destructive-bg`). Không ảnh hưởng card border/background |
| **Unassigned** | Avatar placeholder xám + "Chưa assign" (italic, text-muted). Row 4 luôn hiện |
| **No due date** | Chỉ hiện icon 📅 (không có text date). Row 4 luôn hiện |
| **Archived project** | Card hiển thị bình thường. Chỉ ảnh hưởng khi tạo task mới (nút disabled) |
| **Dragging** (Kanban) | Card ghost (opacity 0.3) tại vị trí cũ. DragOverlay: card nổi theo cursor (`shadow-lg`, `rotate(2deg)`). Cột target highlight `border-2 border-dashed border-primary/40`. Sau khi thả: **không reload**, **không flash** — optimistic UI cập nhật ngay, rollback nếu API lỗi |
| **Not draggable** (Member, task không assign cho mình) | `cursor: not-allowed`, `opacity-75`, tooltip trên card: "Chỉ assignee hoặc Manager mới có thể đổi trạng thái". Card không thể kéo (`draggable={false}`). Click vẫn mở TaskDetailSheet. Trên TaskDetailSheet: nút status bị `disabled` |

#### Ví dụ hiển thị đầy đủ — Kanban Card

- **Task bình thường (có assignee, Medium priority):**

```
┌──────────────────────────────────────────┐
│  ● DỰ ÁN 1*                             │   ← 11px, uppercase, text-muted, color dot
│                                          │
│  NHẬP MÔN                               │   ← 16px, font-semibold, text-primary
│                                          │
│  ┌───────┐  ┌────────┐                  │
│  │ To Do │  │ Medium │                  │   ← StatusBadge(xám) + PriorityBadge(vàng cam)
│  └───────┘  └────────┘                  │
│                                          │
│  (L)  lalaboy                  30/04/26  │   ← Avatar+Name (trái) + Due date (phải)
└──────────────────────────────────────────┘
```

- **Task Urgent, có Overdue:**

```
┌──────────────────────────────────────────┐
│  ● WEBSITE REDESIGN                      │
│                                          │
│  Fix responsive layout                   │
│                                          │
│  ┌─────────────┐  ┌─────────┐  ┌─────────┐  │
│  │ In Progress │  │ Urgent  │  │ Overdue │  │   ← StatusBadge + PriorityBadge + OverdueBadge
│  └─────────────┘  └─────────┘  └─────────┘  │
│                                          │
│  (N)  Nguyễn An              📅 25/04    │   ← Avatar + Name + Due date(đỏ)
└──────────────────────────────────────────┘
  ← border-left 3px đỏ (overdue indicator)
```

- **Task không assignee, không due date:**

```
┌──────────────────────────────────────────┐
│  ● BACKEND SERVICES                      │
│                                          │
│  Viết unit test cho auth module          │
│                                          │
│  ┌───────┐  ┌──────┐                    │
│  │ To Do │  │ Low  │                    │   ← StatusBadge(xám) + PriorityBadge(muted)
│  └───────┘  └──────┘                    │
│                                          │
│  (?)  Chưa assign                    📅  │   ← Placeholder avatar + "Chưa assign" + icon lịch
└──────────────────────────────────────────┘
```



### 4.20 Filter Chip

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Filter nhanh cho My Tasks, Kanban |
| **Variants** | `default` (outlined), `active` (filled primary) |
| **Dùng ở** | My Tasks: "All", "To Do", "In Progress" |
| **Kanban filters** | Dropdown selects cho: Assignee, Project, Priority, Due date range |

### 4.21 Search Result Item

> **Layout:** Mini Kanban card thu nhỏ — đủ 4 thông tin, chia 2 dòng dưới title, compact.

```
┌──────────────────────────────────────────────────────┐
│  ● DỰ ÁN 1                          ← Row 1: Project │
│  Fix responsive layout (highlight)  ← Row 2: Title   │
│  [To Do] [Medium]   (A) Nguyễn  📅 25/04  ← Row 3+4 │
└──────────────────────────────────────────────────────┘
```

| Row | Nội dung | Style |
|-----|----------|-------|
| **Row 1 — Project** | Color dot + tên project | `text-[10px] font-semibold text-text-muted uppercase tracking-wider` |
| **Row 2 — Title** | Task title với highlight match | `text-sm font-semibold text-text-primary truncate`. Keyword match: `bg-primary/15 text-primary font-semibold rounded-sm` |
| **Row 3+4 (split)** | **Trái:** `MiniStatusBadge` + `MiniPriorityBadge` (10px, cùng style Kanban card nhưng nhỏ hơn). **Phải:** Avatar circle (16px) + tên assignee hoặc "Chưa assign" (italic) + `·` + icon 📅 + due date (đỏ nếu overdue) | `flex items-center justify-between` |

**Badge sizes (mini variant):**
- `MiniStatusBadge`: `px-1.5 py-0.5 rounded-full text-[10px] font-semibold` — dot 4px + label
- `MiniPriorityBadge`: `px-1.5 py-0.5 rounded-full text-[10px] font-semibold` — label only

| Thuộc tính | Chi tiết |
|------------|----------|
| **Click** | Mở `TaskDetailSheet` + đóng search dropdown + clear query |
| **Hover** | `bg-surface-hover` |
| **Active (keyboard)** | `bg-primary/5` |
| **Max items** | 10 kết quả |
| **Keyboard** | `↑↓` navigate, `Enter` select, `Escape` đóng |
| **Border** | `border-b border-border/40` giữa các item, không có ở item cuối |

### 4.22 Chart Container

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mục đích** | Container cho bar chart trong Reports |
| **Cấu trúc** | Title + Chart area + Legend (optional) |
| **Bar chart** | 4 cột (4 tuần), label tuần bên dưới, value trên bar |
| **Tuần hiện tại** | Label ghi "(tuần này)" hoặc style khác biệt |
| **Empty** | Chart hiển thị 0 cho tất cả tuần, kèm empty state text |

---

## 5. Pattern biểu mẫu

> Tất cả form dùng **React Hook Form + Zod validation**. Error message bằng **tiếng Việt**.

### 5.1 Quy tắc chung cho Form

| Quy tắc | Chi tiết |
|---------|----------|
| **Validation** | Client-side (Zod) validate trước khi gọi API. Lỗi hiển thị inline dưới field |
| **Error text** | Tiếng Việt, cụ thể: "Tên không được để trống", "Email không hợp lệ" |
| **Error tổng** | Nếu API trả lỗi không gắn được vào field cụ thể → hiển thị alert box đỏ ở đầu form |
| **Submit button** | Disabled khi form invalid. Loading spinner + "Đang xử lý..." khi đang submit |
| **Success feedback** | Toast success sau khi submit thành công. Form đóng hoặc reset |
| **Sanitization** | Mọi input text đều sanitize HTML (`<script>` → plain text) trước khi gửi API |
| **Label** | Mọi field phải có `<label>` rõ ràng — bắt buộc cho accessibility |
| **Required indicator** | Dấu `*` đỏ sau label cho required fields |

### 5.2 Form Auth — Login

| Field | Type | Validation | Placeholder |
|-------|------|------------|-------------|
| Email | Input (email) | Required, email format (Zod) | "Nhập email của bạn" |
| Mật khẩu | Password Input | Required, min 8 chars | "Nhập mật khẩu" |

- **Submit:** "Đăng nhập" (primary button, full-width)
- **Error states:**
  - Sai password: Alert "Email hoặc mật khẩu không đúng."
  - Locked (5 fails): Alert "Tài khoản bị khóa tạm thời. Thử lại sau [countdown]." + countdown timer
  - API error: Toast error "Có lỗi xảy ra. Thử lại?"
- **Footer link:** "Chưa có tài khoản? [Đăng ký]"

### 5.3 Form Auth — Register

| Field | Type | Validation | Placeholder |
|-------|------|------------|-------------|
| Họ tên | Input | Required | "Nhập họ tên" |
| Email | Input (email) | Required, email format | "Nhập email của bạn" |
| Mật khẩu | Password Input | Required, min 8 chars | "Tạo mật khẩu" |

- **Submit:** "Đăng ký" (primary button, full-width)
- **Error states:**
  - Email trùng: Alert "Email này đã được đăng ký. Bạn có muốn [đăng nhập] không?" (link inline)
- **Footer link:** "Đã có tài khoản? [Đăng nhập]"

### 5.4 Form Tạo / Đổi tên Workspace

| Field | Type | Validation | Placeholder |
|-------|------|------------|-------------|
| Tên workspace | Input | Required, max 100 chars | "Nhập tên workspace" |

- **Context tạo mới:** Dialog hoặc full-page (onboarding). Submit: "Tạo workspace"
- **Context đổi tên:** Inline edit trong Settings. Submit: "Lưu"
- **Error:** "Tên workspace không được để trống"

### 5.5 Form Tạo / Sửa Project

| Field | Type | Validation | Placeholder |
|-------|------|------------|-------------|
| Tên dự án | Input | Required, max 100 chars | "Nhập tên dự án" |
| Mô tả | Textarea | Optional | "Mô tả dự án (tùy chọn)" |
| Màu sắc | Color picker | Required, hex color | Preset palette 8–10 màu |

- **Submit tạo:** "Tạo dự án" | **Submit sửa:** "Lưu thay đổi"
- **Permission:** Chỉ Admin/Manager. Member không thấy nút tạo project

### 5.6 Form Tạo / Sửa Task

| # | Field | Type | Validation | Placeholder / Default |
|---|-------|------|------------|----------------------|
| 1 | Tiêu đề * | Input | Required, max 200 chars | "Nhập tiêu đề task" |
| 2 | Dự án * | Select | Required | Chọn từ danh sách projects active |
| 3 | Người thực hiện | Dropdown | Optional, phải thuộc workspace (tất cả roles: Admin, Manager, Member) | Hiển thị danh sách thành viên workspace (avatar + tên + email), không có tìm kiếm |
| 4 | Độ ưu tiên + Ngày hết hạn | Select + Date Picker | Default: Medium / Optional | 2 cột cùng hàng (`grid-cols-2`) |
| 5 | Mô tả | Textarea | Optional, max 5000 chars | "Mô tả chi tiết (tùy chọn)" |

- **Mở bằng:** Slide-over panel từ phải (khi tạo mới hoặc edit)
- **Thứ tự hiển thị:** Required fields trước (Title → Project), metadata (Assignee → Priority + Due date), cuối cùng là Mô tả
- **Submit tạo:** "Tạo task" → task xuất hiện ngay (optimistic) → toast success
- **Submit sửa (inline edit):** Click "Chỉnh sửa" → các field chuyển thành input/select **ngay tại chỗ** (inline), không mở form riêng. Nút "Lưu thay đổi" + "Hủy" nằm **dưới phần Mô tả** → activity log ghi thay đổi
- **Error assignee ngoài workspace:** "Người thực hiện phải thuộc workspace hiện tại"
- **Error project archived:** "Dự án đã archive, không thể tạo task mới"

### 5.7 Form Comment

| Field | Type | Validation | Placeholder |
|-------|------|------------|-------------|
| Nội dung | Textarea | Required, not empty | "Viết comment..." |

- **@mention:** Khi gõ `@`, hiển thị autocomplete dropdown danh sách members workspace.
  - **Popup Mention Layout:** Floating box `bottom-full mb-2` (nổi lên phía trên), width `280px`, có `box-shadow` lớn. Các mục bên trong được padding `10px 12px`, background highlight (opacity 8%) khi dùng phím mũi tên lướt qua.
- **Khung nhập liệu (Wrapper):** Bo góc `12px`, padding lề trong `12px` (gap 12px giữa input và nút gửi), màu nền `surface`, có viền `border`.
- **Submit:** Button "Gửi" hoặc Ctrl+Enter.
  - Nút bấm `h-9` (36px), padding ngang `16px`, chứa chữ "Gửi" kèm icon Send.
  - Nút tự động chuyển trạng thái disabled (`opacity: 0.6`) khi textarea rỗng.
- **Error:** "Nội dung comment không được để trống"
- **API error:** Toast error, nội dung comment vẫn giữ nguyên trong textarea (không mất)
- **XSS:** Sanitize `<script>` → plain text

### 5.7.1 Hiển thị danh sách bình luận (Comment Thread)

- **Khoảng cách:** Giữa các bình luận (items) cách nhau `32px` (`space-y-8`) để tạo sự tách biệt rõ ràng và thoáng đãng hơn. Có `py-4` cho toàn bộ danh sách.
- **Avatar:** Kích thước `36x36px` (`w-9 h-9`), lùi xuống `margin-top: 2px` để canh thẳng hàng (baseline) với tên người dùng và thời gian.
- **Header bình luận:** Tên người dùng (`font-semibold`) và Thời gian (format: `HH:mm DD/MM/YYYY`, ví dụ: `14:30 28/04/2026`) canh thẳng theo `items-baseline`.
- **Nội dung chữ:** Font size `14px`, áp dụng `leading-relaxed` để tăng khoảng cách giữa các dòng chữ, giúp dễ đọc khi comment dài.
- **@mention text:** Tên người được nhắc sẽ được bọc trong một thẻ span màu chữ `primary` và nền `primary/10`, bo góc nhẹ (`px-0.5 rounded`).

### 5.8 Form Invite Member

| Field | Type | Validation | Placeholder |
|-------|------|------------|-------------|
| Email | Input (email) | Required, email format | "Nhập email người muốn mời" |
| Vai trò | Select | Required, chỉ Manager/Member | Default: Member |

- **Submit:** "Gửi lời mời"
- **Re-invite (email đã có pending):** Cập nhật invite cũ (token/role/expires mới), KHÔNG tạo duplicate. Toast "Đã gửi lại lời mời thành công"
- **Error email đã là member:** "Email này đã là thành viên của workspace."
- **Success:** Toast "Đã gửi lời mời thành công" + badge "Pending" xuất hiện trong pending section
- **Email gửi đi bao gồm:**
  - Subject: "[Tên người mời] đã mời bạn tham gia workspace "[Tên workspace]" trên TaskFlow"
  - Body: Tên workspace, tên người mời, vai trò được mời (Quản lý / Thành viên), link accept, thời hạn 48h

### 5.9 Form Đổi Role Member

| Field | Type | Validation |
|-------|------|------------|
| Vai trò | Select | Chỉ Admin mới đổi được. Options: Manager / Member |

- **Inline edit** trong member list table, hoặc dropdown trên member row
- **Không cho đổi role của chính Admin đang login**

---

## 6. Pattern trạng thái chung

### 6.1 Interactive States (cho mọi interactive element)

| State | Style | Áp dụng cho |
|-------|-------|-------------|
| `default` | Style cơ bản | Mọi element |
| `hover` | Background nhạt hơn / border đậm hơn, `cursor: pointer`, transition `duration-fast` | Button, card, link, menu item |
| `focus` | Focus ring (2px ring `border-focus`), outline offset 2px | Input, button, link — **bắt buộc cho accessibility** |
| `active` | Background đậm hơn hover, scale(0.98) nhẹ | Button |
| `disabled` | `opacity: 0.5`, `cursor: not-allowed`, không trigger click | Button, input, select, drag handle |
| `loading` | Spinner icon thay content, hoặc skeleton pulse | Button submit, page content |
| `success` | Border/background xanh lá nhẹ, check icon | Form field sau validation pass (optional) |
| `error` | Border/background đỏ nhẹ, text lỗi tiếng Việt dưới field | Form field |

### 6.2 Page-level States

| State | UI Pattern | Chi tiết |
|-------|------------|----------|
| `loading` | Skeleton shimmer | Hiển thị khi API > 300ms. Match layout thật |
| `empty` | EmptyState component | Icon + heading + description + CTA. Xem bảng text chuẩn ở 4.16 |
| `error` | ErrorState component | Icon ⚠️ + "Có lỗi xảy ra" + nút "Thử lại" |
| `no permission` | Redirect hoặc 403 page | Member truy cập route không có quyền → redirect `/app/my-tasks` |
| `expired` | Redirect + toast | Token hết hạn → redirect `/login` + toast info |
| `offline` | Banner sticky | "Bạn đang offline. Kiểm tra kết nối mạng." ở top page |
| `not found` | 404 page | "Trang không tìm thấy" + link về trang chủ |
| `read-only` | Ẩn edit controls | Manager xem My Tasks member: không có nút edit/delete/comment |

### 6.3 Tooltip cho Action không được phép

Khi action visible nhưng user không có quyền → nút **disabled + tooltip** giải thích lý do.

| Action | Điều kiện disabled | Tooltip text |
|--------|-------------------|--------------|
| Đổi status task | Member không phải assignee | "Chỉ assignee hoặc Manager mới có thể đổi trạng thái" |
| Xóa workspace | Chỉ còn 1 workspace | "Bạn phải có ít nhất 1 workspace. Không thể xóa workspace cuối cùng." |
| Xóa chính mình | Admin tự xóa | "Không thể xóa Admin đang đăng nhập." |
| Tạo task trong project archived | Project đã archive | "Dự án đã archive. Không thể tạo task mới." |
| Drag-drop (Member trên Kanban) | Member không có quyền | (Member không thấy Kanban — ẩn hoàn toàn) |

### 6.4 Optimistic UI & Rollback

| Action | Optimistic behavior | Rollback khi API lỗi |
|--------|--------------------|-----------------------|
| Đổi status task (click/drag) | UI cập nhật status mới ngay lập tức | Revert về status cũ + toast error "Không thể cập nhật trạng thái. Thử lại?" |
| Tạo task | Task xuất hiện trong list/board ngay | Remove task khỏi UI + toast error |
| Post comment | Comment xuất hiện trong thread ngay | Remove comment + toast error, giữ nội dung trong textarea |

### 6.5 Countdown Timer

Dùng ở 2 nơi:

| Context | Hiển thị | Format |
|---------|----------|--------|
| **Login lockout** (5 fails) | Timer đếm ngược 15 phút | "Thử lại sau 14:59" — cập nhật thời gian mỗi giây |
| **Trash restore window** | Thời gian còn lại trước khi task hết hạn restore | "Còn 12 ngày 5 giờ" hoặc "Còn 2 giờ 30 phút" (< 1 ngày) |

### 6.6 Notification States

| State | UI |
|-------|-----|
| **Unread** | Background `surface` nhẹ hơn, dot xanh primary bên trái, font `body-medium` (bold hơn) |
| **Read** | Background transparent, font `body` (normal), no dot |
| **Badge counter** | Dot đỏ trên bell icon. Hiển thị số (1–99) hoặc "99+" khi > 99. Ẩn khi 0 |

---

## 7. Thiết kế theo Feature

> Section này map từng FR (FR-01 → FR-12) sang UI pattern, layout, component, và trạng thái cụ thể.

### 7.1 FR-01: Authentication

#### Màn hình Login (`/login`)

- **Layout:** Auth Layout (centered card, max-w-400px)
- **Form:** Xem 5.2 Form Auth — Login
- **Lockout state:** Khi 5 fails liên tiếp:
  - Submit button disabled
  - Alert đỏ hiển thị countdown timer "Thử lại sau [MM:SS]"
  - Timer cập nhật mỗi giây, khi hết → enable lại form
- **Expired session:** Khi redirect từ 401 → hiển thị toast info "Phiên làm việc đã hết hạn."

#### Màn hình Register (`/register`)

- **Layout:** Auth Layout
- **Form:** Xem 5.3 Form Auth — Register
- **Sau register thành công:** Redirect → trang Tạo Workspace (onboarding)

#### Multi-tab Logout

- Khi logout → clear token → trigger `storage` event
- Tab khác listen `storage` event → detect token bị xóa → auto redirect `/login`
- Không có UI đặc biệt cho tab khác — chỉ redirect im lặng

### 7.2 FR-02: Workspace & Members

#### Tạo Workspace (Onboarding)

- **Khi nào:** Sau register, hoặc khi user không có workspace nào
- **Layout:** Centered page, tương tự Auth Layout
- **Form:** Xem 5.4 — chỉ 1 field "Tên workspace" + button "Tạo workspace"
- **Sau tạo:** Redirect → `/app/my-tasks` với workspace mới active

#### Workspace Settings (`/app/settings`)

- **Chỉ Admin thấy** nav item này
- **Content:**
  - Section "Tên workspace": inline edit + button "Lưu"
  - Section "Xóa workspace":
    - Nút "Xóa workspace" (destructive)
    - Nếu chỉ còn 1 workspace → nút **disabled** + tooltip
    - Click → Confirm Dialog (xem 4.11)

#### Workspace Switcher

- **Vị trí:** Block trên cùng sidebar
- **Trigger:** Click tên workspace → dropdown
- **Dropdown content:**
  - List workspaces: tên + `RoleBadge` (Admin/Manager/Member)
  - Active workspace: highlight + check icon
  - Divider
  - Nút "+ Tạo workspace mới"
- **Switch action:** Set `currentWorkspaceId` → reload all data → gửi `x-workspace-id` header
- **Auto-switch:** Khi bị xóa khỏi workspace đang active → switch sang workspace khác + toast

#### Member Management (`/app/settings/members`)

```
┌─────────────────────────────────────────────────────────┐
│  Quản lý thành viên                                     │
├─────────────────────────────────────────────────────────┤
│  Mời thành viên mới                                     │
│  ┌──────────────────────┐ ┌──────────┐ ┌───────────┐   │
│  │ Nhập email...        │ │ Vai trò ▾│ │ Gửi lời mời│   │
│  └──────────────────────┘ └──────────┘ └───────────┘   │
├─────────────────────────────────────────────────────────┤
│  Thành viên (3)                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [👤] Nguyễn Admin  │ admin@mail │ Admin     │       ││
│  │ [👤] Trần Manager  │ mgr@mail   │ [Manager▾]│ [🗑️]  ││
│  │ [👤] Lê Member     │ mbr@mail   │ [Member▾] │ [🗑️]  ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  Lời mời đang chờ (1)                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │ new@mail  │ Member │ ⏳ Pending │ Còn 23:45:12      ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

- **Chỉ Admin thấy**
- **Invite section:** Form invite ở trên cùng (xem 5.8)
- **2 section tách biệt:**
  - **Section 1: "Thành viên" (active):** Data table — Tên | Email | Vai trò | Hành động
    - `RoleBadge`, dropdown đổi role (Admin thì hiện badge, không đổi được)
    - Nút xóa (icon `UserMinus`), Admin tự xóa → disabled + tooltip
    - Avatar `md` (32px) với 2-char initials
  - **Section 2: "Lời mời đang chờ" (pending):** Hiển thị riêng dưới section thành viên
    - Mỗi pending invite: email + `RoleBadge` + `PendingBadge` (warning-bg, warning text) + **countdown timer**
    - **Countdown format:** `HH:MM:SS` đếm ngược thời gian thực (cập nhật mỗi giây, font monospace). Khi hết hạn: "Đã hết hạn" (text destructive)
    - Empty pending: ẩn section, không hiện empty state
- **Xóa member confirm:** "Bạn chắc chắn muốn xóa [name] khỏi workspace? Task đã assign sẽ hiển thị '[Removed User]'."
- **Admin tự xóa:** Nút disabled + tooltip "Không thể xóa Admin đang đăng nhập."
- **Removed user tasks:** Task giữ nguyên `assigneeId` trong DB. Backend tự động đối chiếu và trả về cờ `isAssigneeRemoved: true`. Frontend dựa vào cờ này để hiển thị "[Removed User]" thay tên assignee cùng avatar xám (RU).

### 7.3 FR-03: Quản lý Project

#### Project List (`/app/projects`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Dự án                                                           │
│  Tất cả dự án trong workspace [WS Name]                         │
│                                                                  │
│  2 dự án đang hoạt động  🔄                  [+ Tạo project]    │
│                                                                  │
│  ┌─────────────────────┐ ┌─────────────────────┐                │
│  │ ● Website Redesign  │ │ ● Mobile App        │                │
│  │   Redesign UI...    │ │   Build native...   │                │
│  │   ✅ 5/12 tasks  42%│ │   ✅ 3/8 tasks  38% │                │
│  │   ▓▓▓▓▓░░░░░░░░░░░ │ │   ▓▓▓░░░░░░░░░░░░░ │                │
│  └─────────────────────┘ └─────────────────────┘                │
│                                                                  │
│  📦 ĐÃ ARCHIVE (2)                                              │
│                                                                  │
│  ┌─────────────────────┐ ┌─────────────────────┐                │
│  │ ● Old Project  [AR] │ │ ● Legacy API   [AR] │                │
│  │   10/10 tasks  100% │ │   0/1 tasks     0%  │                │
│  │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ │   ░░░░░░░░░░░░░░░░ │                │
│  └─────────────────────┘ └─────────────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

- **Page header:**
  - Title: `Dự án` (`text-2xl font-bold`)
  - Subtitle: `Tất cả dự án trong workspace [WS Name]` (`text-sm text-text-muted`). Tên workspace lấy từ store, hiển thị font-medium
- **2 sections tách riêng:**
  - **Section 1 — Đang hoạt động:** Header `"[N] dự án đang hoạt động"` (`text-sm text-text-muted`) + icon refresh (🔄) bên cạnh. Nút `"+ Tạo project"` (primary) bên phải cùng hàng, chỉ Admin/Manager
  - **Section 2 — Đã archive:** Header `📦 ĐÃ ARCHIVE ([N])` (`text-xs font-semibold text-text-muted uppercase tracking-wider`). Chỉ hiện khi có ≥ 1 archived project
- **Layout cards:** Grid (3 columns desktop, 2 tablet, 1 mobile). Card nhỏ gọn hơn
- **Compact Project Card:**
  - `bg-white rounded-xl border p-4 shadow-sm` (padding nhỏ hơn: 16px)
  - **Hàng 1:** Color dot (12px circle, `background: project.color`) + tên project (`text-sm font-semibold`) + `ArchivedBadge` (nếu archived, chỉ trong section archive)
  - **Hàng 2:** Mô tả (truncated 1 dòng `text-ellipsis`, `text-xs text-text-secondary word-break-all`). Chỉ hiện khi có description. Text dài không ngắt → `word-break: break-all` + `min-width: 0`
  - **Layout Flex:** Card dùng `flex flex-col h-full`, phần trạng thái (Hàng 3 & 4) được bọc trong một khối với `margin-top: auto` để đẩy sát xuống đáy card. Chiều cao của khối trạng thái và thanh progress luôn đồng đều và cố định ở đáy dù có hay không có mô tả.
  - **Hàng 3 — Progress inline:** Icon check (✅ `text-success`, 14px) + `"[done]/[total] tasks"` (`text-xs text-text-muted`) + percentage (`text-xs font-semibold`) căn phải
  - **Hàng 4 — Progress bar:** `h-1.5 rounded-full bg-muted`, fill gradient xanh lá (success). Archived → fill `hsl(38 92% 50%)` (warning/vàng olive) để phân biệt
- **Nút "+ Tạo project":** Primary button, chỉ hiển thị cho Admin/Manager. Nằm cùng hàng section header active
- **Click card:** Navigate → `/app/projects/:id`
- **Empty state (toàn bộ):** Xem 4.16
- **Empty active:** Hiện empty state "Chưa có dự án nào đang hoạt động. Tạo dự án đầu tiên!"
- **Empty archived:** Ẩn section archived hoàn toàn

#### Project Detail (`/app/projects/:id`)

```
┌─────────────────────────────────────────────────────────┐
│  ← Dự án / Website Redesign                            │  ← Breadcrumb
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │  ● Website Redesign    [✏ Chỉnh sửa] [Archive] │    │  ← Project Info Card
│  │  Mô tả dự án...                                │    │
│  │  ✅ 5/12 tasks hoàn thành ▓▓▓▓▓░░░░░░░░  42%  │    │  ← Progress bar
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Danh sách Task  12                     [+ Thêm task]   │  ← Section header
├─────────────┬──────────────┬──────────────┬─────────────┤
│  To Do (5)  │ In Progress(3)│ In Review (2)│ Done (8)   │
├─────────────┼──────────────┼──────────────┼─────────────┤
│ [Task Card] │ [Task Card]  │ [Task Card]  │ [Task Card] │
│ [Task Card] │ [Task Card]  │              │ [Task Card] │
│ ...         │              │              │ ...         │
└─────────────┴──────────────┴──────────────┴─────────────┘
```

- **Breadcrumb:** `← Dự án / [Tên project]`. Link "Dự án" navigate về `/app/projects`. Tên project là text tĩnh
- **Project Info Card:** `bg-white rounded-xl border p-6 shadow-sm`
  - **Hàng 1:** Color dot + tên project (`text-xl font-bold`) + `ArchivedBadge` (nếu archive). Bên phải: nút "✏ Chỉnh sửa" + nút "Archive"
  - **Mô tả:** `text-sm text-text-secondary word-break-word overflow-wrap-anywhere`, chỉ hiện khi có description. Clamp tối đa 3 dòng (`-webkit-line-clamp: 3`). Text dài không ngắt được (URL, chuỗi liền) → `word-break: break-word`
  - **Progress bar:** Icon check xanh + "[done] / [total] tasks hoàn thành" + thanh progress (`h-2 rounded-full bg-muted`, fill gradient xanh lá) + "[%]"
- **Nút "✏ Chỉnh sửa":** Outlined button (`border-border hover:bg-surface-hover`). Chỉ Admin/Manager, ẩn khi archived. Click → `EditProjectDialog` (sửa tên, mô tả, màu. `PATCH /api/projects/:id`)
- **Nút "Archive":** Outlined destructive (`border-destructive/30 text-destructive`). Chỉ Admin/Manager, ẩn khi archived. Click → Confirm Dialog
- **Section header:** "Danh sách Task" (`text-base font-semibold`) + count (`text-sm text-text-muted`) + nút "+ Thêm task" (primary). Disabled + tooltip khi archived
- **4 cột Kanban:** To Do | In Progress | In Review | Done (giống Team Kanban)
- **Column header:** Status label (overline) + task count badge
- **Task card:** 4-row Kanban variant (xem 4.19)
- **Drag-drop permissions:**

| Role | Drag-drop |
|------|-----------|
| **Admin** | ✅ Kéo thả **tất cả** task trong project |
| **Manager** | ✅ Kéo thả **tất cả** task trong project |
| **Member** | ✅ Chỉ kéo thả task **được assign cho mình**. Task người khác / unassigned → card không draggable |

- **Mobile:** Horizontal scroll (1 cột visible), dropdown đổi status thay drag
- **Archive:** Sau archive: `ArchivedBadge` hiện, nút "Chỉnh sửa" ẩn, nút "+ Thêm task" disabled + tooltip
- **Empty column:** Text nhỏ "Chưa có task" dưới column header
- **Empty project:** Full empty state: "Chưa có task nào trong dự án. Tạo task đầu tiên!"

### 7.4 FR-04: Task CRUD

#### Nút "+ Tạo task"

- **Entry point 1 — Sidebar:** Nút primary full-width trong sidebar, dưới workspace switcher và trên nav items. **Chỉ hiển cho Admin/Manager** (Member ẩn)
- **Entry point 2 — Project Detail:** Nút trong header trang `/app/projects/:id`. Hiển cho **tất cả roles** (Admin/Manager/Member). Disabled nếu project archived
- **Click:** Mở slide-over panel task form (xem 5.6)
- **Context-aware:** Nếu mở từ Project Detail → form pre-fill project hiện tại

#### Task Detail Sheet (`TaskDetailSheet`)

- **Component:** Sheet / Slide-over (xem 4.13)
- **Mở từ:** Click task card (bất kỳ đâu — My Tasks, Kanban, Search result, Project detail)
- **Layout bên trong:**

```
┌────────────────────────────────────────────────┐
│ ● Dự án: Dự án 1*    [✏ Chỉnh sửa] [🗑] [X]  │  ← Header: Project name + action buttons
├────────────────────────────────────────────────┤
│                                                │
│  fe                                ⓘ Overdue  │  ← Title (heading-2) + OverdueBadge (nếu quá hạn)
│  Tạo bởi lalaboy lúc 14/04/2026               │  ← Creator info (caption, text-muted)
│                                                │
│  Trạng thái          Độ ưu tiên                │  ← Label row (caption, text-muted)
│  ┌─────────────┐     ┌─────────┐              │
│  │ In Progress │     │ Urgent  │              │  ← StatusBadge + PriorityBadge
│  └─────────────┘     └─────────┘              │
│                                                │
│  Assignee             Hạn hoàn thành           │  ← Label row
│  (L) lalaboy          04/04/2026 (đỏ)         │  ← Avatar+Name + Due date (đỏ nếu overdue)
│                                                │
│  Mô tả                                        │  ← Section label
│  ┌────────────────────────────────────────┐    │
│  │ d                                      │    │  ← Description content (whitespace-pre-wrap)
│  └────────────────────────────────────────┘    │
│                                                │
│  ┌────────────┐ ┌──────────┐                  │
│  │ 💬 Comments │ │ 🕐 Activity│                  │  ← Tab bar
│  └────────────┘ └──────────┘                  │
│                                                │
│  💬 BÌNH LUẬN                                  │  ← Section header
│                                                │
│  (PV) Phan Văn Tấn  23:28 15/4/2026           │  ← Comment item: Avatar + Name + Timestamp
│       @lala2                                   │  ← Comment content with @mention highlight
│                                                │
│  (PV) Phan Văn Tấn  23:35 15/4/2026           │
│       @lalaboy                                 │
│                                                │
│  ┌────────────────────────────────────────┐    │
│  │ Viết bình luận (@ để nhắc tên)...  [➤]│    │  ← Comment input + Send button
│  └────────────────────────────────────────┘    │
└────────────────────────────────────────────────┘
```

#### Header Row

| Thành phần | Chi tiết |
|------------|----------|
| **Project indicator** | Color dot + "Dự án: [Tên project]" (`text-sm font-medium text-text-primary`) |
| **Nút Chỉnh sửa** | Icon ✏ + text "Chỉnh sửa". Outlined button. Chỉ hiện cho Creator/Assignee/Admin/Manager |
| **Nút Xóa (🗑)** | Icon trash. Chỉ hiện cho Admin/Manager. Click → Confirm Dialog |
| **Nút Đóng (X)** | Icon close, luôn hiện. Click hoặc Escape đóng sheet |

#### Title + Creator Section

| Thành phần | Chi tiết |
|------------|----------|
| **Title** | `text-lg font-semibold text-text-primary`. Inline editable khi ở mode edit |
| **OverdueBadge** | Góc trên-phải cạnh title. `bg-destructive/10 text-destructive rounded-full px-2.5 py-1 text-xs font-semibold`. Icon AlertCircle + "Overdue". Chỉ hiện khi `due_date < now && status !== Done` |
| **Creator info** | "Tạo bởi [name] lúc [dd/mm/yyyy]". `text-xs text-text-muted` |

#### Meta Grid (2 cột × 2 hàng)

```
Trạng thái              Độ ưu tiên
[StatusBadge]            [PriorityBadge]

Assignee                 Hạn hoàn thành
(L) lalaboy              04/04/2026
```

| Field | Label | Giá trị | Style giá trị |
|-------|-------|---------|---------------|
| **Trạng thái** | "Trạng thái" (`text-xs text-text-muted`) | StatusBadge (clickable → dropdown 4 status) | Badge pill, xem StatusBadge table |
| **Độ ưu tiên** | "Độ ưu tiên" (`text-xs text-text-muted`) | PriorityBadge (clickable trong edit mode) | Badge pill, xem PriorityBadge table |
| **Assignee** | "Assignee" (`text-xs text-text-muted`) | Avatar circle (28px) + Tên đầy đủ. Null → "Chưa giao" (italic) | `text-sm text-text-primary` |
| **Hạn hoàn thành** | "Hạn hoàn thành" (`text-xs text-text-muted`) | Date format `dd/mm/yyyy`. Quá hạn → `text-destructive`. Null → "—" | `text-sm`, overdue → `text-destructive font-medium` |

**Layout:** CSS Grid `grid-cols-2 gap-4` hoặc flex 2 columns. Mỗi cell: label trên, value dưới.

#### Description Section

| Thuộc tính | Chi tiết |
|------------|----------|
| **Label** | "Mô tả" (`text-xs font-medium text-text-muted uppercase`) |
| **Content** | `text-sm text-text-primary whitespace-pre-wrap`. Background `surface` rounded padding |
| **Empty** | "Chưa có mô tả" (italic, text-muted) |
| **Edit mode** | Textarea, auto-resize |

#### Tabs: Comments / Activity

| Tab | Icon | Nội dung |
|-----|------|----------|
| **Comments** | 💬 | Comment thread (xem FR-06 section 7.6) + input ở dưới |
| **Activity** | 🕐 | Activity log timeline (xem section 7.8) |

- **Default tab:** Comments
- **Tab style:** Underline active (`border-b-2 border-primary text-primary`), inactive (`text-text-muted`)

#### Comment Section (trong tab Comments)

| Thành phần | Chi tiết |
|------------|----------|
| **Section header** | "BÌNH LUẬN" (`text-xs font-semibold text-text-muted uppercase tracking-wider`) |
| **Comment item** | Avatar circle (32px) + Tên (bold) + Timestamp (caption, text-muted) + Content text |
| **@mention** | `@username` highlight màu `primary`, font-medium. Click → không có action |
| **Comment input** | Rounded input bar. Placeholder "Viết bình luận (@ để nhắc tên)..." + Send button (icon ➤, primary color) |
| **Empty** | "Chưa có bình luận nào. Hãy viết bình luận đầu tiên." |

- **Assignee "[Removed User]":** Avatar xám + text italic
- **Overdue:** `OverdueBadge` hiển thị cạnh title (góc phải), dùng `AlertCircle` icon + "Overdue", `rounded-full`
- **Edit fields:** Click "Chỉnh sửa" → enable inline edit cho title, assignee, priority, due date, description. Nút **"Lưu thay đổi"** (primary) + **"Hủy"** (outlined) nằm **dưới phần Mô tả**, trước tabs
- **Permission:** Chỉ Creator/Assignee/Manager/Admin có nút "Chỉnh sửa". Member xem task khác → read-only (ẩn edit/delete)

#### States của Task Detail Sheet

| State | UI |
|-------|-----|
| **Loading** | Skeleton: title bar + 2×2 meta grid + description block + tab placeholder. Hiển thị khi API > 300ms |
| **Error** | ErrorState component bên trong sheet: "Không thể tải task. Thử lại?" + nút Retry |
| **Not found** | "Task không tồn tại hoặc đã bị xóa." + nút đóng sheet |
| **Read-only** (Member xem task khác) | Ẩn nút "Chỉnh sửa" + nút delete. StatusBadge dropdown disabled. Chỉ xem + comment |

#### Soft Delete & Trash

- **Xóa task:** Chỉ Admin/Manager. Nút 🗑 trong header → Confirm Dialog
- **Sau xóa:** Task biến mất khỏi list/board. Toast: "Task đã được chuyển vào thùng rác."
- **Activity log:** Ghi "Deleted by [name] at [timestamp]"

### 7.5 FR-05: Chuyển trạng thái Task

#### Click dropdown đổi status

- **Trigger:** Click `StatusBadge` trên task card hoặc task detail
- **Dropdown:** 4 options: To Do / In Progress / In Review / Done (với status colors)
- **Optimistic:** UI cập nhật ngay → rollback nếu API lỗi
- **Permission:** Member chỉ đổi task của mình. Task người khác → dropdown disabled + tooltip

#### Drag-drop trên Kanban (Team + Project Detail)

- **Áp dụng:** Team Kanban (`/app/team`) + Project Detail Kanban (`/app/projects/:id`)
- **Desktop:** Drag task card từ cột này sang cột khác (@dnd-kit/core)
- **Visual feedback:** Card nổi lên (shadow-lg), cột target highlight border
- **Drop:** Update status + activity log + optimistic UI
- **Mobile fallback:** Không có drag-drop. Dùng click dropdown thay thế
- **Permission matrix:**

| Context | Admin | Manager | Member |
|---------|:-----:|:-------:|:------:|
| **Team Kanban** | ✅ Drag mọi task | ✅ Drag mọi task | ❌ Không truy cập được |
| **Project Detail** | ✅ Drag mọi task | ✅ Drag mọi task | ✅ Chỉ drag task assign cho mình |

- **Member task không phải mình:** Card hiển thị bình thường nhưng `draggable={false}`, cursor default, không có drag handle

### 7.6 FR-06: Comment

#### Comment Thread (trong TaskDetailSheet)

- **Vị trí:** Tab "Chi tiết" trong task detail, phần dưới
- **List:** Sorted by `created_at` ascending (cũ nhất trên, mới nhất dưới)
- **Mỗi comment:** Avatar (sm) + Tên (bold) + Timestamp (caption) + Content
- **@mention highlight:** `@username` hiển thị màu `primary`, bold
- **Xóa comment:** Chỉ author. Icon trash nhỏ khi hover, confirm alert nhỏ
- **Empty state:** "Chưa có comment nào. Hãy viết comment đầu tiên."

#### @mention Autocomplete

- **Trigger:** Gõ `@` trong comment textarea
- **Vị trí dropdown:** Hiển thị **phía trên** textarea (CSS `bottom: 100%`), không phải phía dưới — tránh bị che bởi footer/keyboard
- **Dropdown:** Danh sách members workspace, filter by name theo ký tự sau `@`
- **Chọn:** Click hoặc Enter → insert `@username` vào textarea, cursor đặt sau tên
- **Self-mention:** Cho phép gõ nhưng KHÔNG tạo notification

#### @mention Highlight (hiển thị trong comment đã post)

- **Thuật toán:** Character-scan (không dùng regex split) — duyệt nội dung, khi gặp `@` thì so khớp với danh sách member names (dài nhất trước để tránh match partial)
- **Multi-word names:** Tên có khoảng trắng/số (vd: `acc fam 3`, `Nguyễn Văn A`) phải highlight **toàn bộ cụm** `@acc fam 3` thành 1 khối xanh, không được tách rời
- **Style:** `text-primary font-medium bg-primary/5 rounded px-0.5`
- **Fallback:** Nếu tên sau `@` không khớp member nào → hiển thị như plain text

### 7.7 FR-09: Notification

#### Notification Bell (Header)

- **Icon:** Bell icon (`icon-md`) + `NotificationBadge`
- **Badge:** Số unread (1–99) hoặc "99+". Ẩn khi 0
- **Click:** Toggle `NotificationDropdown`

#### NotificationDropdown

```
┌──────────────────────────────────────┐
│  Thông báo          Đánh dấu tất cả │  ← Header
│                        đã đọc ✓✓    │
├──────────────────────────────────────┤
│ 🔵 📋 Bạn được assign task mới:     │  ← Unread (bg nhẹ + dot xanh)
│       "Fix login bug"          ✓    │  ← Nút ✓ đánh dấu đã đọc
│       2 phút trước                  │
├──────────────────────────────────────┤
│ 🔵 💬 Tester đã comment vào task    │
│       "Update API"             ✓    │
│       15 phút trước                 │
├──────────────────────────────────────┤
│    ⏰ Task "Deploy" sắp đến hạn     │  ← Đã đọc (no dot, transparent)
│       vào 28/04/2026                │
│       1 giờ trước                   │
├──────────────────────────────────────┤
│    📋 Bạn được assign task mới:     │
│       "Write tests"                 │
│       3 giờ trước                   │
├──────────────────────────────────────┤
│    ... (scroll nếu > 5 items) ...   │
└──────────────────────────────────────┘
```

- **Position:** Fixed dưới bell icon, right-aligned
- **Width:** 380px (desktop) / `calc(100vw - 24px)` (mobile)
- **z-index:** 50
- **Header:** "Thông báo" (`text-sm font-semibold`) + nút "Đánh dấu tất cả đã đọc" (bên phải)
- **Nút "Đánh dấu tất cả đã đọc":**
  - **Icon:** `CheckCheck` (lucide, `w-3.5 h-3.5`) + text
  - **Style:** `text-xs font-medium text-primary hover:text-primary-hover`
  - **Hiển thị:** Chỉ hiện khi `unreadCount > 0`, ẩn khi không có unread
  - **Action:** `PATCH /api/notifications/read-all` → badge = 0, tất cả items chuyển read style
  - **Optimistic UI:** Set `unreadCount = 0` ngay, rollback nếu API lỗi
- **List:** Max 50 items, hiển thị tối đa 5 item (~360px), quá 5 → scrollbar (`max-h-[360px] overflow-y-auto`)
- **Mỗi item:**
  - Dot xanh (unread) + Icon emoji (theo type) + message + timestamp relative
  - **Nút toggle đọc/chưa đọc (từng item):**
    - **Icon:** `Check` (lucide, `w-4 h-4`), luôn hiện trên tất cả items
    - **Unread:** `text-text-muted hover:text-primary` → click = đánh dấu đã đọc
    - **Read:** `text-green-500 hover:text-text-muted` → click = đánh dấu chưa đọc (toggle)
    - **API:** `PATCH /api/notifications/:id/read` (toggle: read↔unread)
    - **Lưu ý:** Click nút ✓ chỉ toggle trạng thái, KHÔNG navigate đến task
  - Unread: `bg-primary/[0.03]` + dot xanh + ✓ xám
  - Read: transparent, no dot, ✓ xanh lá
- **Click item (vùng text):** Mark read + navigate to task (mở TaskDetailSheet)
- **Sort:** `created_at` descending — mới nhất ở trên cùng
- **Empty:** icon 🔔 + "Không có thông báo mới" (`text-sm text-text-muted`)
- **Polling:** 5 giây refresh `/api/notifications/unread-count`

#### Notification Trigger Messages

| Trigger | Message |
|---------|---------|
| Assign task | "Bạn được assign task mới: [Title]" |
| Comment trên task (trừ self) | "[Tên] đã comment vào task [Title]" |
| @mention (trừ self) | "[Tên] đã nhắc đến bạn trong task [Title]" |
| Task due trong 24h | "Task [Title] sắp đến hạn vào [date]" |
| Member accept invite | "[Tên] đã tham gia workspace" (→ Admin) |
| Assignee bị xóa khỏi workspace | "Assignee của task [Title] đã rời workspace. Cần re-assign." (→ Manager) |

### 7.8 FR-10: Activity Log

#### Activity Tab (trong TaskDetailSheet)

- **Vị trí:** Tab "Activity" trong task detail
- **Sort:** `created_at` ascending — cũ nhất ở trên, mới nhất ở dưới (timeline style)
- **Mỗi entry:** Avatar (xs) + Tên + Hành động + Timestamp
- **Entry types:**

| Type | Format hiển thị |
|------|----------------|
| Created | "Created by [Tên] at [timestamp]" |
| Status changed | "[Tên] changed status from [Old Status] → [New Status] at [timestamp]" |
| Field edited | "[Tên] updated [field]: [old] → [new] at [timestamp]" |
| Commented | "[Tên] commented at [timestamp]" |
| Deleted | "[Tên] deleted task at [timestamp]" |
| Restored | "[Tên] restored task at [timestamp]" |

- **No-op:** Nếu giá trị không thay đổi → KHÔNG tạo entry
- **Null value placeholders:**
  - assignee = null → hiển thị `(chưa assign)`
  - due_date = null → hiển thị `(không có)`
- **Không thể xóa:** Không có nút delete, không có endpoint DELETE
- **Empty state:** "Chưa có hoạt động nào"

### 7.9 FR-07: My Tasks (`/app/my-tasks`)

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Task của tôi                                                   │
│  Tất cả công việc được giao cho bạn trong workspace này.        │
├─────────────────────────────────────────────────────────────────┤
│  [🔍 Tìm kiếm task...          ] [↻]   [▽] [Tất cả] [To Do] [In Progress] │
├─────────────────────────────────────────────────────────────────┤
│  ▌ Fix login bug         ● Website    🔴 Quá hạn   High       │
│  ▌ Update payment flow   ● Mobile     🔴 Quá hạn   Urgent     │
│    Redesign homepage     ● Website    25/04/2026   Medium      │
│    API integration       ● Backend    30/04/2026   High        │
│    Write unit tests      ● Backend    —            Low         │
├─────────────────────────────────────────────────────────────────┤
│  (▌= border-left đỏ 3px cho Overdue tasks)                      │
└─────────────────────────────────────────────────────────────────┘
```

#### Page Header

- **Title:** `Task của tôi` (text-2xl font-bold text-slate-900)
- **Subtitle:** `Tất cả công việc được giao cho bạn trong workspace này.` (text-sm text-slate-500, mt-1)

#### Toolbar (dòng dưới title)

Layout: `flex items-center gap-2`, căn trái search — căn phải filter group.

| Control | Spec |
|---------|------|
| **Search input** | `h-9`, `w-[200px]`, icon 🔍 bên trái trong input, placeholder "Tìm kiếm task...", border `border-slate-200`, `rounded-lg`, client-side filter instant |
| **Refresh button** | Icon button `h-9 w-9`, border `border-slate-200`, icon `↻` (RefreshCw), spinner khi loading, `rounded-lg` |
| **Filter icon** | Icon `▽` (SlidersHorizontal) text-slate-500, visual separator trước filter pills |
| **Filter pills** | `Tất cả` / `To Do` / `In Progress` — pill style: `px-3 py-1 rounded-md text-sm font-medium`. Active: `bg-violet-600 text-white`. Inactive: `bg-transparent text-slate-600 hover:bg-slate-100` |

> **Lưu ý:** Filter pills nằm bên phải, cùng hàng với search. Không dùng `rounded-full` mà dùng `rounded-md`.

#### Task List

- **Sắp xếp:**
  1. Overdue tasks (đỏ) lên đầu
  2. Có due date → sort tăng dần
  3. Không có due date → xuống cuối
- **Exclude:** Tasks status = Done không hiển thị
- **Search filter:** Client-side, lọc theo `title` chứa keyword (case-insensitive), instant (không debounce vì data đã load sẵn)

#### Task Card (trong My Tasks)

- Title (body-medium)
- Project label (color dot + name, caption)
- Due date (caption) + `OverdueBadge` nếu quá hạn
- `StatusBadge` + `PriorityBadge`
- Click → mở `TaskDetailSheet`

#### Overdue Highlight

- Task card có border-left `destructive` (đỏ 3px)
- `OverdueBadge` hiển thị (icon clock + "Quá hạn")
- Luôn nằm đầu list

#### Empty State

- "Bạn chưa có task nào. Hãy liên hệ Manager để được assign công việc."
- Icon 📋 lớn

#### Loading & Error States

| State | UI |
|-------|-----|
| **Loading** | Skeleton: 5 task card placeholders (title bar + avatar circle + 2 badge rects). Hiển thị khi API > 300ms |
| **Error** | ErrorState component: icon ⚠️ + "Không thể tải danh sách công việc" + nút "Thử lại" |
| **Filter active + 0 results** | "Không có task nào với bộ lọc này." (text nhỏ, không phải full empty state) |

### 7.10 FR-08: Team Kanban (`/app/team`)

#### Layout

```
+----------------------------------------------------------+
| Team Kanban                                              |
| Xem va quan ly tat ca cong viec cua team trong WS nay.  |
+----------------------------------------------------------+
| [Search] [Du an: Tat ca v] [Assignee: Tat ca v]          |
| [Uu tien: Tat ca v] [dd/mm/yy] - [dd/mm/yy] [↻] [+Task] |
+-------------+--------------+--------------+-------------+
| • TO DO  3  |• IN PROGRESS7|• IN REVIEW 2 | • DONE   6  |
+-------------+--------------+--------------+-------------+
| [Task Card] |  [Task Card] |  [Task Card] | [Task Card] |
| [Task Card] |  [Task Card] |              | [Task Card] |
| ...         |              |              | ...         |
+-------------+--------------+--------------+-------------+
```

#### Header

- **Title:** `Team Kanban` (h1, text-2xl font-bold)
- **Subtitle:** "Xem va quan ly tat ca cong viec cua team trong workspace nay." (text-sm text-text-secondary)

#### Filter Bar (single inline row)

| Control | Type | Behavior |
|---------|------|----------|
| **Search** | Text input (h-9, search icon inside left) | Client-side filter, instant, placeholder "Tim kiem task..." |
| **Du an: Tat ca** | Native `<select>` w/ custom chevron | Filter by `project_id`, lists active projects |
| **Assignee: Tat ca** | Native `<select>` w/ custom chevron | Filter by `assignee_id`, lists workspace members |
| **Uu tien: Tat ca** | Native `<select>` w/ custom chevron | Filter by `priority` (Low/Medium/High/Urgent) |
| **Date From - Date To** | Two `<input type="date">` (h-9, w-140px each) | Filter tasks where `due_date` within range |
| **Refresh** | Icon button (h-9 w-9, border) | Silent refetch (`loadTasks(true)`), spinner while `isRefreshing` |
| **Xoa bo loc** | Text button (visible only when `hasActiveFilters`) | Resets all filters |
| **+ Them Task** | Dark button (`bg-gray-900 hover:bg-gray-800`, h-9, right-aligned) | Opens `TaskFormSheet` slide-over, Admin/Manager only |

**Filter count hint** (below bar, when active):
`"Dang hien thi X / Y task"` — text-xs text-text-muted

**Filtering strategy:** All filters are **client-side** via `useMemo`:
- Tasks fetched **once** on mount: `GET /api/tasks/team`
- Re-fetched **silently** after status change or task creation
- No API round-trip per filter change — instant UX

#### Column Headers

```
● TO DO   3
● IN PROGRESS  7
● IN REVIEW  2
● DONE   6
```

- Colored dot (`w-2 h-2 rounded-full`) — color matches `--status-*` CSS variable
- Label: `text-xs font-bold uppercase tracking-widest`, **same color as dot** (not grey)
- Count: `text-xs font-semibold text-text-muted` — plain number, no pill/badge background
- Layout: `flex items-center gap-2 px-1 pb-3`

#### Task Card (Kanban) — 4-row layout

```
Row 1: ● DU AN TEN  (color dot + project name, text-[11px] text-text-muted uppercase)
Row 2: Task title   (text-base font-semibold, line-clamp-2)
Row 3: [Status] [Priority] [Overdue?]  (badges, flex-wrap)
Row 4: [Avatar] Name        Due Date   (space-between, text-sm)
```

- **Overdue:** `border-l-[3px] border-l-destructive` + "Overdue" badge (destructive/10 bg, red text + CalendarX2 icon)
- **Draggable cursor:** `cursor-grab / active:cursor-grabbing` (Admin/Manager or own task)
- **Hover:** `hover:shadow-md hover:border-border-focus/30`
- **Drag ghost:** 2deg rotation, shadow-xl overlay, `min-w-[260px] max-w-[320px]`

#### Drag & Drop

- Library: `@dnd-kit/core`, sensor: `PointerSensor(distance: 8)`
- Collision: `columnOnlyCollision` — custom `rectIntersection` scoped to column IDs only
- `DragOverlay dropAnimation={null}` for instant snap feeling
- **Optimistic UI:** status updated immediately, rollback on API error + toast
- **Mobile fallback** (`window.innerWidth < 768`): `StatusDropdown` click-based instead of drag

#### Permissions

| Role | Access |
|------|--------|
| Admin | Full: view all tasks, drag-drop, create task |
| Manager | Full: view all tasks, drag-drop, create task |
| Member | Redirect to `/app/my-tasks` (immediate via `useEffect`) |

#### Loading & Error States

| State | UI |
|-------|-----|
| **Loading (first load)** | Skeleton: 4 cols x 3 card skeletons, `animate-pulse` |
| **Silent refresh** | `isRefreshing` spinner in refresh button only, no skeleton |
| **API error** | Centered warning icon + message + "Thu lai" button |
| **Filter match = 0** | Centered empty state icon + "Xoa bo loc" CTA |
| **Board has no tasks** | Centered empty state + guidance text |

### 7.11 FR-11: Reports (`/app/reports`)

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Báo cáo                                                │
├─────────────────────────────────────────────────────────┤
│  Tasks hoàn thành theo tuần                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │  12│        ██                                  │    │
│  │  10│   ██   ██                                  │    │
│  │   8│   ██   ██   ██                             │    │
│  │   6│   ██   ██   ██                             │    │
│  │   4│   ██   ██   ██   ▒▒                        │    │
│  │   2│   ██   ██   ██   ▒▒                        │    │
│  │   0├───┴────┴────┴────┴──                       │    │
│  │     31/03  07/04  14/04  21/04                  │    │
│  │                          (tuần này)             │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Thống kê thành viên                                    │
│  ┌──────────┬──────────┬──────────┬───────┬───────┐    │
│  │Thành viên│ Được giao│ Hoàn thành│Quá hạn│Tỷ lệ  │    │
│  ├──────────┼──────────┼──────────┼───────┼───────┤    │
│  │Nguyễn A  │    10    │     8    │   1   │  80%  │    │
│  │Trần B    │     5    │     5    │   0   │ 100%  │    │
│  │Lê C      │     0    │     0    │   0   │  N/A  │    │
│  └──────────┴──────────┴──────────┴───────┴───────┘    │
└─────────────────────────────────────────────────────────┘
```

- **Bar Chart:** "Tasks hoàn thành theo tuần" — 4 cột cho 4 tuần gần nhất
  - Cột tuần hiện tại label "(tuần này)" — data partial (▒▒)
  - Trục Y: số task, trục X: label tuần (VD: "14/04 – 20/04")
- **Member Stats Table:**

| Thành viên | Được giao | Hoàn thành | Quá hạn | Tỷ lệ (%) |
|------------|-----------|------------|---------|------------|
| Nguyễn A | 10 | 8 | 1 | 80% |
| Trần B | 5 | 5 | 0 | 100% |
| Lê C | 0 | 0 | 0 | N/A |

- **Click tên member:** Mở My Tasks của member đó (read-only)
  - Read-only: KHÔNG hiển thị nút edit/delete/comment
  - Breadcrumb: "Báo cáo > [Tên member]"
- **Permission:** Chỉ Admin/Manager
- **Empty workspace:** Chart hiển thị 0 tất cả tuần + empty state text

### 7.12 FR-12: Search (`/app/*` header)

#### Search Box (Header)

- **Vị trí:** Cột Center của header — **luôn nằm chính giữa** (CSS Grid `grid-cols-[1fr_auto_1fr]`)
- **Width:** `clamp(280px, 36vw, 520px)` — co dãn theo viewport, tối đa 520px
- **Hiển thị:** Ẩn trên mobile (`hidden sm:flex`), hiện từ ≥ 640px
- **Placeholder:** "Tìm kiếm task..."
- **Shortcut badge:** `⌘K` hiển thị bên phải (ẩn trên viewport < 768px)
- **Min chars:** 1 ký tự trước khi search
- **Debounce:** 300ms
- **Hover style:** Border đổi sang `primary/40`, icon 🔍 đổi sang màu `primary`
- **Border radius:** `rounded-lg` (8px)

#### SearchDropdown

- **Trigger:** Gõ ≥ 2 ký tự → dropdown hiện dưới search box
- **Width:** Bằng search bar (match `clamp(280px, 36vw, 520px)`) — full-width trên mobile
- **Max results:** 10
- **Mỗi result:** Task title (bold keyword match) + Project name + Assignee name (caption)
- **Click result:** Mở `TaskDetailSheet` + đóng dropdown
- **Loading:** Spinner nhỏ trong dropdown khi API > 300ms
- **Empty:** "Không tìm thấy task nào với từ khóa này"
- **Keyboard:** Arrow up/down navigate, Enter select, Escape đóng
- **Workspace isolation:** Chỉ search trong workspace hiện tại

### 7.13 Trash (`/app/trash`)

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Thùng rác                         [Filter: Project ▾]  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┬─────────┬──────────┬──────────┬─────────┐│
│  │ Tiêu đề  │ Dự án   │ Người xóa│ Ngày xóa │ Còn lại ││
│  ├──────────┼─────────┼──────────┼──────────┼─────────┤│
│  │ Task A   │Proj X   │Nguyễn A  │20/04/2026│12d 5h   ││ [Khôi phục]
│  │ Task B   │Proj Y   │Trần B    │10/04/2026│ 2d 1h   ││ [Khôi phục]
│  │ Task C   │Proj X   │Nguyễn A  │18/04/2026│ 8d 3h   ││ [Disabled ]
│  │          │[Archived]│          │          │         ││ tooltip ↑
│  └──────────┴─────────┴──────────┴──────────┴─────────┘│
└─────────────────────────────────────────────────────────┘
```

- **Chỉ Admin thấy** nav item và truy cập được
- **Table/List:**

| Tiêu đề | Dự án | Người xóa | Ngày xóa | Còn lại | Actions |
|---------|-------|-----------|----------|---------|---------|
| Task A | Project X | Nguyễn A | 20/04/2026 | Còn 12 ngày 5 giờ | [Khôi phục] |
| Task B | Project Y | Trần B | 10/04/2026 | Còn 2 ngày 1 giờ | [Khôi phục] |

- **Countdown "Còn lại":** Tính từ `deleted_at` + 30 ngày. Format: "Còn X ngày Y giờ"
- **Task > 30 ngày:** Tự động ẩn khỏi list (API không trả)
- **Filter:** Dropdown filter theo project
- **Nút "Khôi phục":** 
  - Click → restore task (`deleted_at = null`)
  - Nếu project gốc đã archive → nút disabled + toast "Dự án đã archive. Không thể khôi phục task."
  - Nếu assignee đã bị kick → restore OK, `assignee_id = null`
- **Empty state:** "Thùng rác trống. Không có task nào đã xóa."

### 7.14 Invite Page (`/invite?token=xxx`)

- **Token hợp lệ:** Hiển thị tên workspace + nút "Tham gia workspace"
  - Nếu chưa có tài khoản → redirect register trước, sau register tự join
  - Nếu đã có tài khoản → join workspace + redirect `/app/my-tasks`
- **Token hết hạn (> 48h):** Page hiển thị "Link mời đã hết hạn. Vui lòng liên hệ Admin để được mời lại."
- **Token không hợp lệ:** "Link mời không hợp lệ."

---

## 8. Ma trận quyền và hành vi UI

### 8.1 Sidebar Visibility

| Nav Item | Admin | Manager | Member |
|----------|:-----:|:-------:|:------:|
| Công việc của tôi | ✅ Hiện | ✅ Hiện | ✅ Hiện |
| Kanban Team | ✅ Hiện | ✅ Hiện | ❌ **Ẩn** |
| Dự án | ✅ Hiện | ✅ Hiện | ✅ Hiện |
| Báo cáo | ✅ Hiện | ✅ Hiện | ❌ **Ẩn** |
| Cài đặt | ✅ Hiện | ❌ **Ẩn** | ❌ **Ẩn** |
| Thùng rác | ✅ Hiện | ❌ **Ẩn** | ❌ **Ẩn** |

> **Quy tắc:** Không có quyền → **ẩn hoàn toàn** nav item (không disable).

### 8.2 Page-level Access

| Trang | Admin | Manager | Member |
|-------|:-----:|:-------:|:------:|
| `/app/my-tasks` | ✅ Full | ✅ Full | ✅ Full |
| `/app/team` | ✅ Full (drag-drop) | ✅ Full (drag-drop) | ❌ Redirect `/app/my-tasks` |
| `/app/projects` | ✅ Full | ✅ Full | ✅ View only (không tạo project) |
| `/app/reports` | ✅ Full | ✅ Full | ❌ Redirect `/app/my-tasks` |
| `/app/settings` | ✅ Full | ❌ Redirect | ❌ Redirect |
| `/app/settings/members` | ✅ Full | ❌ Redirect | ❌ Redirect |
| `/app/trash` | ✅ Full | ❌ Redirect | ❌ Redirect |

### 8.3 Action-level Permission UI

| Action | Admin | Manager | Member |
|--------|-------|---------|--------|
| Tạo project | ✅ Nút hiện | ✅ Nút hiện | ❌ Nút **ẩn** |
| Archive project | ✅ Nút hiện | ✅ Nút hiện | ❌ Nút **ẩn** |
| Tạo task (Sidebar) | ✅ Nút hiện | ✅ Nút hiện | ❌ Nút **ẩn** |
| Tạo task (Project Detail) | ✅ | ✅ | ✅ |
| Edit task (bất kỳ) | ✅ | ✅ | ❌ **Read-only** |
| Edit task (của mình) | ✅ | ✅ | ✅ |
| Xóa task (soft) | ✅ | ✅ | ❌ Nút **ẩn** |
| Restore task | ✅ | ❌ Nút ẩn | ❌ Nút ẩn |
| Đổi status (task mình) | ✅ | ✅ | ✅ |
| Đổi status (task khác) | ✅ | ✅ | ❌ **Disabled + tooltip** |
| Drag-drop Kanban | ✅ | ✅ | ❌ (không thấy Kanban) |
| Comment | ✅ | ✅ | ✅ |
| Invite member | ✅ | ❌ Ẩn | ❌ Ẩn |
| Đổi role member | ✅ | ❌ Ẩn | ❌ Ẩn |
| Xóa member | ✅ | ❌ Ẩn | ❌ Ẩn |
| Đổi tên workspace | ✅ | ❌ Ẩn | ❌ Ẩn |
| Xóa workspace | ✅ | ❌ Ẩn | ❌ Ẩn |
| Search | ✅ | ✅ | ✅ |

### 8.4 Quy tắc hiển thị Permission

| Loại | Khi nào | UI |
|------|---------|-----|
| **Ẩn hoàn toàn** | User không có quyền với feature/trang | Nav item không hiện, nút không render |
| **Disabled + Tooltip** | Action visible nhưng không có quyền cho trường hợp cụ thể | Nút grey out, opacity-50, tooltip giải thích |
| **Read-only** | Có quyền xem nhưng không edit | Không hiển thị edit controls, form fields disabled |
| **Redirect** | Cố truy cập URL trực tiếp | Redirect về `/app/my-tasks` |

### 8.5 Workspace Isolation UI

| Tình huống | Hành vi UI |
|------------|-----------|
| User gọi API workspace khác | API 403 → không hiển thị data |
| User bị xóa khỏi workspace active | Auto-switch sang workspace khác + toast "Bạn đã bị xóa khỏi workspace [name]." |
| User bị xóa khỏi workspace duy nhất | Redirect trang Tạo Workspace |
| Switch workspace | Reload toàn bộ: projects, tasks, members, notifications. URL giữ nguyên |

---

## 9. Responsive và Accessibility

### 9.1 Mobile Rules (< 768px)

> **Breakpoint tối thiểu được hỗ trợ: ≥ 375px** (NFR-05 — iPhone SE 2020 trở lên). Layout dưới 375px không được đảm bảo.

| Element | Behavior |
|---------|----------|
| **Sidebar** | Ẩn mặc định. Mở bằng hamburger menu (overlay). Đóng khi click item hoặc backdrop |
| **Search** | Full-width, SearchDropdown full-width |
| **Notification dropdown** | Full-width |
| **Slide-over (TaskDetail)** | Full-screen (`100vw`, `100vh`) |
| **Kanban board** | Horizontal scroll. Chỉ 1 cột visible. Swipe để xem cột khác |
| **Drag-drop** | **Không có**. Fallback: click `StatusBadge` → dropdown đổi status |
| **Data table** | Horizontal scroll với scroll indicator |
| **Filter bar** | Collapsible — nút "Bộ lọc" toggle hiện/ẩn filter options |
| **Toast** | Bottom-center thay bottom-right |
| **Dialog** | Near full-screen với padding |

### 9.2 Tablet Rules (768px – 1023px)

| Element | Behavior |
|---------|----------|
| **Sidebar** | Collapsed (icon only, 64px). Expand on hover hoặc click |
| **Kanban** | 2 cột visible, scroll cho cột còn lại |
| **Slide-over** | 480px width |

### 9.3 Desktop Rules (≥ 1024px)

| Element | Behavior |
|---------|----------|
| **Sidebar** | Expanded (256px, icon + text) |
| **Kanban** | 4 cột full width |
| **Slide-over** | 480px width |

### 9.4 Keyboard Navigation

| Context | Phím | Hành vi |
|---------|------|---------|
| **Kanban board** | `Tab` | Di chuyển giữa task cards |
| **Kanban board** | `Enter` | Mở task detail |
| **Kanban board** | `Space` | Pick up / drop card (drag-drop alternative) |
| **Search dropdown** | `↑` `↓` | Navigate giữa results |
| **Search dropdown** | `Enter` | Select result, mở task |
| **Search dropdown** | `Escape` | Đóng dropdown |
| **Dialog** | `Escape` | Đóng dialog |
| **Slide-over** | `Escape` | Đóng panel |
| **Comment** | `Ctrl+Enter` | Submit comment |
| **@mention dropdown** | `↑` `↓` `Enter` | Navigate và chọn member |

### 9.5 Accessibility (WCAG 2.1 AA)

| Yêu cầu | Chi tiết |
|----------|----------|
| **Labels** | Mọi form element có `<label>` associate bằng `htmlFor` |
| **Focus ring** | 2px ring `border-focus` trên mọi interactive element. Visible khi keyboard focus |
| **Contrast** | Text/background contrast ratio ≥ 4.5:1 (normal text), ≥ 3:1 (large text) |
| **Screen reader** | Dùng `aria-label`, `aria-describedby`, `role` cho custom components |
| **Alt text** | Avatar có `alt="Ảnh đại diện [Tên]"` |
| **Heading hierarchy** | Mỗi trang có 1 `<h1>`, tiếp theo `<h2>`, `<h3>` tuần tự |
| **Touch target** | Min 44×44px cho nút/link trên mobile |
| **Skip link** | "Bỏ qua điều hướng" link ẩn, hiện khi Tab đầu tiên |
| **Live regions** | Toast, notification badge dùng `aria-live="polite"` |
| **Motion** | Respect `prefers-reduced-motion` — tắt animation khi user setting |

### 9.6 Acceptance Criteria

- Lighthouse Accessibility score ≥ 90
- Keyboard-only navigation qua toàn bộ Kanban board
- Screen reader đọc được mọi trạng thái (badge, toast, error)
- Touch target ≥ 44px trên mobile

---

## 10. Non-Functional Requirements

> Nguồn: **PRD.md Section 8 (NFR-01 → NFR-08)**. Design system phản ánh các ràng buộc này vào UX patterns, loading states, error states và browser targets.

### 10.1 NFR-01 — Performance

| Tiêu chí | Target | Design pattern liên quan |
|----------|--------|--------------------------|
| LCP (trang đầu tiên) | < 2.5 giây trên kết nối 4G | Skeleton loading (4.15), ưu tiên render content above-the-fold |
| API read endpoints (p95) | < 500ms | Loading state hiện sau 300ms (1.3); không block UI |
| API write endpoints (p95) | < 1 giây | Optimistic UI (1.3) — update UI trước, rollback nếu lỗi |
| Search debounce | 300ms | SearchBar dùng debounce 300ms, kết quả max 10 items |
| Bundle size | Lazy-load route không critical | Dynamic import cho TaskDetailSheet, Reports |

### 10.2 NFR-02 — Availability & Reliability

| Tiêu chí | Target | Design pattern liên quan |
|----------|--------|--------------------------|
| Uptime SLA | ≥ 99.5% (< 3.65 giờ downtime/tháng) | — |
| Health check | `GET /health → { status: "ok" }` | Backend endpoint, không có UI |
| Scheduled maintenance | Thông báo trước 24 giờ, ngoài giờ hành chính | Toast info hoặc banner thông báo bảo trì |
| Lỗi kết nối | Banner sticky top `OfflineBanner` | Xem 4.17 Error State → Offline |

### 10.3 NFR-03 — Security

| Tiêu chí | Chi tiết | Ảnh hưởng UI |
|----------|----------|--------------|
| Password hash | bcrypt, cost factor ≥ 12 (`$2b$12$`) | Không hiện password trong bất kỳ API response / log nào |
| Transport | HTTPS/TLS 1.2+ bắt buộc | — |
| JWT | Expiry 7 ngày; `Authorization: Bearer <token>` | Intercept 401 → redirect `/login?expired=true` + toast "Phiên làm việc đã hết hạn." (10.2 microcopy) |
| Input sanitization | XSS/SQL injection prevention trên toàn bộ form | `sanitizeMiddleware` backend; form validate client-side (5.1) |
| Rate limiting | 100 req/phút per IP (API public); 20 req/phút cho `/auth` | Toast lỗi "Quá nhiều yêu cầu. Vui lòng thử lại sau." (HTTP 429) |
| Workspace isolation | Row-level: workspace A không lộ sang workspace B | API luôn lọc theo `workspaceId` từ header; 8.5 Workspace Isolation UI |

### 10.4 NFR-04 — Scalability

| Tiêu chí | Chi tiết | Design pattern liên quan |
|----------|----------|--------------------------|
| Database scale | 10 workspace × 50 member × 10,000 task/ws không cần re-architect | Indexes trên FK + search fields; pagination nếu list > 100 items |
| Stateless API | Không dùng server-side session; JWT-based auth | `x-workspace-id` qua header, không qua cookie session |
| Horizontal scaling | API có thể chạy nhiều instance song song | — |

### 10.5 NFR-05 — Usability

> *(Đã được định nghĩa chi tiết trong Section 9 Responsive & Accessibility + Section 1.2 Nguyên tắc)*

| Tiêu chí | Target | Tham chiếu |
|----------|--------|------------|
| Responsive | ≥ 375px (mobile) — ≥ 1024px (desktop) | 9.1, 9.3 |
| Core action ≤ 3 click | Tạo task, đổi status | 1.2 Speed first |
| Loading state | Hiện skeleton/spinner khi API > 300ms | 1.3, 4.15 |
| Empty state | Luôn có hướng dẫn hành động | 1.3, 4.16 |

### 10.6 NFR-06 — Accessibility

> *(Đã được định nghĩa đầy đủ trong Section 9.4–9.6)*

| Tiêu chí | Target | Tham chiếu |
|----------|--------|------------|
| WCAG 2.1 AA | Lighthouse Accessibility ≥ 90 | 9.5, 9.6 |
| Form labels | `<label>` associate `htmlFor` | 9.5 |
| Keyboard navigation | Tab/Enter/Space trên Kanban | 9.4 |
| Contrast | ≥ 4.5:1 (normal text), ≥ 3:1 (large text) | 9.5 |

### 10.7 NFR-07 — Data Integrity & Backup

| Tiêu chí | Chi tiết | Design pattern liên quan |
|----------|----------|--------------------------|
| DB backup | Tự động hàng ngày, giữ 30 ngày | DevOps (ngoài phạm vi UI) |
| Soft delete | Task dùng `deleted_at` timestamp; không hard delete | Trash page (7.13) — restore trong 30 ngày |
| Restore window | Admin restore task trong vòng 30 ngày kể từ ngày xóa | RestoreButton disabled + tooltip khi > 30 ngày |
| Activity log | Không thể xóa (`DELETE /activity` → 404/405) | Read-only tab "Hoạt động" trong TaskDetail (7.4) |
| Assignee removed | Task giữ nguyên `assigneeId`, Backend trả về cờ `isAssigneeRemoved: true`, hiển thị `[Removed User]` với avatar xám | KanbanBoard, TaskDetailSheet |

### 10.8 NFR-08 — Browser Support

| Browser | Phiên bản tối thiểu | Ghi chú |
|---------|---------------------|---------|
| Chrome | ≥ 110 | Primary target |
| Firefox | ≥ 110 | Full support |
| Safari | ≥ 16 | macOS + iOS |
| Edge | ≥ 110 | Chromium-based |
| Internet Explorer | ❌ Không hỗ trợ | Không polyfill |

> **Lưu ý:** Tính năng CSS dùng trong TaskFlow (`CSS custom properties`, `clamp()`, `gap` trong Flexbox) tương thích đầy đủ với các phiên bản trên. Không dùng `@container` query hay `has()` selector chưa stable.

---

## 11. Content Guidelines và Microcopy

### 11.1 Giọng điệu

| Quy tắc | Ví dụ |
|---------|-------|
| **Ngắn gọn** | "Đã lưu thành công" thay vì "Thay đổi của bạn đã được lưu thành công vào hệ thống" |
| **Rõ ràng** | "Email không hợp lệ" thay vì "Validation failed" |
| **Hành động được** | "Hãy liên hệ Manager để được assign công việc" thay vì "Không có dữ liệu" |
| **Tiếng Việt** | Tất cả UI text. Không mix tiếng Anh (trừ tên riêng: email, workspace) |

### 11.2 Text chuẩn theo loại

#### Toast Messages

| Loại | Text | Variant |
|------|------|---------|
| **Workspace** | | |
| Tạo workspace | "Workspace đã được tạo thành công" | success |
| Đổi tên workspace | "Đã cập nhật tên workspace thành công" | success |
| Tên không đổi | "Tên workspace không thay đổi" | info |
| Xóa workspace | "Workspace đã được xóa" | success |
| **Project** | | |
| Tạo project | "Dự án đã tạo thành công" | success |
| Cập nhật project | "Đã cập nhật dự án thành công" | success |
| Archive project | "Dự án \"[name]\" đã được archive" | success |
| Archive lỗi | "Không thể archive dự án" | error |
| **Task** | | |
| Tạo task | "Task đã tạo thành công" | success |
| Cập nhật task | "Đã cập nhật task thành công" | success |
| Xóa task | "Task đã được chuyển vào thùng rác." | success |
| Restore task | "Task đã được khôi phục thành công" | success |
| Đổi trạng thái | "Đã đổi trạng thái thành [Status]" | success |
| Đổi trạng thái lỗi | "Không thể cập nhật trạng thái. Thử lại?" | error |
| Validation title rỗng | "Tiêu đề không được để trống" | error |
| Validation title dài | "Tiêu đề không được vượt quá 200 ký tự" | error |
| Validation desc dài | "Mô tả không được vượt quá 5000 ký tự" | error |
| **Comment** | | |
| Xóa comment | "Comment đã được xóa" | success |
| Comment lỗi | "Không thể gửi comment" | error |
| **Members** | | |
| Gửi invite | (dynamic message từ API) | success |
| Đổi role | "Đã cập nhật vai trò" | success |
| Xóa member | "Đã xóa thành viên khỏi workspace" | success |
| **Notification** | | |
| Đánh dấu tất cả đã đọc | (silent — không toast, badge reset ngay) | — |
| **System** | | |
| API error generic | "Có lỗi xảy ra. Thử lại?" | error |
| Session expired | "Phiên làm việc đã hết hạn." | info |
| Invite redirect | "Vui lòng đăng nhập để tham gia workspace" | info |
| Bị xóa khỏi workspace | "Bạn đã bị xóa khỏi workspace [name]." | error |

#### Confirm Dialog Messages

| Action | Title | Description |
|--------|-------|-------------|
| Xóa workspace | "Xóa workspace" | "Bạn chắc chắn muốn xóa workspace **[name]**? Tất cả dữ liệu sẽ bị xóa vĩnh viễn." |
| Xóa task | "Xóa task" | "Task sẽ được chuyển vào thùng rác. Admin có thể khôi phục trong 30 ngày." |
| Xóa member | "Xóa thành viên" | "Bạn chắc chắn muốn xóa **[name]** khỏi workspace? Task đã assign sẽ hiển thị '[Removed User]'." |
| Xóa comment | "Xóa comment" | "Bạn chắc chắn muốn xóa comment này?" |

#### Error Messages

| Tình huống | Text |
|------------|------|
| Email trùng register | "Email này đã được đăng ký. Bạn có muốn đăng nhập không?" |
| Sai password | "Email hoặc mật khẩu không đúng." |
| Account locked | "Tài khoản bị khóa tạm thời. Thử lại sau [countdown]." |
| Email đã là member | "Email này đã là thành viên của workspace." |
| Link invite hết hạn | "Link mời đã hết hạn. Vui lòng liên hệ Admin để được mời lại." |
| Workspace name rỗng | "Tên workspace không được để trống" |
| Title rỗng | "Tiêu đề không được để trống" |
| Title > 200 chars | "Tiêu đề không được vượt quá 200 ký tự" |
| Description > 5000 | "Mô tả không được vượt quá 5000 ký tự" |
| Password < 8 chars | "Mật khẩu phải có ít nhất 8 ký tự" |
| Project archived, tạo task | "Dự án đã archive. Không thể tạo task mới." |
| Restore blocked | "Dự án đã archive. Không thể khôi phục task vào dự án này." |
| Không có quyền | "Không có quyền truy cập" |
| Admin tự xóa | "Không thể xóa Admin đang đăng nhập." |
| Xóa workspace cuối | "Bạn phải có ít nhất 1 workspace. Không thể xóa workspace cuối cùng." |
| Status permission | "Chỉ assignee hoặc Manager mới có thể đổi trạng thái" |

### 11.3 Enum Labels (System → UI tiếng Việt)

#### Task Status

| System Value | Label tiếng Việt | Abbreviation |
|-------------|------------------|-------------|
| `ToDo` | Cần làm | — |
| `InProgress` | Đang làm | — |
| `InReview` | Đang review | — |
| `Done` | Hoàn thành | — |

#### Task Priority

| System Value | Label tiếng Việt |
|-------------|------------------|
| `Low` | Thấp |
| `Medium` | Trung bình |
| `High` | Cao |
| `Urgent` | Khẩn cấp |

#### Member Role

| System Value | Label tiếng Việt |
|-------------|------------------|
| `Admin` | Quản trị viên |
| `Manager` | Quản lý |
| `Member` | Thành viên |

#### Special Labels

| Label | Tiếng Việt |
|-------|-----------|
| Archived | Đã archive |
| Pending | Đang chờ |
| Overdue | Quá hạn |
| Removed User | Bị xóa khỏi workspace |
| Unassigned | Chưa phân công |
| N/A (rate) | N/A |

---

## 12. Mapping sang Codebase Frontend

> Tham chiếu project structure từ `requirements.md` section 5.1

### 12.1 Component Mapping

#### `components/ui/` — Shared shadcn/ui primitives

| Component File | Design System Reference |
|---------------|------------------------|
| `button.tsx` | 4.1 Button |
| `input.tsx` | 4.2 Input |
| `textarea.tsx` | 4.4 Textarea |
| `select.tsx` | 4.5 Select |
| `combobox.tsx` | 4.5 Combobox |
| `date-picker.tsx` | 4.6 Date Picker |
| `badge.tsx` | 4.7 Badge (base) |
| `avatar.tsx` | 4.8 Avatar |
| `tooltip.tsx` | 4.9 Tooltip |
| `dropdown-menu.tsx` | 4.10 Dropdown Menu |
| `dialog.tsx` | 4.11 Dialog |
| `tabs.tsx` | 4.12 Tabs |
| `sheet.tsx` | 4.13 Sheet |
| `toast.tsx` / `sonner.tsx` | 4.14 Toast |
| `skeleton.tsx` | 4.15 Skeleton |
| `table.tsx` | 4.18 Data Table |

#### `components/layout/` — App Shell

| Component File | Design System Reference |
|---------------|------------------------|
| `Sidebar.tsx` | 3.2 Sidebar |
| `Header.tsx` | 3.3 Header |
| `AppLayout.tsx` | 3.1 App Layout |
| `AuthLayout.tsx` | 3.1 Auth Layout |

#### `components/common/` — Shared Patterns

| Component File | Design System Reference |
|---------------|------------------------|
| `EmptyState.tsx` | 4.16 Empty State |
| `ErrorState.tsx` | 4.17 Error State |
| `LoadingState.tsx` | 4.15 Skeleton/Loading |
| `OfflineBanner.tsx` | 10.2 NFR-02 Availability + 4.17 Error State |

#### `features/*/components/` — Feature-specific

| Feature | Components | Design System Reference |
|---------|-----------|------------------------|
| `auth` | `LoginForm`, `RegisterForm` | 5.2, 5.3, 7.1 |
| `workspace` | `WorkspaceSwitcher`, `WorkspaceForm`, `WorkspaceSettings` | 3.2, 5.4, 7.2 |
| `workspace` | `MemberList`, `InviteForm`, `RoleBadge` | 5.8, 5.9, 7.2 |
| `projects` | `ProjectCard`, `ProjectForm`, `ArchivedBadge` | 5.5, 7.3 |
| `tasks` | `TaskCard`, `TaskForm`, `TaskDetailSheet` | 4.19, 5.6, 7.4 |
| `tasks` | `StatusBadge`, `PriorityBadge`, `OverdueBadge` | 4.7 |
| `tasks` | `StatusSelector` (dropdown + drag) | 7.5 |
| `comments` | `CommentThread`, `CommentForm`, `MentionAutocomplete` | 5.7, 7.6 |
| `notifications` | `NotificationBell`, `NotificationDropdown`, `NotificationBadge` | 7.7 |
| `reports` | `WeeklyChart`, `MemberStatsTable` | 4.22, 7.11 |
| `search` | `SearchBox`, `SearchDropdown`, `SearchResultItem` | 4.21, 7.12 |
| `trash` | `TrashList`, `TrashItem`, `RestoreButton` | 7.13 |

### 12.2 Server vs Client Components

| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| **Server Component** (default) | Dùng cho static layout, data fetching, SEO | `AppLayout`, `AuthLayout`, page components |
| **Client Component** (`'use client'`) | Chỉ khi cần interactivity | `TaskForm`, `WorkspaceSwitcher`, `StatusSelector`, `CommentForm`, `SearchBox`, `NotificationDropdown`, `Toast`, `Sheet`, `DragDropBoard` |

**Quy tắc cụ thể cho `'use client'`:**

| Cần `'use client'` khi | Ví dụ |
|------------------------|-------|
| Form với React Hook Form | `LoginForm`, `TaskForm`, `InviteForm` |
| Dropdown / Popover | `WorkspaceSwitcher`, `NotificationDropdown`, `SearchDropdown` |
| Drag-drop (@dnd-kit) | `KanbanBoard` |
| Toast (Sonner) | `ToastProvider` |
| Sheet / Dialog | `TaskDetailSheet`, `ConfirmDialog` |
| Zustand store | `useAuthStore`, `useWorkspaceStore` |
| Polling (notifications) | `NotificationProvider` |
| Search (debounce) | `SearchBox` |
| Countdown timer | `LockoutTimer`, `TrashCountdown` |

### 12.3 Naming Conventions

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component file | PascalCase | `TaskCard.tsx`, `SearchDropdown.tsx` |
| Hook file | camelCase, prefix `use` | `useAuth.ts`, `useSearch.ts` |
| Schema file | camelCase | `taskSchema.ts`, `authSchema.ts` |
| Store file | camelCase | `authStore.ts`, `workspaceStore.ts` |
| Util file | camelCase | `apiClient.ts`, `formatDate.ts` |

---

> **Kiểm tra hoàn thiện:**
> - ✅ Mỗi route trong requirements.md có screen/pattern tương ứng (Section 7)
> - ✅ Mỗi FR từ FR-01 đến FR-13 được map tới component và interaction pattern (Section 7)
> - ✅ Mỗi edge case UI trong task.md có state hiển thị tương ứng (Section 6, 7)
> - ✅ Mỗi màn hình chính có đủ loading, empty, error, permission, mobile (Section 6, 9)
> - ✅ Toàn bộ text mẫu dùng tiếng Việt và khớp wording đã chốt (Section 11)
> - ✅ Tất cả 8 NFR từ PRD.md được map vào design patterns (Section 10)
> - ✅ Component mapping khớp project structure requirements.md section 5.1 (Section 12)
> - ✅ FR-13 Trash: layout, countdown format, button states, permission redirect — xem §7.13
