import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { FileBrowserTab, FileTypeFilter, AttachmentItem } from './useAllAttachments';

type ViewMode = 'table' | 'grid';
type SortField = 'name' | 'user' | 'date' | 'size';
type SortDirection = 'asc' | 'desc';

interface UseFileBrowserActionsProps {
	userId: string;
	filterByTab: (tab: FileBrowserTab) => AttachmentItem[];
	filterByType: (files: AttachmentItem[], type: FileTypeFilter) => AttachmentItem[];
	refresh: () => void;
}

export function useFileBrowserActions({ userId, filterByTab, filterByType, refresh }: UseFileBrowserActionsProps) {
	// UI State
	const [activeTab, setActiveTab] = useState<FileBrowserTab>('all');
	const [view, setView] = useState<ViewMode>('table');
	const [filter, setFilter] = useState<FileTypeFilter>('all');
	const [sortBy, setSortBy] = useState<SortField>('date');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedUser, setSelectedUser] = useState<string>('all');
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
	const [deleting, setDeleting] = useState<string | null>(null);
	const [deletingSelected, setDeletingSelected] = useState(false);

	// Get files for current tab
	const tabFiles = filterByTab(activeTab);
	const typeFilteredFiles = filterByType(tabFiles, filter);

	// Filter by search query
	const searchFilteredFiles = typeFilteredFiles.filter(file => {
		if (!searchQuery) return true;
		return file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
	});

	// Filter by user
	const userFilteredFiles = searchFilteredFiles.filter(file => {
		if (selectedUser === 'all') return true;
		return file.senderId === selectedUser || file.recipientId === selectedUser;
	});

	// Sort files
	const sortedFiles = useMemo(() => {
		return [...userFilteredFiles].sort((a, b) => {
			let comparison = 0;

			if (sortBy === 'name') {
				comparison = a.fileName.localeCompare(b.fileName);
			} else if (sortBy === 'user') {
				const aUser = activeTab === 'received' ? a.senderName : a.recipientName;
				const bUser = activeTab === 'received' ? b.senderName : b.recipientName;
				comparison = aUser.localeCompare(bUser);
			} else if (sortBy === 'date') {
				comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			} else if (sortBy === 'size') {
				comparison = a.fileSize - b.fileSize;
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});
	}, [userFilteredFiles, sortBy, sortDirection, activeTab]);

	// Stats
	const allFiles = filterByTab('all');
	const receivedFiles = filterByTab('received');
	const sentFiles = filterByTab('sent');
	const myFiles = filterByTab('my_files');

	const totalSize = sortedFiles.reduce((sum, file) => sum + file.fileSize, 0);
	const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

	// Available users for filter dropdown
	const availableUsers = useMemo(() => {
		return Array.from(
			new Set(
				tabFiles.flatMap(file => {
					const users = [];
					if (file.senderId !== userId) users.push(file.senderId);
					if (file.recipientId !== userId) users.push(file.recipientId);
					return users;
				})
			)
		).map(uid => {
			const file = tabFiles.find(f => f.senderId === uid || f.recipientId === uid);
			return {
				id: uid,
				name: file?.senderId === uid ? file.senderName : file?.recipientName || 'Unknown'
			};
		}).sort((a, b) => a.name.localeCompare(b.name));
	}, [tabFiles, userId]);

	// Handlers
	const handleSort = (column: SortField) => {
		if (sortBy === column) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(column);
			setSortDirection('asc');
		}
	};

	const handleDelete = async (file: AttachmentItem) => {
		if (!confirm(`"${file.fileName}" KOMPLETT löschen?\n\n⚠️ Datei wird aus Chat + Storage + DB gelöscht!`)) {
			return;
		}

		setDeleting(file.id);

		try {
			console.log('🗑️ Hard deleting attachment:', file.id, file.fileUrl);

			// 1. Delete from storage (chat-attachments bucket)
			const { error: storageError } = await supabase.storage
				.from('chat-attachments')
				.remove([file.fileUrl]);

			if (storageError) {
				console.warn('⚠️ Storage delete failed (file may not exist):', storageError);
			} else {
				console.log('✅ File deleted from storage');
			}

			// 2. Delete from message_attachments table (hard delete)
			const { error: dbError } = await supabase
				.from('message_attachments')
				.delete()
				.eq('id', file.id);

			if (dbError) {
				console.error('❌ DB delete failed:', dbError);
				throw dbError;
			}

			console.log('✅ Attachment deleted from DB');
			// Refresh will happen via realtime subscription
		} catch (err) {
			console.error('Failed to delete file:', err);
			alert('Fehler beim Löschen der Datei');
		} finally {
			setDeleting(null);
		}
	};

	const handleToggleFile = (fileId: string) => {
		setSelectedFiles(prev => {
			const newSet = new Set(prev);
			if (newSet.has(fileId)) {
				newSet.delete(fileId);
			} else {
				newSet.add(fileId);
			}
			return newSet;
		});
	};

	const handleToggleAll = () => {
		if (selectedFiles.size === sortedFiles.length) {
			setSelectedFiles(new Set());
		} else {
			setSelectedFiles(new Set(sortedFiles.map(f => f.id)));
		}
	};

	const handleDeleteSelected = async () => {
		const count = selectedFiles.size;
		if (count === 0) {
			alert('Keine Dateien ausgewählt!');
			return;
		}

		if (!confirm(`${count} Datei${count > 1 ? 'en' : ''} KOMPLETT löschen?\n\n⚠️ Dateien werden aus Chat + Storage + DB gelöscht!`)) {
			return;
		}

		setDeletingSelected(true);

		try {
			// Get all selected files details for storage paths
			const filesToDelete = sortedFiles.filter(f => selectedFiles.has(f.id));

			const deletePromises = filesToDelete.map(async (file) => {
				try {
					// Delete from storage
					const { error: storageError } = await supabase.storage
						.from('chat-attachments')
						.remove([file.fileUrl]);

					if (storageError) {
						console.warn('Storage delete failed for', file.id, storageError);
					}

					// Delete from DB
					const { error: dbError } = await supabase
						.from('message_attachments')
						.delete()
						.eq('id', file.id);

					if (dbError) throw dbError;
				} catch (err) {
					console.error('Failed to delete file:', file.id, err);
				}
			});

			await Promise.all(deletePromises);

			setSelectedFiles(new Set());
			alert(`${count} Datei${count > 1 ? 'en' : ''} wurde${count > 1 ? 'n' : ''} gelöscht.`);
		} catch (err) {
			console.error('Delete selected error:', err);
			alert('Fehler beim Löschen der Dateien');
		} finally {
			setDeletingSelected(false);
		}
	};

	const handleCleanupBroken = async () => {
		const brokenFiles = sortedFiles.filter(f => !f.signedUrl);

		if (brokenFiles.length === 0) {
			alert('Keine kaputten Dateien gefunden!');
			return;
		}

		if (!confirm(`${brokenFiles.length} Dateien sind kaputt (existieren in DB aber nicht im Storage).\n\nMöchtest du diese für dich ausblenden?`)) {
			return;
		}

		setDeletingSelected(true);

		try {
			const deletePromises = brokenFiles.map(async (file) => {
				const { error } = await supabase.rpc('soft_delete_attachment', {
					p_attachment_id: file.id
				});

				if (error) {
					console.error('Failed to delete broken file:', file.fileName, error);
				}
			});

			await Promise.all(deletePromises);

			alert(`${brokenFiles.length} kaputte Einträge wurden für dich ausgeblendet.`);
		} catch (err) {
			console.error('Cleanup error:', err);
			alert('Fehler beim Aufräumen');
		} finally {
			setDeletingSelected(false);
		}
	};

	// Reset deleting state when file disappears
	useEffect(() => {
		if (deleting && !sortedFiles.find(f => f.id === deleting)) {
			setDeleting(null);
		}
	}, [sortedFiles, deleting]);

	// Helpers
	const getFileIcon = (type: string) => {
		if (type.startsWith('image/')) return '🖼️';
		if (type.startsWith('video/')) return '🎥';
		if (type.startsWith('audio/')) return '🎵';
		if (type.includes('pdf')) return '📕';
		if (type.includes('word')) return '📄';
		if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
		if (type.includes('text')) return '📝';
		return '📁';
	};

	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
	};

	const formatTime = (dateStr: string) => {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'gerade eben';
		if (diffMins < 60) return `vor ${diffMins} Min`;
		if (diffHours < 24) return `vor ${diffHours} Std`;
		if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;

		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	};

	return {
		// State
		activeTab,
		view,
		filter,
		sortBy,
		sortDirection,
		searchQuery,
		selectedUser,
		selectedFiles,
		deleting,
		deletingSelected,

		// State setters
		setActiveTab,
		setView,
		setFilter,
		setSearchQuery,
		setSelectedUser,

		// Derived data
		sortedFiles,
		allFiles,
		receivedFiles,
		sentFiles,
		myFiles,
		totalSizeMB,
		availableUsers,

		// Handlers
		handleSort,
		handleDelete,
		handleToggleFile,
		handleToggleAll,
		handleDeleteSelected,
		handleCleanupBroken,

		// Helpers
		getFileIcon,
		formatSize,
		formatTime,
	};
}
