# 🚀 TaskFlow Workflow & Prompts Guide

Tài liệu này tổng hợp các mẫu câu lệnh (prompts) chuẩn để tương tác với AI Agent trong suốt vòng đời dự án TaskFlow, từ khâu lên tài liệu (Documentation) đến khâu thực thi (Execution) và sửa lỗi (Debugging).

---

## 1. 📝 Nhóm Prompts Tạo Tài Liệu (Documentation)

> [!IMPORTANT]
> **Thứ tự bắt buộc:** 1.1 → 1.2 → 1.3. Mỗi bước cần output của bước trước làm ngữ cảnh đầu vào. Không được thực hiện song song hoặc đảo thứ tự.

### 1.1 Tạo file `task.md` (Dành cho Claude Opus 4.6 / GPT-4)
- **Mục đích:** Khởi tạo danh sách công việc và tiêu chí nghiệm thu.
- **Nội dung Prompt:**
  > 1. Đọc và hiểu rõ tài liệu `PRD.md`, `AGENTS.md` và `guide_taskflow.md`. Hãy xác định tài liệu `task.md` với dự án Taskflow này gồm có những phần nào.
  > 2. Hãy thực hiện chi tiết phần đó bám sát `PRD.md`. Chú ý:
  >    - Chia dự án thành 5 Milestone. Copy chính xác các FR, NFR, User Stories, Acceptance Criteria, Edge Cases và Error States tương ứng từ PRD.
  >    - Với mỗi FR, phải lên kế hoạch đầy đủ các loại test (API test, Unit Test, E2E testing).
  >    - Với mỗi FR, phải có đủ checklist cho AI (pass hết tất cả test, Definition of Done, verify hoàn thành chức năng).

- **Ví dụ thực tế:** Cứ copy y nguyên đoạn blockquote phía trên và dán vào AI chat để nó tự động đọc 3 file ngữ cảnh và sinh ra file `task.md` chuẩn form.

### 1.2 Tạo file `requirements.md` (Dành cho Claude Opus 4.6 / GPT-4)

- **Mục đích:** Xây dựng đặc tả hệ thống chi tiết.
- **Nội dung Prompt:**
  > 1. Đóng vai trò là một Senior Solutions Architect. Đọc và hiểu rõ tài liệu `PRD.md`, `AGENTS.md` và `task.md`. Hãy xác định tài liệu `requirements.md` với dự án Taskflow này gồm có những phần nào.
  > 2. Hãy thực hiện chi tiết phần đó bám sát `PRD.md`. Chú ý:
  >    - Sử dụng Brevo làm dịch vụ gửi email và Neon (Serverless Postgres) làm Database. Nếu có xung đột logic, luôn lấy `PRD.md` làm nguồn chân lý.
  >    - Viết chi tiết đến mức developer có thể code ngay. Đảm bảo có đủ các cấu trúc cốt lõi: Overview, Tech Stack, Coding Conventions, System Architecture, Project Structure, Database Schema (ít nhất 9 tables), API Specifications (~30 endpoints), Auth & RBAC matrix, Business Logic (12 FRs), UI/UX, Third-party Integrations, Environment.

- **Ví dụ thực tế:** Copy y nguyên đoạn blockquote phía trên đưa cho AI sau khi dự án đã có sẵn file `task.md` và `PRD.md`.

### 1.3 Tạo file `design-system.md`
- **Mục đích:** Lên quy chuẩn giao diện hệ thống.
- **Nội dung Prompt:**
  > 1. Đọc và hiểu rõ tài liệu `PRD.md`, `task.md` và `requirements.md`. Hãy xác định tài liệu `design-system.md` với dự án Taskflow này gồm có những phần nào.
  > 2. Hãy thực hiện chi tiết phần đó bám sát `PRD.md` và `requirements.md`. Chú ý:
  >    - Về mặt thiết kế (Design): Tôi muốn phong cách hiện đại (modern), mượt mà (smooth animations/transitions), sử dụng giao diện nền sáng (light mode) làm chủ đạo.
  >    - Lên danh sách quy chuẩn giao diện hệ thống chi tiết (Color tokens, Typography, UI Components, Pattern trạng thái Empty/Loading/Error...).

