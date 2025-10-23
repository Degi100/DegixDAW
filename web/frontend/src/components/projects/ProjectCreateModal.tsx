// ============================================
// PROJECT CREATE MODAL
// Modal for creating new music projects
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { PROJECT_TEMPLATES } from '../../lib/constants/content';
import type { CreateProjectRequest } from '../../types/projects';
import Button from '../ui/Button';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectCreateModal({ isOpen, onClose }: ProjectCreateModalProps) {
  const navigate = useNavigate();
  const { create } = useProjects();

  const [formData, setFormData] = useState<CreateProjectRequest>({
    title: '',
    description: '',
    bpm: 120,
    time_signature: '4/4',
    key: 'C',
    is_public: false,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('empty');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (formData.bpm && (formData.bpm < 20 || formData.bpm > 300)) {
      newErrors.bpm = 'BPM must be between 20 and 300';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const project = await create(formData);

      if (project) {
        // Close modal
        onClose();

        // Navigate to project detail page
        navigate(`/projects/${project.id}`);

        // Reset form
        setFormData({
          title: '',
          description: '',
          bpm: 120,
          time_signature: '4/4',
          key: 'C',
          is_public: false,
        });
        setSelectedTemplate('empty');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    // Ignore selection of coming-soon templates
    if (templateId === 'band') return;

    setSelectedTemplate(templateId);

    // Pre-fill BPM based on template
    switch (templateId) {
      case 'empty':
        setFormData(prev => ({ ...prev, bpm: 120, time_signature: '4/4' }));
        break;
      default:
        setFormData(prev => ({ ...prev, bpm: 120, time_signature: '4/4' }));
    }

    // Auto-advance to next step
    setCurrentStep(2);
  };

  // Handle next/back navigation
  const handleNext = () => {
    // Validate current step before advancing
    if (currentStep === 2) {
      // Validate project details
      if (!formData.title.trim()) {
        setErrors({ title: 'Project title is required' });
        return;
      }
      if (formData.title.length < 3) {
        setErrors({ title: 'Title must be at least 3 characters' });
        return;
      }
      setErrors({});
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3) as 1 | 2 | 3);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3);
    setErrors({});
  };

  // Reset modal state on close
  const handleClose = () => {
    setCurrentStep(1);
    setSelectedTemplate('empty');
    setFormData({
      title: '',
      description: '',
      bpm: 120,
      time_signature: '4/4',
      key: 'C',
      is_public: false,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content project-create-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>🎵 Create New Project</h2>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Template</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Details</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Visibility</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Template Selection */}
          {currentStep === 1 && (
          <section className="modal-section">
            <h3>Choose Template</h3>
            <div className="template-grid">
              {PROJECT_TEMPLATES.map((template) => {
                const isComingSoon = template.tags.includes('coming-soon');
                return (
                  <button
                    key={template.id}
                    type="button"
                    className={`template-card ${selectedTemplate === template.id ? 'selected' : ''} ${isComingSoon ? 'coming-soon' : ''}`}
                    onClick={() => handleTemplateSelect(template.id)}
                    disabled={isComingSoon}
                  >
                    <div className="template-icon">{template.icon}</div>
                    <div className="template-title">{template.title}</div>
                    <div className="template-description">{template.description}</div>
                  </button>
                );
              })}
            </div>
          </section>
          )}

          {/* Step 2: Project Details */}
          {currentStep === 2 && (
          <section className="modal-section">
            <h3>Project Details</h3>

            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">
                Project Title <span className="required">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="My Summer Hit 2025"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                maxLength={255}
                autoFocus
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                className="form-textarea"
                placeholder="Describe your project..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                maxLength={500}
              />
            </div>

            {/* BPM & Time Signature */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bpm">BPM</label>
                <input
                  id="bpm"
                  type="number"
                  className={`form-input ${errors.bpm ? 'error' : ''}`}
                  value={formData.bpm}
                  onChange={(e) => setFormData(prev => ({ ...prev, bpm: parseInt(e.target.value) || 0 }))}
                  min={20}
                  max={300}
                  disabled={selectedTemplate === 'podcast'}
                />
                {errors.bpm && <span className="error-text">{errors.bpm}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="time-signature">Time Signature</label>
                <select
                  id="time-signature"
                  className="form-select"
                  value={formData.time_signature}
                  onChange={(e) => setFormData(prev => ({ ...prev, time_signature: e.target.value }))}
                >
                  <option value="4/4">4/4</option>
                  <option value="3/4">3/4</option>
                  <option value="6/8">6/8</option>
                  <option value="7/8">7/8</option>
                  <option value="5/4">5/4</option>
                </select>
              </div>
            </div>

            {/* Key */}
            <div className="form-group">
              <label htmlFor="key">Musical Key (optional)</label>
              <select
                id="key"
                className="form-select"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              >
                <option value="">Not specified</option>
                <option value="C">C Major</option>
                <option value="C#">C# Major</option>
                <option value="D">D Major</option>
                <option value="Eb">Eb Major</option>
                <option value="E">E Major</option>
                <option value="F">F Major</option>
                <option value="F#">F# Major</option>
                <option value="G">G Major</option>
                <option value="Ab">Ab Major</option>
                <option value="A">A Major</option>
                <option value="Bb">Bb Major</option>
                <option value="B">B Major</option>
                <option value="Cm">C Minor</option>
                <option value="C#m">C# Minor</option>
                <option value="Dm">D Minor</option>
                <option value="Ebm">Eb Minor</option>
                <option value="Em">E Minor</option>
                <option value="Fm">F Minor</option>
                <option value="F#m">F# Minor</option>
                <option value="Gm">G Minor</option>
                <option value="Abm">Ab Minor</option>
                <option value="Am">A Minor</option>
                <option value="Bbm">Bb Minor</option>
                <option value="Bm">B Minor</option>
              </select>
            </div>
          </section>
          )}

          {/* Step 3: Visibility */}
          {currentStep === 3 && (
          <section className="modal-section">
            <h3>Visibility</h3>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                />
                <span>Make this project public</span>
              </label>
              <p className="form-hint">
                {formData.is_public
                  ? '🌍 Anyone can view this project'
                  : '🔒 Only you and invited collaborators can access'}
              </p>
            </div>
          </section>
          )}

          {/* Actions */}
          <div className="modal-actions">
            {/* Back Button (show on step 2 and 3) */}
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                ← Back
              </Button>
            )}

            {/* Cancel Button (show on step 1 only) */}
            {currentStep === 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
            )}

            {/* Next Button (show on step 2) */}
            {currentStep === 2 && (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                disabled={loading || !formData.title.trim()}
              >
                Next →
              </Button>
            )}

            {/* Create Button (show on step 3) */}
            {currentStep === 3 && (
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : '✨ Create Project'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
