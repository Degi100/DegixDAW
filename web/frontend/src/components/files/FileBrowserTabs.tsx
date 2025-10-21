import type { FileBrowserTab } from '../../hooks/useAllAttachments';

interface TabConfig {
	key: FileBrowserTab;
	label: string;
	icon: string;
	count: number;
}

interface FileBrowserTabsProps {
	activeTab: FileBrowserTab;
	allFilesCount: number;
	receivedFilesCount: number;
	sentFilesCount: number;
	myFilesCount: number;
	onTabChangeWithReset: (tab: FileBrowserTab) => void;
}

export default function FileBrowserTabs({
	activeTab,
	allFilesCount,
	receivedFilesCount,
	sentFilesCount,
	myFilesCount,
	onTabChangeWithReset,
}: FileBrowserTabsProps) {
	const tabs: TabConfig[] = [
		{ key: 'all', label: 'Alle', icon: '', count: allFilesCount },
		{ key: 'received', label: 'Empfangen', icon: '📥', count: receivedFilesCount },
		{ key: 'sent', label: 'Gesendet', icon: '📤', count: sentFilesCount },
		{ key: 'my_files', label: 'Meine', icon: '📁', count: myFilesCount },
	];

	return (
		<div className="file-browser-tabs">
			{tabs.map(tab => (
				<button
					key={tab.key}
					className={`file-tab ${activeTab === tab.key ? 'active' : ''}`}
					onClick={() => onTabChangeWithReset(tab.key)}
				>
					{tab.icon && `${tab.icon} `}{tab.label}
					<span className="file-tab-count">{tab.count}</span>
				</button>
			))}
		</div>
	);
}