- **Ví dụ thực tế:** Copy y nguyên đoạn blockquote trên để AI tự động quy hoạch UI dựa trên yêu cầu từ `requirements.md`.

---

## 2. ⚙️ Nhóm Prompts Thực Thi (Execution)

### 2.1 Thực thi Milestone (Mẫu chung cho M0 -> M5)
- **Mục đích:** Ra lệnh cho AI bắt đầu thực thi một Milestone cụ thể theo đúng trình tự.
- **Nội dung Prompt:**
  > Lệnh thực thi: Milestone [Tên Milestone, vd: M0]
  > - **Luôn ghi nhớ "Hướng dẫn dành cho AI coding" trong file `task.md`. Bắt buộc nạp 2 file ngữ cảnh: `requirements.md` và `design-system.md` trước khi code.**
  > - Đọc kỹ phần "Milestone [Tên Milestone]" trong `task.md`.
  > - **Tuyệt đối không được bịa (hallucinate) code hay logic. Phải bám sát ngữ cảnh và yêu cầu từ các file tài liệu đã cung cấp.**
  > - Bám sát và thực hiện tuần tự các FR (Feature Request) hoặc checklist có trong Milestone đó. Mỗi FR phải lên kế hoạch chi tiết bao gồm plan test (API/Unit/E2E). Không làm gộp, không bỏ sót.
  > - Tiến hành thực thi toàn bộ (Backend, Frontend, Testing).
  > - Khi hoàn thành, dùng browser tool kiểm tra giao diện và in ra checklist "Acceptance Gate [Tên Milestone]" (đánh dấu `[x]` các mục đã xong) để báo cáo. 
  > - Bắt đầu thực hiện [Tên FR đầu tiên, vd: FR-01].

- **Ví dụ thực tế:**
  ```text
  Lệnh thực thi: Milestone M1
  - Luôn ghi nhớ "Hướng dẫn dành cho AI coding" trong file task.md. Bắt buộc nạp 2 file ngữ cảnh...
  - Đọc kỹ phần "Milestone M1" trong task.md.
  - Tuyệt đối không được bịa, phải bám sát ngữ cảnh tài liệu.
  - Bám sát và thực hiện tuần tự các FR...
  - Tiến hành thực thi toàn bộ (Backend, Frontend, Testing).
  - Khi hoàn thành, in ra checklist "Acceptance Gate M1" (đánh dấu [x]) để báo cáo.
  - Bắt đầu thực hiện FR-02.
  ```

### 2.2 Thực thi một Feature Request (FR) đơn lẻ
- **Mục đích:** Ra lệnh cho AI tập trung code và hoàn thiện duy nhất một tính năng.
- **Nội dung Prompt:**
  > Lệnh thực thi: [Tên FR, vd: FR-07 My Tasks Dashboard]
  > - **Luôn ghi nhớ "Hướng dẫn dành cho AI coding" trong file `task.md`. Bắt buộc nạp 2 file ngữ cảnh: `requirements.md` và `design-system.md` trước khi code.**
  > - Đọc kỹ phần yêu cầu của [Tên FR] trong file `task.md`.
  > - **Tuyệt đối không được bịa (hallucinate) code hay logic. Phải bám sát ngữ cảnh và yêu cầu từ các file tài liệu đã cung cấp.**
  > - Hãy lên kế hoạch chi tiết bao gồm plan test (API/Unit/E2E) trước khi code.
  > - Tiến hành thực thi Backend, Frontend và chạy Test. Bám sát `requirements.md` (logic) và `design-system.md` (UI).
  > - Khi hoàn thành, dùng browser tool kiểm tra giao diện và in ra checklist "Definition of Done" của riêng FR này (đánh dấu `[x]`) để báo cáo.

