import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Tên dự án không được để trống')
    .max(100, 'Tên dự án tối đa 100 ký tự'),
  description: z.string().optional().default(''),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Màu sắc phải là mã hex hợp lệ (ví dụ: #FF5733)')
    .min(1, 'Màu sắc không được để trống'),
});

export const updateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Tên dự án không được để trống')
    .max(100, 'Tên dự án tối đa 100 ký tự')
    .optional(),
  description: z.string().optional(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Màu sắc phải là mã hex hợp lệ')
    .optional(),
});
