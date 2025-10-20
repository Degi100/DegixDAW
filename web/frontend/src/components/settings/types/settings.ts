import React from 'react';

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;
export type FormHandler = (e: React.FormEvent) => Promise<void>;
export type SimpleHandler = () => Promise<void>;

export interface ProfileDataState {
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
}

export interface SecurityDataState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  newEmail: string;
}

export interface EmailChangeInfo {
  oldEmail: string;
  newEmail: string;
}

export interface ProfileSettingsProps {
  profileData: ProfileDataState;
  setProfileData: SetState<ProfileDataState>;
  isUpdating: boolean;
  handleProfileSave: FormHandler;
}

export interface SecuritySettingsProps {
  securityData: SecurityDataState;
  setSecurityData: SetState<SecurityDataState>;
  isUpdating: boolean;
  handlePasswordChange: FormHandler;
  handleEmailChange: FormHandler;
  userEmail: string;
}

export interface AccountSettingsProps {
  handleLogout?: SimpleHandler;
}

export interface DeleteAccountModalProps {
  show: boolean;
  onClose: () => void;
  onDelete: SimpleHandler;
  isUpdating: boolean;
}

export interface EmailChangeInfoModalProps {
  show: boolean;
  info: EmailChangeInfo | null;
  onClose: () => void;
}
