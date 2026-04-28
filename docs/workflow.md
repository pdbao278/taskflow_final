1. prom tại file task (opus 4.6)
Đọc kĩ và hiểu PRD.md , AGENTS.md,guide_taskflow.md để làm file task.md đã có sẵn cho tôi chia thành 5 Milestone. mỗi Milestone thì coppy FR,NFE,User Stories và Acceptance Criteria,Edge Cases và Error States tương ứng giống hết PRD.Yêu cầu Với mỗi FR, phải plan đầy đủ các loại test sau cho AI test (API test, Unit Test, E2E testing)
- Yêu cầu Với mỗi FR, phải có đủ checklist cho AI check bao gồm: pass hết tất cả test, Definition of Done, xong chức năng,...

2.prom tại file requirements.md(opus 4.6)
Đóng vai trò là một Senior Solutions Architect.
Ngữ cảnh: Hãy đọc kỹ các file `PRD.md`, `AGENTS.md`, và `task.md`. 
Quyết định kỹ thuật cốt lõi: Sử dụng Brevo làm dịch vụ gửi email và Neon (Serverless Postgres) làm Database. Nếu có bất kỳ xung đột nào về logic, hãy luôn lấy `PRD.md` làm nguồn chân lý (Source of Truth).

Nhiệm vụ: Viết một tài liệu đặc tả hệ thống `requirements.md` hoàn chỉnh, chi tiết đến mức developer có thể nhìn vào để code ngay.

Ràng buộc cấu trúc (Phải bao gồm đúng 12 mục sau):
1. Overview: Mô tả sản phẩm, scope MVP, roles, success metrics.
2. Tech Stack: Liệt kê chi tiết Frontend, Backend, DevOps.
3. Coding Conventions: Quy tắc Naming, API format chuẩn, security rules, testing guidelines.
4. System Architecture: Sơ đồ hệ thống, luồng request, auth flow.
5. Project Structure: Sơ đồ cây thư mục (tree) chi tiết cho cả frontend và backend.
6. Database Schema: Thiết kế tối thiểu 9 tables, quy định rõ primary/foreign keys, indexes, enums.
7. API Specifications: Liệt kê khoảng 30 endpoints chi tiết (Method, URL, Auth required, Role, Body/Params, Response format).
8. Auth & Authorization: Trình bày luồng JWT, RBAC permission matrix, và cơ chế workspace isolation.
9. Business Logic: Bóc tách 12 FR và tổng hợp cách xử lý edge cases.
10. UI/UX: Các nguyên tắc điều hướng, design patterns, responsive.
11. Third-party Integrations: Hướng dẫn tích hợp Brevo, Neon, Sentry.
12. Environment: Liệt kê các biến môi trường (.env.example), .gitignore.
1.2 ĐỌc kĩ và hiểu rõ file PRD.md, AGENTS.md, task.md và hãy thực hiện 
--làm file design
đọc kĩ và hiểu rõ file E:\taskflow03\docs\task.md và E:\taskflow03\docs\requirements.md .Sau đó hãy liệt kê các phần cần làm chi tiết của file  E:\taskflow03\docs\design-system.md




* Sửa lỗi về UI
prom: "Đọc kĩ và hiểu rõ design-system.md và task.md , requirements.md của mục




---Chạy về M0
LỆNH THỰC THI: MILESTONE M0

Đọc kỹ file docs/task.md, đặc biệt là phần "Hướng dẫn cho AI Coding Agent" và "Milestone M0".
Hãy tự động nạp thêm các file requirements.md và design-system.md tương ứng theo yêu cầu bên trong đó.
Tiến hành thực thi toàn bộ M0 (từ Setup, Backend, Frontend đến Testing).
Khi hoàn thành, dùng browser tool kiểm tra giao diện và in ra checklist "M0 — FR-01 Definition of Done" (đánh dấu [x] các mục đã xong) để báo cáo. Bắt đầu thực hiện.