- **Ví dụ thực tế:**
  ```text
  Lệnh thực thi: FR-08 Team Kanban Board
  - Luôn ghi nhớ "Hướng dẫn dành cho AI coding"...
  - Đọc kỹ phần yêu cầu của FR-08 trong file task.md.
  - Tuyệt đối không được bịa, phải bám sát ngữ cảnh tài liệu.
  - Hãy lên kế hoạch chi tiết bao gồm plan test (API/Unit/E2E)...
  - Tiến hành thực thi Backend, Frontend và chạy Test...
  - Khi hoàn thành, in ra checklist "Definition of Done"...
  ```

### 2.3 Tiếp tục Milestone bị gián đoạn (Resume)
- **Mục đích:** Khi conversation bị đứt giữa chừng hoặc chuyển sang phiên mới, dùng prompt này để AI tiếp tục đúng chỗ đang dở.
- **Nội dung Prompt:**
  > Lệnh tiếp tục: Milestone [Tên Milestone, vd: M2]
  > - **Luôn ghi nhớ "Hướng dẫn dành cho AI coding" trong file `task.md`. Bắt buộc nạp 2 file ngữ cảnh: `requirements.md` và `design-system.md` trước khi code.**
  > - Đọc kỹ phần "Milestone [Tên Milestone]" trong `task.md`.
  > - **Tuyệt đối không được bịa (hallucinate) code hay logic. Phải bám sát ngữ cảnh và yêu cầu từ các file tài liệu đã cung cấp.**
  > - Xác định các FR đã hoàn thành (`[x]`), đang dở (`[/]`) và chưa làm (`[ ]`).
  > - Tiếp tục thực thi từ FR đang dở hoặc FR chưa làm đầu tiên. Không làm lại những FR đã xong.
  > - Khi hoàn thành toàn bộ Milestone, in ra checklist "Acceptance Gate [Tên Milestone]" để báo cáo.

- **Ví dụ thực tế:**
  ```text
  Lệnh tiếp tục: Milestone M2
  - Luôn ghi nhớ "Hướng dẫn dành cho AI coding" trong file task.md...
  - Đọc kỹ phần "Milestone M2" trong task.md.
  - Tuyệt đối không được bịa, phải bám sát ngữ cảnh tài liệu.
  - Xác định các FR đã hoàn thành ([x]), đang dở ([/]) và chưa làm ([ ]).
  - Tiếp tục thực thi từ FR đang dở. Không làm lại những FR đã xong.
  - Khi hoàn thành, in ra checklist "Acceptance Gate M2".
  ```

---

## 3. 🛠️ Nhóm Prompts Gỡ Lỗi & Cập Nhật (Fix Bug & Update)

### 3.1 Sửa Lỗi Giao Diện (Fix UI Bug)
- **Mục đích:** Yêu cầu AI sửa lỗi giao diện và đảm bảo bám sát Design System.
- **Nội dung Prompt:**
  > # Fix bug UI
  > - **Vị trí:** [Tên file hoặc Component, vd: ProjectDetail.tsx]
  > - **Lỗi hiện tại:** [Mô tả nhanh, vd: Màn mobile 4 cột Kanban bị ép dính vào nhau, chữ rớt dòng].
  > - **Kỳ vọng:** Đọc `docs/design-system.md` mục [vd: 7.3]. Cần [vd: có thanh cuộn ngang (overflow-x-auto), mỗi cột min-width 280px].
  > - **Yêu cầu:** Sửa bằng class Tailwind. Trình bày code sửa ngắn gọn.
  > - **Đồng bộ Tài liệu:** Sau khi sửa xong, nếu có sự điều chỉnh về quy tắc UI/UX, bắt buộc phải cập nhật lại `docs/design-system.md` và `docs/task.md` (nếu liên quan).

