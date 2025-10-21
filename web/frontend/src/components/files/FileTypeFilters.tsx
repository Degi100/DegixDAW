import type { FileTypeFilter } from '../../hooks/useAllAttachments';

interface FilterConfig {
	key: FileTypeFilter;
	icon: string;
}

interface FileTypeFiltersProps {
	activeFilter: FileTypeFilter;
	onFilterChange: (filter: FileTypeFilter) => void;
}

export default function FileTypeFilters({ activeFilter, onFilterChange }: FileTypeFiltersProps) {
	const filters: FilterConfig[] = [
		{ key: 'images', icon: '🖼️' },
		{ key: 'videos', icon: '🎥' },
		{ key: 'audio', icon: '🎵' },
		{ key: 'documents', icon: '📄' },
	];

	return (
		<div className="filter-buttons">
			{filters.map(filter => (
				<button
					key={filter.key}
					className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
					onClick={() => onFilterChange(filter.key)}
				>
					{filter.icon}
				</button>
			))}
		</div>
	);
}
