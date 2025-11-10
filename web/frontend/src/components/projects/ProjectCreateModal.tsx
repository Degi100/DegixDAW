// ============================================
// PROJECT CREATE MODAL
// Modal for creating new music projects
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { useTracks } from '../../hooks/useTracks';
import { useUserSearch, type SearchUser } from '../../hooks/useUserSearch';
import { inviteCollaborator, inviteByEmail } from '../../lib/services/projects/collaboratorsService';
import { PROJECT_TEMPLATES } from '../../lib/constants/content';
import type { CreateProjectRequest } from '../../types/projects';
import type { InviteCollaboratorData } from './InviteCollaboratorModal';
import Button from '../ui/Button';
import TrackUploadZone from '../tracks/TrackUploadZone';

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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [trackUploaded, setTrackUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // useTracks hook for upload (only when project is created)
  const { upload: uploadTrack, uploading: trackUploading } = useTracks(createdProjectId);

  // Step 3: Invite collaborators state
  const [activeTab, setActiveTab] = useState<'search' | 'email'>('search');
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'contributor' | 'mixer' | 'admin'>('viewer');
  const [permissions, setPermissions] = useState<Omit<InviteCollaboratorData, 'user_id'>>({
    role: 'viewer',
    can_edit: false,
    can_download: true,
    can_upload_audio: false,
    can_upload_mixdown: false,
    can_comment: true,
    can_invite_others: false,
  });
  const [invitedUsers, setInvitedUsers] = useState<Array<{ user_id: string; username: string; permissions: Omit<InviteCollaboratorData, 'user_id'> }>>([]);
  const [invitedEmails, setInvitedEmails] = useState<Array<{ email: string; permissions: Omit<InviteCollaboratorData, 'user_id'> }>>([]);

  // useUserSearch hook for auto-complete
  const { results, loading: searchLoading, debouncedSearch, clearSearch } = useUserSearch();

  // Role presets for quick selection
  const ROLE_PRESETS: Record<string, Omit<InviteCollaboratorData, 'user_id'>> = {
    viewer: {
      role: 'viewer',
      can_edit: false,
      can_download: true,
      can_upload_audio: false,
      can_upload_mixdown: false,
      can_comment: true,
      can_invite_others: false,
    },
    contributor: {
      role: 'contributor',
      can_edit: true,
      can_download: true,
      can_upload_audio: true,
      can_upload_mixdown: false,
      can_comment: true,
      can_invite_others: false,
    },
    mixer: {
      role: 'mixer',
      can_edit: true,
      can_download: true,
      can_upload_audio: true,
      can_upload_mixdown: true,
      can_comment: true,
      can_invite_others: false,
    },
    admin: {
      role: 'admin',
      can_edit: true,
      can_download: true,
      can_upload_audio: true,
      can_upload_mixdown: true,
      can_comment: true,
      can_invite_others: true,
    },
  };

  // Handle role change
  const handleRoleChange = (role: 'viewer' | 'contributor' | 'mixer' | 'admin') => {
    setSelectedRole(role);
    setPermissions(ROLE_PRESETS[role]);
  };

  // Toggle individual permission
  const togglePermission = (key: keyof Omit<InviteCollaboratorData, 'user_id' | 'role'>) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle user selection from search results
  const handleSelectUser = (user: SearchUser) => {
    setSelectedUser(user);
    clearSearch();
    setErrors({});
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSelectedUser(null);
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      clearSearch();
    }
  };

  // Add user to invited list
  const handleAddInvite = () => {
    if (activeTab === 'search') {
      if (!selectedUser) {
        setErrors({ invite: 'Please select a user from the search results' });
        return;
      }

      // Check if already invited
      if (invitedUsers.find(u => u.user_id === selectedUser.id)) {
        setErrors({ invite: 'User already invited' });
        return;
      }

      setInvitedUsers(prev => [...prev, {
        user_id: selectedUser.id,
        username: selectedUser.username,
        permissions: { ...permissions }
      }]);

      // Reset selection
      setSelectedUser(null);
      clearSearch();
      setErrors({});
    } else {
      // Email tab - Invite by email
      if (!email.trim()) {
        setErrors({ invite: 'Email is required' });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrors({ invite: 'Please enter a valid email address' });
        return;
      }

      // Check if already invited
      if (invitedEmails.find(e => e.email === email)) {
        setErrors({ invite: 'Email already invited' });
        return;
      }

      setInvitedEmails(prev => [...prev, {
        email: email,
        permissions: { ...permissions }
      }]);

      // Reset email input
      setEmail('');
      setErrors({});
    }
  };

  // Remove user from invited list
  const handleRemoveInvite = (userId: string) => {
    setInvitedUsers(prev => prev.filter(u => u.user_id !== userId));
  };

  // Remove email from invited list
  const handleRemoveEmailInvite = (emailToRemove: string) => {
    setInvitedEmails(prev => prev.filter(e => e.email !== emailToRemove));
  };

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
    if (loading) return; // Prevent double-submit
    if (createdProjectId) return; // Project already created

    setLoading(true);

    try {
      const project = await create(formData);

      if (project) {
        // Send invitations to registered users
        if (invitedUsers.length > 0) {
          const userInvitePromises = invitedUsers.map(invite =>
            inviteCollaborator(project.id, {
              user_id: invite.user_id,
              ...invite.permissions
            })
          );

          try {
            await Promise.all(userInvitePromises);
            console.log(`✅ Sent ${invitedUsers.length} user invitations`);
          } catch (inviteError) {
            console.error('Failed to send some user invitations:', inviteError);
            // Continue anyway - project created successfully
          }
        }

        // Send email invitations to non-registered users
        if (invitedEmails.length > 0) {
          const emailInvitePromises = invitedEmails.map(invite =>
            inviteByEmail({
              email: invite.email,
              projectId: project.id,
              projectName: formData.title,
              role: invite.permissions.role,
              permissions: invite.permissions
            })
          );

          try {
            const results = await Promise.all(emailInvitePromises);
            const successCount = results.filter(r => r.success).length;
            console.log(`✅ Sent ${successCount}/${invitedEmails.length} email invitations`);
          } catch (emailError) {
            console.error('Failed to send some email invitations:', emailError);
            // Continue anyway - project created successfully
          }
        }

        // Store project ID for Step 5 (Track Upload)
        setCreatedProjectId(project.id);

        // Move to Step 5 (Track Upload) instead of closing
        setCurrentStep(5);
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

    setCurrentStep((prev) => Math.min(prev + 1, 5) as 1 | 2 | 3 | 4 | 5);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3 | 4 | 5);
    setErrors({});
  };

  // Skip Step 3 (Invite) - optional step
  const handleSkipInvite = () => {
    setCurrentStep(4);
    setErrors({});
  };

  // Handle track file selection
  const handleTrackFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  // Handle track upload
  const handleTrackUpload = async () => {
    if (!selectedFile || !createdProjectId) return;

    try {
      await uploadTrack(selectedFile);
      setTrackUploaded(true);
      setSelectedFile(null);
    } catch (error) {
      console.error('Track upload failed:', error);
    }
  };

  // Finish wizard (from Step 5)
  const handleFinishWizard = () => {
    if (createdProjectId) {
      // Close modal
      onClose();

      // Navigate to project
      navigate(`/projects/${createdProjectId}`);

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
      setInvitedUsers([]);
      setInvitedEmails([]);
      setCurrentStep(1);
      setCreatedProjectId(null);
      setTrackUploaded(false);
    }
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
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Invite</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Visibility</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 5 ? 'active' : ''}`}>
            <div className="step-number">5</div>
            <div className="step-label">Upload Track</div>
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

          {/* Step 3: Invite Collaborators (Optional) */}
          {currentStep === 3 && (
          <section className="modal-section">
            <h3>Invite Collaborators (Optional)</h3>
            <p className="form-hint" style={{ marginBottom: '1rem' }}>
              You can invite team members now or later from the project page
            </p>

            {/* Tabs */}
            <div className="invite-tabs">
              <button
                type="button"
                className={`invite-tab ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                🔍 Search Users
              </button>
              <button
                type="button"
                className={`invite-tab ${activeTab === 'email' ? 'active' : ''}`}
                onClick={() => setActiveTab('email')}
              >
                ✉️ Invite by Email
              </button>
            </div>

            {/* Tab 1: Search Users */}
            {activeTab === 'search' && (
              <>
                <div className="form-group">
                  <label htmlFor="search">Search by name or username</label>
                  <input
                    type="text"
                    id="search"
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Type to search..."
                    className="form-input"
                    autoComplete="off"
                  />
                </div>

                {/* Search Results Dropdown */}
                {results.length > 0 && (
                  <div className="user-search-results">
                    {results.map((user) => (
                      <div
                        key={user.id}
                        className="user-result-item"
                        onClick={() => handleSelectUser(user)}
                      >
                        <div className="user-avatar">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} />
                          ) : (
                            <div className="avatar-placeholder">
                              {user.full_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="user-info">
                          <div className="user-name">{user.full_name || 'Unknown'}</div>
                          <div className="user-username">@{user.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchLoading && <p className="search-loading">Searching...</p>}

                {/* Selected User */}
                {selectedUser && (
                  <div className="selected-user">
                    <p className="selected-label">Selected:</p>
                    <div className="user-result-item selected">
                      <div className="user-avatar">
                        {selectedUser.avatar_url ? (
                          <img src={selectedUser.avatar_url} alt={selectedUser.username} />
                        ) : (
                          <div className="avatar-placeholder">
                            {selectedUser.full_name?.[0]?.toUpperCase() || selectedUser.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{selectedUser.full_name || 'Unknown'}</div>
                        <div className="user-username">@{selectedUser.username}</div>
                      </div>
                      <button
                        type="button"
                        className="clear-selection"
                        onClick={() => setSelectedUser(null)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Tab 2: Invite by Email */}
            {activeTab === 'email' && (
              <>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="form-input"
                  />
                  <p className="form-hint">
                    Invite someone who doesn't have an account yet
                  </p>
                </div>

                <div className="email-invite-info">
                  <p>📧 They will receive an email with instructions to join DegixDAW</p>
                  <p>✅ Once they sign up, they'll automatically be added to this project</p>
                </div>
              </>
            )}

            {/* Invited Users List - Show BEFORE role/permissions */}
            {(invitedUsers.length > 0 || invitedEmails.length > 0) && (
              <div className="invited-users-list" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <h4>Invited ({invitedUsers.length + invitedEmails.length})</h4>

                {/* Registered Users */}
                {invitedUsers.map((invite) => (
                  <div key={invite.user_id} className="invited-user-item">
                    <span>@{invite.username}</span>
                    <span className="badge badge-blue">{invite.permissions.role}</span>
                    <button
                      type="button"
                      className="remove-invite-btn"
                      onClick={() => handleRemoveInvite(invite.user_id)}
                      aria-label="Remove invite"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Email Invites */}
                {invitedEmails.map((invite) => (
                  <div key={invite.email} className="invited-user-item">
                    <span>✉️ {invite.email}</span>
                    <span className="badge badge-purple">{invite.permissions.role}</span>
                    <button
                      type="button"
                      className="remove-invite-btn"
                      onClick={() => handleRemoveEmailInvite(invite.email)}
                      aria-label="Remove invite"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Role Selection (both tabs) */}
            <div className="form-group">
              <label>Role</label>
              <div className="role-buttons">
                {Object.keys(ROLE_PRESETS).map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`role-button ${selectedRole === role ? 'active' : ''}`}
                    onClick={() => handleRoleChange(role as 'viewer' | 'contributor' | 'mixer' | 'admin')}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div className="form-group">
              <label>Permissions</label>
              <div className="permissions-list">
                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.can_edit}
                    onChange={() => togglePermission('can_edit')}
                  />
                  <span>Edit Tracks</span>
                </label>
                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.can_download}
                    onChange={() => togglePermission('can_download')}
                  />
                  <span>Download</span>
                </label>
                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.can_upload_audio}
                    onChange={() => togglePermission('can_upload_audio')}
                  />
                  <span>Upload Audio</span>
                </label>
                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.can_upload_mixdown}
                    onChange={() => togglePermission('can_upload_mixdown')}
                  />
                  <span>Upload Mixdown</span>
                </label>
                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.can_comment}
                    onChange={() => togglePermission('can_comment')}
                  />
                  <span>Comment</span>
                </label>
                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.can_invite_others}
                    onChange={() => togglePermission('can_invite_others')}
                  />
                  <span>Invite Others</span>
                </label>
              </div>
            </div>

            {/* Add Invite Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddInvite}
              disabled={activeTab === 'search' && !selectedUser}
              style={{ marginTop: '1rem' }}
            >
              ➕ Add to Invite List
            </Button>

            {errors.invite && <div className="error-message">{errors.invite}</div>}
          </section>
          )}

          {/* Step 4: Visibility */}
          {currentStep === 4 && (
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

          {/* Step 5: Upload Track (Optional) */}
          {currentStep === 5 && (
          <section className="modal-section">
            <h3>🎉 Project Created!</h3>
            <p className="success-message" style={{ marginBottom: '1.5rem' }}>
              ✅ Your project "<strong>{formData.title}</strong>" has been created successfully!
            </p>

            {/* Invitations sent info */}
            {(invitedUsers.length > 0 || invitedEmails.length > 0) && (
              <div className="invitations-sent-info" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>📧 Invitations Sent</h4>
                <p>
                  {invitedUsers.length + invitedEmails.length} invitation{invitedUsers.length + invitedEmails.length > 1 ? 's' : ''} sent!
                  Collaborators will see the invite on their dashboard.
                </p>
                {invitedUsers.length > 0 && (
                  <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                    {invitedUsers.map(u => (
                      <li key={u.user_id}>@{u.username} ({u.permissions.role})</li>
                    ))}
                  </ul>
                )}
                {invitedEmails.length > 0 && (
                  <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                    {invitedEmails.map(e => (
                      <li key={e.email}>✉️ {e.email} ({e.permissions.role})</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <h4 style={{ marginBottom: '1rem' }}>Upload Your First Track (Optional)</h4>
            <p className="form-hint" style={{ marginBottom: '1.5rem' }}>
              Get started by uploading a track now, or skip and add tracks later from the project page.
            </p>

            {createdProjectId && (
              <div className="track-upload-section">
                <TrackUploadZone
                  projectId={createdProjectId}
                  onUploadStart={handleTrackFileSelect}
                  onUploadError={(error: string) => {
                    console.error('Track upload error:', error);
                  }}
                  disabled={trackUploading || trackUploaded}
                />

                {selectedFile && !trackUploaded && (
                  <div style={{ marginTop: '1rem' }}>
                    <Button
                      variant="primary"
                      onClick={handleTrackUpload}
                      disabled={trackUploading}
                    >
                      {trackUploading ? 'Uploading...' : `Upload ${selectedFile.name}`}
                    </Button>
                  </div>
                )}

                {trackUploaded && (
                  <div className="upload-success-message" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--success-bg, #d4edda)', borderRadius: '8px' }}>
                    ✅ Track uploaded successfully! You can upload more tracks from the project page.
                  </div>
                )}
              </div>
            )}

            <div className="wizard-completion-hint" style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <p style={{ marginBottom: 0 }}>
                💡 <strong>What's next?</strong> Click "Go to Project" to start collaborating!
              </p>
            </div>
          </section>
          )}

          {/* Actions */}
          <div className="modal-actions">
            {/* Back Button (show on step 2, 3, and 4, but NOT on step 5) */}
            {currentStep > 1 && currentStep < 5 && (
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

            {/* Skip Button (show on step 3 - Invite is optional) */}
            {currentStep === 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipInvite}
                disabled={loading}
              >
                Skip
              </Button>
            )}

            {/* Next Button (show on step 3) */}
            {currentStep === 3 && (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                disabled={loading}
              >
                Next →
              </Button>
            )}

            {/* Create Button (show on step 4) - This will trigger handleSubmit and move to step 5 */}
            {currentStep === 4 && (
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : '✨ Create Project'}
              </Button>
            )}

            {/* Skip & Go to Project (show on step 5) */}
            {currentStep === 5 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFinishWizard}
                  disabled={loading}
                >
                  Skip Upload
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleFinishWizard}
                  disabled={loading}
                >
                  Go to Project →
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