- **Ví dụ thực tế:**
  ```text
  # Fix bug UI
  - Vị trí: TaskCard.tsx
  - Lỗi hiện tại: Title của task dài quá làm vỡ layout thẻ card.
  - Kỳ vọng: Đọc docs/design-system.md mục 7.1. Cần áp dụng line-clamp-2 để cắt bớt chữ và thêm tooltip.
  - Yêu cầu: Sửa bằng class Tailwind.
  - Đồng bộ Tài liệu: Cập nhật lại design-system.md nếu có phát sinh rule mới.
  ```

### 3.2 Sửa Lỗi Logic (Fix Logic Bug)
- **Mục đích:** Yêu cầu AI sửa lỗi chức năng và đảm bảo bám sát Requirements.
- **Nội dung Prompt:**
  > # Fix bug logic
  > - **Vị trí:** FR-[Mã số] / File [Tên file]
  > - **Lỗi hiện tại:** [Mô tả nhanh, vd: Restore task trong thùng rác không gỡ được assignee cũ].
  > - **Log lỗi (nếu có):** [Dán mã lỗi console hoặc terminal vào đây].
  > - **Kỳ vọng:** Đọc `docs/requirements.md` mục [vd: 9.4]. Khi restore mà assignee đã rời workspace thì phải set `assignee_id = null`.
  > - **Yêu cầu:** Tìm nguyên nhân và fix logic. Chỉ đưa ra đoạn code cần thay thế.
  > - **Đồng bộ Tài liệu:** Nếu việc fix lỗi làm phát sinh Edge Case mới hoặc thay đổi flow, bắt buộc phải cập nhật lại `docs/requirements.md` và `docs/task.md` cho khớp với thực tế.

- **Ví dụ thực tế:**
  ```text
  # Fix bug logic
  - Vị trí: FR-07 / task.controller.ts
  - Lỗi hiện tại: Sort task theo Due Date bị sai thứ tự (cũ nhất lên đầu thay vì mới nhất).
  - Kỳ vọng: Đọc docs/requirements.md mục 9.2. Task sắp hết hạn (overdue) phải lên đầu.
  - Yêu cầu: Tìm nguyên nhân và fix logic query Prisma.
  - Đồng bộ Tài liệu: Nếu có lỗi logic ẩn, hãy update file requirements.md.
  ```

### 3.3 Chỉnh Sửa / Cập Nhật UI Mới (Feature Update)
- **Mục đích:** Yêu cầu AI thay đổi UI và đồng thời cập nhật file tài liệu thiết kế để đồng bộ.
- **Nội dung Prompt:**
  > # Chỉnh sửa thiết kế (Update UI)
  > - Ở trang `app/my-task`, tôi muốn đổi màu của bộ lọc sang màu xanh. 
  > - Hãy thay đổi code tương ứng.
  > - Đồng thời, hãy thực hiện cập nhật quy tắc này lên file `docs/design-system.md` cho tôi để đảm bảo đồng bộ tài liệu.

- **Ví dụ thực tế:**
  ```text
  # Chỉnh sửa thiết kế (Update UI)
  - Ở trang Dashboard báo cáo, tôi muốn đổi biểu đồ tròn thành biểu đồ cột (Bar chart) để dễ nhìn hơn.
  - Hãy thay đổi code tương ứng dùng Recharts.
  - Đồng thời, hãy cập nhật quy tắc này lên file docs/design-system.md.
  ```

---

## 4. 🧪 Nhóm Prompts Testing & Tối Ưu (QA & Refactor)

