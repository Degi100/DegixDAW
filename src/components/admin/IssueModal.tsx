// src/components/admin/IssueModal.tsx
// Modal for creating and editing issues

import { useState, useEffect } from 'react';
import type { Issue } from '../../hooks/useIssues';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IssueFormData) => Promise<void>;
  issue?: Issue | null;
  mode: 'create' | 'edit';
}

export interface IssueFormData {
  title: string;
  description: string;
  status: Issue['status'];
  priority: Issue['priority'];
  category: string;
}

export default function IssueModal({ isOpen, onClose, onSubmit, issue, mode }: IssueModalProps) {
  const [formData, setFormData] = useState<IssueFormData>({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when issue changes
  useEffect(() => {
    if (issue && mode === 'edit') {
      setFormData({
        title: issue.title,
        description: issue.description || '',
        status: issue.status,
        priority: issue.priority,
        category: issue.category || '',
      });
    } else {
      // Reset form for create mode
      setFormData({
        title: '',
        description: '',
        status: 'open',
        priority: 'medium',
        category: '',
      });
    }
    setErrors({});
  }, [issue, mode, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Titel muss mindestens 3 Zeichen lang sein';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Beschreibung darf maximal 500 Zeichen lang sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof IssueFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
            {mode === 'create' ? '➕ Neues Issue' : '✏️ Issue bearbeiten'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Titel <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="z.B. Doppelter Toast bei Login"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.title ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => !errors.title && (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => !errors.title && (e.target.style.borderColor = '#d1d5db')}
            />
            {errors.title && (
              <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detaillierte Beschreibung des Issues..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.description ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => !errors.description && (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => !errors.description && (e.target.style.borderColor = '#d1d5db')}
            />
            {errors.description && (
              <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
                {errors.description}
              </p>
            )}
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', margin: '4px 0 0 0' }}>
              {formData.description.length}/500 Zeichen
            </p>
          </div>

          {/* Status & Priority Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Status */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  color: '#000000',
                }}
              >
                <option value="open" style={{ color: '#000000' }}>🔵 Open</option>
                <option value="in-progress" style={{ color: '#000000' }}>🟡 In Progress</option>
                <option value="done" style={{ color: '#000000' }}>✅ Done</option>
                <option value="closed" style={{ color: '#000000' }}>⚪ Closed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Priorität
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  color: '#000000',
                }}
              >
                <option value="low" style={{ color: '#000000' }}>🟢 Low</option>
                <option value="medium" style={{ color: '#000000' }}>🟡 Medium</option>
                <option value="high" style={{ color: '#000000' }}>🔴 High</option>
                <option value="critical" style={{ color: '#000000' }}>🚨 Critical</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Kategorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer',
                outline: 'none',
                color: '#000000',
              }}
            >
              <option value="" style={{ color: '#000000' }}>-- Kategorie wählen --</option>
              <option value="Auth/Login" style={{ color: '#000000' }}>🔐 Auth/Login</option>
              <option value="Routing" style={{ color: '#000000' }}>🛣️ Routing</option>
              <option value="Admin/Users" style={{ color: '#000000' }}>👥 Admin/Users</option>
              <option value="Admin/Analytics" style={{ color: '#000000' }}>📊 Admin/Analytics</option>
              <option value="Admin/UI" style={{ color: '#000000' }}>🎨 Admin/UI</option>
              <option value="Admin/Features" style={{ color: '#000000' }}>⚙️ Admin/Features</option>
              <option value="Profile/Settings" style={{ color: '#000000' }}>⚙️ Profile/Settings</option>
              <option value="UI/Style" style={{ color: '#000000' }}>💅 UI/Style</option>
              <option value="Database" style={{ color: '#000000' }}>🗄️ Database</option>
              <option value="Performance" style={{ color: '#000000' }}>⚡ Performance</option>
              <option value="Security" style={{ color: '#000000' }}>🔒 Security</option>
              <option value="Documentation" style={{ color: '#000000' }}>📚 Documentation</option>
              <option value="Other" style={{ color: '#000000' }}>📦 Other</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '14px', 
                    height: '14px', 
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span>Wird gespeichert...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'create' ? '➕' : '💾'}</span>
                  <span>{mode === 'create' ? 'Issue erstellen' : 'Änderungen speichern'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
