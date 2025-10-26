import type { FileBrowserTab, AttachmentItem } from '../../hooks/useAllAttachments';
import AddToProjectButton from './AddToProjectButton';

interface FileBrowserGridViewProps {
	activeTab: FileBrowserTab;
	loading: boolean;
	sortedFiles: AttachmentItem[];
	deleting: string | null;
	onDelete: (file: AttachmentItem) => void;
	getFileIcon: (type: string) => string;
	formatSize: (bytes: number) => string;
	formatTime: (timestamp: string) => string;
}

export default function FileBrowserGridView({
	activeTab,
	loading,
	sortedFiles,
	deleting,
	onDelete,
	getFileIcon,
	formatSize,
	formatTime,
}: FileBrowserGridViewProps) {
	return (
		<div className="file-browser-grid">
			{loading ? (
				<div className="grid-empty">
					<div className="spinner"></div>
					<p>Lade Dateien...</p>
				</div>
			) : sortedFiles.length === 0 ? (
				<div className="grid-empty">
					<p>📭 Keine Dateien gefunden</p>
					{activeTab === 'all' && <small>Lade Dateien hoch oder empfange welche</small>}
					{activeTab === 'received' && <small>Noch keine Dateien empfangen</small>}
					{activeTab === 'sent' && <small>Noch keine Dateien gesendet</small>}
					{activeTab === 'my_files' && <small>Noch keine persönlichen Dateien</small>}
				</div>
			) : (
				sortedFiles.map((file) => (
					<div key={file.id} className="grid-item">
						<div className="grid-item-preview">
							{file.fileType.startsWith('image/') ? (
								file.signedThumbnailUrl || file.signedUrl ? (
									<img src={file.signedThumbnailUrl || file.signedUrl || ''} alt={file.fileName} />
								) : (
									<div className="grid-item-icon">⏳</div>
								)
							) : file.fileType.startsWith('video/') && file.signedThumbnailUrl ? (
								<img src={file.signedThumbnailUrl} alt={file.fileName} />
							) : (
								<div className="grid-item-icon">{getFileIcon(file.fileType)}</div>
							)}
						</div>

						<div className="grid-item-info">
							<div className="grid-item-name" title={file.fileName}>{file.fileName}</div>

							{file.messageContent && (
								<div className="grid-item-comment" title={file.messageContent}>
									{file.messageContent}
								</div>
							)}

							{activeTab === 'received' && (
								<div className="grid-item-user">Von: {file.senderName}</div>
							)}
							{activeTab === 'sent' && (
								<div className="grid-item-user">An: {file.recipientName}</div>
							)}

							<div className="grid-item-meta">
								<span>{formatSize(file.fileSize)}</span>
								<span>•</span>
								<span>{formatTime(file.createdAt)}</span>
							</div>
						</div>

						<div className="grid-item-actions">
							{activeTab === 'projects' ? (
								<>
									<button className="grid-action-btn" title="Öffnen" onClick={() => alert('Preview coming soon!')}>
										👁️
									</button>
									<button onClick={() => onDelete(file)} className="grid-action-btn grid-action-btn--delete" title="Löschen" disabled={deleting === file.id}>
										{deleting === file.id ? '⏳' : '🗑️'}
									</button>
								</>
							) : file.signedUrl ? (
								<>
									<a href={file.signedUrl} target="_blank" rel="noopener noreferrer" className="grid-action-btn" title="Öffnen">
										👁️
									</a>
									<a href={file.signedUrl} download={file.fileName} className="grid-action-btn" title="Download">
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
									<button onClick={() => onDelete(file)} className="grid-action-btn grid-action-btn--delete" title="Löschen" disabled={deleting === file.id}>
										{deleting === file.id ? '⏳' : '🗑️'}
									</button>
								</>
							) : (
								<span className="grid-action-btn" title="Lädt...">⏳</span>
							)}
						</div>
					</div>
				))
			)}
		</div>
	);
}