### 4.1 Viết Unit Test / API Test
- **Mục đích:** Yêu cầu AI viết test cases cho một module cụ thể để đảm bảo độ bao phủ (coverage).
- **Nội dung Prompt:**
  > # Viết test
  > - **Mục tiêu:** Viết Unit Test và API Test cho [Tên file hoặc Endpoint, vd: Task Controller / `POST /api/tasks`].
  > - **Yêu cầu:** Đọc `docs/requirements.md` mục [vd: 7.4]. Hãy viết đầy đủ test cases cho luồng thành công (Happy Path) và các luồng lỗi (Edge Cases, Validation Errors, Auth Errors).
  > - Hãy dùng [Jest + Supertest] như đã thống nhất trong stack. Bắt đầu viết và tự động chạy thử file test để kiểm chứng.

- **Ví dụ thực tế:**
  ```text
  # Viết test
  - Mục tiêu: Viết Unit Test và API Test cho Project Controller (`POST /api/projects`).
  - Yêu cầu: Đọc docs/requirements.md mục 7.2. Hãy viết test cases cho luồng tạo project thành công và bắt lỗi phân quyền (chỉ Admin mới được tạo).
  - Bắt đầu viết bằng Jest và tự động test code đó luôn.
  ```

### 4.2 Tối Ưu Hóa & Refactor Code
- **Mục đích:** Yêu cầu AI dọn dẹp code rác, tách component hoặc tối ưu hiệu năng mà không làm thay đổi logic (Business Logic).
- **Nội dung Prompt:**
  > # Refactor code
  > - **Vị trí:** File [Tên file, vd: `TeamKanbanBoard.tsx`] đang quá dài và khó bảo trì.
  > - **Yêu cầu:** Hãy refactor file này theo nguyên tắc Clean Code.
  > - Tách các UI nhỏ thành components riêng (đặt trong thư mục `components/`).
  > - Tách logic fetching/dnd-kit ra thành Custom Hooks (đặt trong thư mục `hooks/`).
  > - **Quy tắc tuyệt đối:** KHÔNG được làm thay đổi bất kỳ hành vi nào của người dùng đã được định nghĩa trong `requirements.md`. Sau khi refactor, hãy chạy test để verify.
  > - **Đồng bộ Tài liệu:** Nếu việc refactor làm thay đổi cấu trúc component/hook chuẩn đã ghi trong tài liệu, hãy cập nhật lại `docs/design-system.md` và `docs/requirements.md`.

- **Ví dụ thực tế:**
  ```text
  # Refactor code
  - Vị trí: File `TeamKanbanBoard.tsx` đang quá dài (hơn 800 dòng).
  - Yêu cầu: Hãy refactor theo Clean Code. Tách cột (Column) và thẻ (Card) thành các component con. Tách logic kéo thả dnd-kit ra hook `useKanbanDnd`.
  - Quy tắc tuyệt đối: Không đổi hành vi người dùng.
  ```

### 4.3 Cập nhật Database Schema (Prisma)
- **Mục đích:** Thêm/sửa trường dữ liệu trong Database một cách an toàn.
- **Nội dung Prompt:**
  > # Database update
  > - **Yêu cầu:** Tôi muốn thêm tính năng [vd: Gắn thẻ tag cho Task].
  > - **Hành động 1:** Cập nhật file `prisma/schema.prisma` (Thêm model `Tag` và quan hệ n-n với `Task`).
  > - **Hành động 2:** Cập nhật file `docs/requirements.md` mục Database Schema để giữ cho tài liệu luôn đồng bộ với DB thật.
  > - **Hành động 3:** Khởi tạo lệnh `npx prisma migrate dev --name add_task_tags` và generate client mới. Cứ chạy lệnh đi, tôi sẽ approve.

- **Ví dụ thực tế:**
  ```text
  # Database update
  - Yêu cầu: Tôi muốn thêm trường `avatarUrl` (String, nullable) vào bảng `User`.
  - Hành động 1: Cập nhật file `prisma/schema.prisma`.
  - Hành động 2: Cập nhật file `docs/requirements.md` mục Database Schema.
  - Hành động 3: Khởi tạo lệnh `npx prisma migrate dev --name add_user_avatar`.
  ```

---

