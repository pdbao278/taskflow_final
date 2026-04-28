import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Title không được để trống' })
    .min(1, 'Title không được để trống')
    .max(200, 'Title không được vượt quá 200 ký tự'),
  description: z
    .string()
    .max(5000, 'Mô tả không được vượt quá 5000 ký tự')
    .optional()
    .nullable(),
  project_id: z
    .string({ required_error: 'Dự án là bắt buộc' })
    .uuid('Dự án không hợp lệ'),
  assignee_id: z
    .string()
    .uuid('Assignee không hợp lệ')
    .optional()
    .nullable(),
  priority: z
    .enum(['Low', 'Medium', 'High', 'Urgent'])
    .default('Medium'),
  due_date: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title không được để trống')
    .max(200, 'Title không được vượt quá 200 ký tự')
    .optional(),
  description: z
    .string()
    .max(5000, 'Mô tả không được vượt quá 5000 ký tự')
    .optional()
    .nullable(),
  status: z
    .enum(['ToDo', 'InProgress', 'InReview', 'Done'])
    .optional(),
  assignee_id: z
    .string()
    .uuid('Assignee không hợp lệ')
    .optional()
    .nullable(),
  priority: z
    .enum(['Low', 'Medium', 'High', 'Urgent'])
    .optional(),
  due_date: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
