import type { FileBrowserTab, AttachmentItem } from '../../hooks/useAllAttachments';
import AddToProjectButton from './AddToProjectButton';

interface FileBrowserTableViewProps {
	userId: string;
	activeTab: FileBrowserTab;
	loading: boolean;
	sortedFiles: AttachmentItem[];
	selectedFiles: Set<string>;
	sortBy: 'name' | 'user' | 'date' | 'size';
	sortDirection: 'asc' | 'desc';
	searchQuery: string;
	deletingSelected: boolean;
	deleting: string | null;
	onSort: (field: 'name' | 'user' | 'date' | 'size') => void;
	onToggleAll: () => void;
	onToggleFile: (fileId: string) => void;
	onDeleteSelected: () => void;
	onSearchChange: (query: string) => void;
	onDelete: (file: AttachmentItem) => void;
	getFileIcon: (type: string) => string;
	formatSize: (bytes: number) => string;
	formatTime: (timestamp: string) => string;
	onRefreshProjects?: () => void; // Refresh callback for projects tab
}

export default function FileBrowserTableView({
	userId,
	activeTab,
	loading,
	sortedFiles,
	selectedFiles,
	sortBy,
	sortDirection,
	searchQuery,
	deletingSelected,
	deleting,
	onSort,
	onToggleAll,
	onToggleFile,
	onDeleteSelected,
	onSearchChange,
	onDelete,
	getFileIcon,
	formatSize,
	formatTime,
	onRefreshProjects,
}: FileBrowserTableViewProps) {
	return (
		<div className="file-browser-table">
			{/* Table Header */}
			<div className="table-header">
				<div className="table-header-cell table-col-checkbox">
					<input
						type="checkbox"
						checked={sortedFiles.length > 0 && selectedFiles.size === sortedFiles.length}
						onChange={onToggleAll}
						title="Alle auswählen"
					/>
				</div>
				<div className="table-header-cell table-col-name" onClick={() => onSort('name')}>
					Name {sortBy === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
				</div>
				<div className="table-header-cell table-col-comment">Kommentar</div>
				<div className="table-header-cell table-col-user" onClick={() => onSort('user')}>
					{activeTab === 'received' ? 'Sender' : activeTab === 'sent' ? 'Empfänger' : 'User'}
					{sortBy === 'user' && (sortDirection === 'asc' ? '▲' : '▼')}
				</div>
				<div className="table-header-cell table-col-date" onClick={() => onSort('date')}>
					Datum {sortBy === 'date' && (sortDirection === 'asc' ? '▲' : '▼')}
				</div>
				<div className="table-header-cell table-col-size" onClick={() => onSort('size')}>
					Größe {sortBy === 'size' && (sortDirection === 'asc' ? '▲' : '▼')}
				</div>
				<div className="table-header-cell table-col-actions">Aktionen</div>
			</div>

			{/* Search Row */}
			<div className="table-search-row">
				<div className="table-search-cell table-col-checkbox">
					{selectedFiles.size > 0 && (
						<button
							className="btn-delete-selected"
							onClick={onDeleteSelected}
							disabled={deletingSelected}
							title={`${selectedFiles.size} Dateien löschen`}
						>
							{deletingSelected ? '⏳' : `🗑️ ${selectedFiles.size}`}
						</button>
					)}
				</div>
				<div className="table-search-cell table-col-name">
					<input
						type="text"
						className="table-search-input"
						placeholder="🔍 Suchen..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
					/>
				</div>
				<div className="table-search-cell table-col-comment"></div>
				<div className="table-search-cell table-col-user"></div>
				<div className="table-search-cell table-col-date"></div>
				<div className="table-search-cell table-col-size"></div>
				<div className="table-search-cell table-col-actions"></div>
			</div>

			{/* Table Body */}
			<div className="table-body">
				{loading ? (
					<div className="table-empty">
						<div className="spinner"></div>
						<p>Lade Dateien...</p>
					</div>
				) : sortedFiles.length === 0 ? (
					<div className="table-empty">
						<p>📭 Keine Dateien gefunden</p>
						{activeTab === 'all' && <small>Lade Dateien hoch oder empfange welche</small>}
						{activeTab === 'received' && <small>Noch keine Dateien empfangen</small>}
						{activeTab === 'sent' && <small>Noch keine Dateien gesendet</small>}
						{activeTab === 'my_files' && <small>Noch keine persönlichen Dateien</small>}
					</div>
				) : (
					sortedFiles.map((file) => (
						<div key={file.id} className="table-row">
							{/* Checkbox */}
							<div className="table-cell table-col-checkbox">
								<input
									type="checkbox"
									checked={selectedFiles.has(file.id)}
									onChange={() => onToggleFile(file.id)}
									onClick={(e) => e.stopPropagation()}
								/>
							</div>

							{/* Name */}
							<div className="table-cell table-col-name">
								<span className="file-icon">{getFileIcon(file.fileType)}</span>
								<span className="file-name" title={file.fileName}>{file.fileName}</span>
							</div>

							{/* Comment */}
							<div className="table-cell table-col-comment" title={file.messageContent || ''}>
								{file.messageContent || ''}
							</div>

							{/* User */}
							<div className="table-cell table-col-user">
								{activeTab === 'received' && file.senderName}
								{activeTab === 'sent' && file.recipientName}
								{activeTab === 'all' && (file.senderId === userId ? `→ ${file.recipientName}` : `← ${file.senderName}`)}
								{activeTab === 'my_files' && 'Ich'}
								{activeTab === 'projects' && file.senderName}
							</div>

							{/* Date */}
							<div className="table-cell table-col-date">
								{formatTime(file.createdAt)}
							</div>

							{/* Size */}
							<div className="table-cell table-col-size">
								{formatSize(file.fileSize)}
							</div>

							{/* Actions */}
							<div className="table-cell table-col-actions">
								{activeTab === 'projects' ? (
									<>
										<button
											className="table-action-btn"
											title="Öffnen"
											onClick={() => alert('Preview coming soon!')}
										>
											👁️
										</button>
										<button
											onClick={() => onDelete(file)}
											className="table-action-btn table-action-btn--delete"
											title="Löschen"
											disabled={deleting === file.id}
										>
											{deleting === file.id ? '⏳' : '🗑️'}
										</button>
									</>
								) : file.signedUrl ? (
									<>
										<a
											href={file.signedUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="table-action-btn"
											title="Öffnen"
										>
											👁️
										</a>
										<a
											href={file.signedUrl}
											download={file.fileName}
											className="table-action-btn"
											title="Download"
										>
											⬇️
										</a>
										{/* Add to Project button for audio files */}
										{file.fileType.startsWith('audio/') && (
											<AddToProjectButton
												messageId={file.messageId}
												chatFilePath={file.fileUrl}
												fileName={file.fileName}
												fileType={file.fileType}
												fileSize={file.fileSize}
												compact={true}
											/>
										)}
										<button
											onClick={() => onDelete(file)}
											className="table-action-btn table-action-btn--delete"
											title="Löschen"
											disabled={deleting === file.id}
										>
											{deleting === file.id ? '⏳' : '🗑️'}
										</button>
									</>
								) : (
									<span className="table-action-btn" title="Lädt...">⏳</span>
								)}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
