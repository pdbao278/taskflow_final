import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string({ required_error: 'Nội dung comment không được để trống' })
    .trim()
    .min(1, 'Nội dung comment không được để trống')
    .max(5000, 'Nội dung comment không được vượt quá 5000 ký tự'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
