'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { X, Loader2 } from 'lucide-react';
import { projectApi, useProjectStore, type Project } from '../stores/project.store';

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
];

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Tên dự án không được để trống').max(100, 'Tên dự án tối đa 100 ký tự'),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
});

type FormValues = z.infer<typeof updateProjectSchema>;

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project;
}

export default function EditProjectDialog({ open, onClose, project }: EditProjectDialogProps) {
  const [selectedColor, setSelectedColor] = useState(project.color);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateProject } = useProjectStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      name: project.name,
      description: project.description || '',
    },
  });

  useEffect(() => {
    reset({
      name: project.name,
      description: project.description || '',
    });
    setSelectedColor(project.color);
  }, [project, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await projectApi.update(project.id, {
        name: data.name,
        description: data.description || '',
        color: selectedColor,
      });
      if (result.success) {
        updateProject(result.data.project);
        toast.success('Đã cập nhật dự án thành công');
        onClose();
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 300,
        }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '480px',
          zIndex: 300,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Chỉnh sửa dự án</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
              Tên dự án <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <input
              {...register('name', {
                required: 'Tên dự án không được để trống',
                maxLength: { value: 100, message: 'Tên dự án tối đa 100 ký tự' },
              })}
              placeholder="Nhập tên dự án"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${errors.name ? 'var(--destructive)' : 'var(--border)'}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.borderColor = errors.name ? 'var(--destructive)' : 'var(--border)'; }}
            />
            {errors.name && (
              <p style={{ fontSize: '12px', color: 'var(--destructive)', marginTop: '4px' }}>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
              Mô tả
            </label>
            <textarea
              {...register('description')}
              placeholder="Mô tả dự án (tùy chọn)"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                minHeight: '80px',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
            />
          </div>

          {/* Color Picker */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Màu sắc <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: color,
                    border: selectedColor === color ? '3px solid var(--text-primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    outline: selectedColor === color ? '2px solid white' : 'none',
                    outlineOffset: '-4px',
                    transition: 'transform 0.15s',
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: 'var(--primary)',
                color: 'white',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
