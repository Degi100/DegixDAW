// ============================================
// USER FILES SERVICE
// Central file registry for File Browser
// ============================================

import { supabase } from '../../supabase';
import type {
  UserFile,
  CreateUserFileRequest,
  UpdateUserFileRequest,
  UserFileWithUsage,
} from '../../../types/userFiles';

// ============================================
// Get User Files
// ============================================

export async function getUserFiles(userId: string): Promise<UserFile[]> {
  try {
    const { data, error } = await supabase
      .from('user_files')
      .select(`
        *,
        uploader:uploaded_by(id, username, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user files:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getUserFiles failed:', error);
    return [];
  }
}

// ============================================
// Get User Files with Usage Info
// ============================================

export async function getUserFilesWithUsage(userId: string): Promise<UserFileWithUsage[]> {
  try {
    const files = await getUserFiles(userId);

    // For each file, get projects where it's used
    const filesWithUsage = await Promise.all(
      files.map(async (file) => {
        if (!file.source_project_ids || file.source_project_ids.length === 0) {
          return {
            ...file,
            used_in_projects: [],
            is_in_project: false,
          };
        }

        // Fetch project details
        const { data: projects } = await supabase
          .from('projects')
          .select('id, title')
          .in('id', file.source_project_ids);

        return {
          ...file,
          used_in_projects: projects || [],
          is_in_project: (projects?.length || 0) > 0,
        };
      })
    );

    return filesWithUsage;
  } catch (error) {
    console.error('getUserFilesWithUsage failed:', error);
    return [];
  }
}

// ============================================
// Get Single User File
// ============================================

export async function getUserFile(fileId: string): Promise<UserFile | null> {
  try {
    const { data, error } = await supabase
      .from('user_files')
      .select(`
        *,
        uploader:uploaded_by(id, username, avatar_url)
      `)
      .eq('id', fileId)
      .single();

    if (error) {
      console.error('Error fetching user file:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('getUserFile failed:', error);
    return null;
  }
}

// ============================================
// Create User File
// ============================================

export async function createUserFile(data: CreateUserFileRequest): Promise<UserFile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileData = {
      user_id: user.id,
      uploaded_by: user.id,
      file_name: data.file_name,
      file_path: data.file_path,
      file_type: data.file_type,
      file_size: data.file_size || null,
      duration_ms: data.duration_ms || null,
      source: data.source,
      source_message_id: data.source_message_id || null,
      source_project_ids: data.source_project_ids || null,
      metadata: data.metadata || null,
    };

    const { data: file, error } = await supabase
      .from('user_files')
      .insert(fileData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user file:', error);
      throw error;
    }

    return file;
  } catch (error) {
    console.error('createUserFile failed:', error);
    return null;
  }
}

// ============================================
// Update User File
// ============================================

export async function updateUserFile(
  fileId: string,
  updates: UpdateUserFileRequest
): Promise<UserFile | null> {
  try {
    const { data, error } = await supabase
      .from('user_files')
      .update(updates)
      .eq('id', fileId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user file:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateUserFile failed:', error);
    return null;
  }
}

// ============================================
// Delete User File (and Storage)
// ============================================

export async function deleteUserFile(fileId: string): Promise<boolean> {
  try {
    // Get file info first
    const file = await getUserFile(fileId);
    if (!file) throw new Error('File not found');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('shared_files')
      .remove([file.file_path]);

    if (storageError) {
      console.warn('Storage delete failed (file may not exist):', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('user_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      console.error('Database delete failed:', dbError);
      throw dbError;
    }

    return true;
  } catch (error) {
    console.error('deleteUserFile failed:', error);
    return false;
  }
}

// ============================================
// Add File to Project (Update source_project_ids array)
// ============================================

export async function addFileToProject(fileId: string, projectId: string): Promise<UserFile | null> {
  try {
    const file = await getUserFile(fileId);
    if (!file) throw new Error('File not found');

    // Add project ID to array if not already present
    const currentProjects = file.source_project_ids || [];
    if (currentProjects.includes(projectId)) {
      console.log('File already in project');
      return file;
    }

    const updatedProjects = [...currentProjects, projectId];

    return await updateUserFile(fileId, {
      source: 'project',
      source_project_ids: updatedProjects,
    });
  } catch (error) {
    console.error('addFileToProject failed:', error);
    return null;
  }
}

// ============================================
// Remove File from Project
// ============================================

export async function removeFileFromProject(
  fileId: string,
  projectId: string
): Promise<UserFile | null> {
  try {
    const file = await getUserFile(fileId);
    if (!file) throw new Error('File not found');

    // Remove project ID from array
    const currentProjects = file.source_project_ids || [];
    const updatedProjects = currentProjects.filter((id) => id !== projectId);

    // If no more projects, change source back to 'upload'
    const newSource = updatedProjects.length === 0 ? 'upload' : 'project';

    return await updateUserFile(fileId, {
      source: newSource,
      source_project_ids: updatedProjects.length > 0 ? updatedProjects : null,
    });
  } catch (error) {
    console.error('removeFileFromProject failed:', error);
    return null;
  }
}

// ============================================
// Move File from Chat to Shared Storage
// ============================================

export async function moveFileFromChatToShared(
  messageId: string,
  chatFilePath: string,  // Could be full URL or storage path
  fileName: string,
  fileType: string
): Promise<UserFile | null> {
  try {
    console.log('📦 moveFileFromChatToShared called with:', { messageId, chatFilePath, fileName, fileType });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('✅ User authenticated:', user.id);

    // Get the actual storage path AND file_size from the attachment record
    const { data: attachment, error: attachError } = await supabase
      .from('message_attachments')
      .select('storage_path, file_size')
      .eq('message_id', messageId)
      .eq('file_name', fileName)
      .maybeSingle();

    let actualStoragePath = chatFilePath;

    if (attachment && attachment.storage_path) {
      actualStoragePath = attachment.storage_path;
      console.log('✅ Found storage_path in DB:', actualStoragePath);
    } else {
      // Fallback: Files are stored as {conversationId}/{messageId}/{timestamp}.{ext}
      // The chatFilePath already contains this full path!
      actualStoragePath = chatFilePath;
      console.log('⚠️ No storage_path in DB, using chatFilePath directly:', actualStoragePath);
    }

    // Generate new file path in shared_files
    const fileExt = fileName.split('.').pop();
    const timestamp = Date.now();
    const newFileName = `${timestamp}.${fileExt}`;
    const newFilePath = `${user.id}/${newFileName}`;

    console.log('📁 New file path will be:', newFilePath);

    // Copy file from chat-attachments to shared_files
    // Note: Supabase doesn't have a copy API, so we download and re-upload
    console.log('⬇️ Downloading from chat-attachments bucket, path:', actualStoragePath);
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('chat-attachments')
      .download(actualStoragePath);

    if (downloadError) {
      console.error('❌ Download error:', downloadError);
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    console.log('✅ File downloaded, size:', fileBlob?.size);

    console.log('⬆️ Uploading to shared_files bucket, path:', newFilePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('shared_files')
      .upload(newFilePath, fileBlob, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('✅ File uploaded successfully:', uploadData);

    // Create user_files entry with file_size from attachment or blob
    const fileSize = attachment?.file_size || fileBlob.size;
    console.log('📊 Using file_size:', fileSize, '(from', attachment?.file_size ? 'DB' : 'blob', ')');

    const userFile = await createUserFile({
      file_name: fileName,
      file_path: uploadData.path,
      file_type: fileType,
      file_size: fileSize,
      source: 'chat',
      source_message_id: messageId,
    });

    return userFile;
  } catch (error) {
    console.error('moveFileFromChatToShared failed:', error);
    return null;
  }
}

// ============================================
// Get Files by Source
// ============================================

export async function getUserFilesBySource(
  userId: string,
  source: 'chat' | 'upload' | 'project'
): Promise<UserFile[]> {
  try {
    const { data, error } = await supabase
      .from('user_files')
      .select('*')
      .eq('user_id', userId)
      .eq('source', source)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files by source:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getUserFilesBySource failed:', error);
    return [];
  }
}

// ============================================
// Get Project Files (grouped by ownership)
// ============================================

export interface ProjectFilesGrouped {
  ownedByMe: UserFile[];
  ownedByOthers: UserFile[];
}

export async function getProjectFilesGrouped(
  projectId: string,
  currentUserId: string
): Promise<ProjectFilesGrouped> {
  try {
    // Get all user_files that are in this project
    const { data: files, error } = await supabase
      .from('user_files')
      .select('*')
      .contains('source_project_ids', [projectId]);

    if (error) {
      console.error('Error fetching project files:', error);
      throw error;
    }

    const ownedByMe = files?.filter((f) => f.user_id === currentUserId) || [];
    const ownedByOthers = files?.filter((f) => f.user_id !== currentUserId) || [];

    return { ownedByMe, ownedByOthers };
  } catch (error) {
    console.error('getProjectFilesGrouped failed:', error);
    return { ownedByMe: [], ownedByOthers: [] };
  }
}