LỆNH THỰC THI: MILESTONE M1
Đọc kỹ file docs/task.md phần "Milestone M1 — Core CRUD",Nạp ngữ cảnh từ requirements.md và design-system.md . Hãy làm theo hướng dẫn cho AI Coding Agent (Bắt buộc). Thực thi toàn bộ Backend, Frontend và Testing cho mỗi FR, thứ tự không được thay đổi.Mỗi FR phải thực hiện đẩy đủ chi tiết trong task, không được bỏ sót hay thay đổi về công nghệ,UI/UX,.... theo yêu cầu trong task.md 
Khi hoàn thành, dùng browser tool kiểm tra giao diện và in ra checklist từng FR và cuối M1 là "Acceptance Gate M1" (đánh dấu [x] các mục đã xong) để báo cáo. Bắt đầu thực hiện FR-02.

LỆNH THỰC THI: MILESTONE M2
Đọc kỹ file docs/task.md phần "Milestone M2 — Collaboration". Chú ý quy tắc BẮT BUỘC thực hiện tuần tự: FR-06 -> FR-09 -> FR-10.
Tự động tham chiếu requirements.md và design-system.md tương ứng.
Thực thi toàn bộ Backend, Frontend và Testing.
Khi hoàn thành, dùng browser tool kiểm tra giao diện và in ra checklist "Acceptance Gate M2" (đánh dấu [x] các mục đã xong) để báo cáo. Bắt đầu thực hiện FR-06.

LỆNH THỰC THI: MILESTONE M3
Đọc kỹ file docs/task.md phần "Milestone M3 — Dashboards". Chú ý quy tắc BẮT BUỘC thực hiện tuần tự: FR-07 -> FR-08 -> FR-11 -> FR-13.
Tự động tham chiếu requirements.md và design-system.md tương ứng.
Thực thi toàn bộ Backend, Frontend và Testing.
Khi hoàn thành, dùng browser tool kiểm tra giao diện và in ra checklist "Acceptance Gate M3" (đánh dấu [x] các mục đã xong) để báo cáo. Bắt đầu thực hiện FR-07.

LỆNH THỰC THI: MILESTONE M4
Đọc kỹ file docs/task.md phần "Milestone M4 — Polish & QA".
Thực hiện tuần tự: Hoàn thành FR-12 -> Verification toàn bộ NFRs -> Xử lý toàn bộ Edge Cases (10.1, 10.2, 10.3).
Khi hoàn thành, dùng browser tool kiểm tra giao diện và in ra checklist "Acceptance Gate M4" (đánh dấu [x] các mục đã xong) để báo cáo. Bắt đầu thực hiện.

LỆNH THỰC THI: MILESTONE M5
Đọc kỹ file docs/task.md phần "Milestone M5 — Deploy MVP".
Thực hiện toàn bộ Pre-Deploy Checklist, cấu hình môi trường và chuẩn bị cho Production Deploy.
In ra checklist "Acceptance Gate M5" (đánh dấu [x] các mục đã xong) và chờ xác nhận để tiến hành Smoke Test. Bắt đầu thực hiện.


---------FIx bug 

--bug UI
# FIX BUG UI
- **Vị trí:** [Tên file hoặc Component, vd: ProjectDetail.tsx]
- **Lỗi hiện tại:** [Mô tả nhanh, vd: Màn mobile 4 cột Kanban bị ép dính vào nhau, chữ rớt dòng].
- **Kỳ vọng:** Đọc `docs/design-system.md` mục [vd: 7.3]. Cần [vd: có thanh cuộn ngang (overflow-x-auto), mỗi cột min-width 280px].
- **Yêu cầu:** Sửa bằng class Tailwind. Trình bày code sửa ngắn gọn.

# FIX BUG LOGIC
- **Vị trí:** FR-[Mã số] / File [Tên file]
- **Lỗi hiện tại:** [Mô tả nhanh, vd: Restore task trong thùng rác không gỡ được assignee cũ].
- **Log lỗi (nếu có):** [Dán mã lỗi console hoặc terminal vào đây].
- **Kỳ vọng:** Đọc `docs/requirements.md` mục [vd: 9.4]. Khi restore mà assignee đã rời workspace thì phải set `assignee_id = null`.
- **Yêu cầu:** Tìm nguyên nhân và fix logic. Chỉ đưa ra đoạn code cần thay thế.

---------Chỉnh sửa UI