## 5. 🔍 Nhóm Prompts Review & Rà Soát (Review & Discovery)

### 5.1 Review Code / Tạo PR Summary
- **Mục đích:** Yêu cầu AI review code đã viết, phát hiện vấn đề tiềm ẩn và tạo bản tóm tắt thay đổi.
- **Nội dung Prompt:**
  > # Review code
  > - **Phạm vi:** Review toàn bộ code đã thay đổi trong [Tên FR hoặc Milestone, vd: FR-08 Team Kanban Board].
  > - **Tiêu chí review:**
  >   1. Đọc `docs/requirements.md` — kiểm tra logic có khớp spec không.
  >   2. Đọc `docs/design-system.md` — kiểm tra UI có tuân thủ design tokens không.
  >   3. Kiểm tra security (SQL injection, XSS, RBAC bypass).
  >   4. Kiểm tra performance (N+1 query, missing index, unnecessary re-render).
  >   5. Kiểm tra code quality (naming, duplication, error handling).
  > - **Output:** Liệt kê danh sách issues theo mức độ (Critical / Warning / Info). Nếu không có issue, xác nhận "Code is clean".
  > - **PR Summary:** Viết một đoạn tóm tắt thay đổi theo format: What changed → Why → How to test.

- **Ví dụ thực tế:**
  ```text
  # Review code
  - Phạm vi: Review toàn bộ code đã thay đổi trong FR-11 Reports Dashboard.
  - Tiêu chí review: Logic khớp spec, UI tuân thủ design tokens, security, performance, code quality.
  - Output: Liệt kê issues theo mức độ Critical / Warning / Info.
  - PR Summary: Viết tóm tắt theo format What → Why → How to test.
  ```

### 5.2 Rà Soát Edge Cases Chưa Được Handle
- **Mục đích:** Yêu cầu AI chủ động phát hiện các trường hợp biên (edge cases) chưa được xử lý trong code hiện tại.
- **Nội dung Prompt:**
  > # Rà soát edge cases
  > - **Phạm vi:** [Tên FR hoặc Module, vd: FR-07 My Tasks Dashboard]
  > - **Yêu cầu:**
  >   1. Đọc `docs/requirements.md` và `docs/task.md` phần liên quan đến [Tên FR].
  >   2. Đọc code hiện tại của module này (cả Backend lẫn Frontend).
  >   3. Liệt kê tất cả edge cases có thể xảy ra mà chưa được handle (vd: mạng chập chờn, dữ liệu null, concurrent update, race condition, empty state...).
  >   4. Với mỗi edge case, đề xuất cách fix cụ thể.
  > - **Output:** Bảng gồm các cột: Edge Case | Mức độ nghiêm trọng | Đề xuất Fix.
  > - **Đồng bộ Tài liệu:** Nếu phát hiện edge case quan trọng chưa có trong spec, cập nhật vào `docs/requirements.md` và `docs/task.md`.

- **Ví dụ thực tế:**
  ```text
  # Rà soát edge cases
  - Phạm vi: FR-13 Trash Bin
  - Yêu cầu: Đọc requirements.md và code hiện tại. Liệt kê edge cases chưa handle (vd: restore task mà project đã bị xóa, countdown timer khi user ở timezone khác...).
  - Output: Bảng Edge Case | Mức độ | Đề xuất Fix.
  - Đồng bộ Tài liệu: Cập nhật requirements.md nếu phát hiện case mới.
  ```

---

## 6. 🚢 Nhóm Prompts Deployment & Release

### 6.1 Build & Deploy Production
- **Mục đích:** Yêu cầu AI chuẩn bị và thực hiện build production, kiểm tra trước khi deploy.
- **Nội dung Prompt:**
  > # Build production
  > - **Yêu cầu:**
  >   1. Kiểm tra tất cả environment variables cần thiết đã được cấu hình (đối chiếu với `docs/requirements.md` mục Environment).
  >   2. Chạy full test suite (`npm test`) — đảm bảo 100% pass.
  >   3. Chạy type-check (`npx tsc --noEmit`) — đảm bảo không có lỗi TypeScript.
  >   4. Chạy build production (`npm run build`) cho cả Backend và Frontend.
  >   5. Nếu có lỗi build, tìm nguyên nhân và fix ngay.
  > - **Output:** Báo cáo trạng thái: Tests passed ✅/❌ | Type-check ✅/❌ | Build ✅/❌. Liệt kê lỗi nếu có.

- **Ví dụ thực tế:**
  ```text
  # Build production
  - Yêu cầu: Kiểm tra env vars, chạy test suite, type-check, và build production.
  - Nếu có lỗi, fix ngay và chạy lại.
  - Output: Báo cáo trạng thái Tests / Type-check / Build.
  ```

### 6.2 Kiểm Tra Trước Khi Release (Pre-release Checklist)
- **Mục đích:** Rà soát tổng thể trước khi release một Milestone hoặc toàn bộ dự án.
- **Nội dung Prompt:**
  > # Pre-release checklist
  > - **Phạm vi:** [Tên Milestone hoặc "Toàn bộ dự án"]
  > - **Yêu cầu:**
  >   1. Đọc `docs/task.md` — xác nhận tất cả FR trong phạm vi đã được đánh dấu `[x]`.
  >   2. Đọc `docs/requirements.md` — đối chiếu danh sách API endpoints, đảm bảo không thiếu.
  >   3. Đọc `docs/design-system.md` — kiểm tra xem code UI hiện tại có lệch so với tài liệu không.
  >   4. Chạy full test suite và báo cáo coverage.
  >   5. Kiểm tra responsive trên các breakpoint chính (mobile 375px, tablet 768px, desktop 1280px) bằng browser tool.
  > - **Output:** Checklist đánh dấu `[x]` cho từng mục. Liệt kê rõ các mục chưa đạt (nếu có) kèm đề xuất fix.

- **Ví dụ thực tế:**
  ```text
  # Pre-release checklist
  - Phạm vi: Milestone M3
  - Yêu cầu: Xác nhận tất cả FR đã xong, API endpoints đầy đủ, UI khớp design system, test pass, responsive OK.
  - Output: Checklist [x] cho từng mục.
  ```

---

## 7. 📋 Bảng Khuyến Nghị Model Theo Loại Task

| Loại task | Model khuyến nghị | Lý do |
|---|---|---|
| Tạo tài liệu (§1) | Gemini 3.1 Pro / Claude Opus 4.6 | Cần khả năng phân tích dài, tổng hợp cross-reference nhiều file |
| Thực thi Milestone (§2) | Gemini 3.1 Pro / Claude Opus 4.6 | Cần context window lớn, code multi-file chính xác |
| Fix bug UI nhỏ (§3.1) | GPT-4o / GPT-3 Flash | Task nhỏ, cần tốc độ, không cần context quá lớn |
| Fix bug logic phức tạp (§3.2) | Gemini 3.1 Pro / Claude Opus 4.6 | Cần suy luận sâu, trace logic qua nhiều layer |
| Viết test (§4.1) | GPT-4o / GPT-3 Flash | Task có pattern rõ ràng, model nhẹ vẫn xử lý tốt |
| Refactor (§4.2) | Gemini 3.1 Pro / Claude Opus 4.6 | Cần hiểu toàn bộ codebase để tách đúng |
| Review code (§5.1) | Gemini 3.1 Pro / Claude Opus 4.6 | Cần phân tích toàn diện, phát hiện vấn đề tinh tế |
| Rà soát edge cases (§5.2) | Gemini 3.1 Pro / Claude Opus 4.6 | Cần suy luận sáng tạo về các trường hợp biên |
| Build & Deploy (§6) | GPT-4o / GPT-3 Flash | Chủ yếu chạy command, không cần suy luận nặng |