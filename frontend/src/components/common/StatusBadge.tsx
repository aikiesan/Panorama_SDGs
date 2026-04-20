import type { ProjectStatus } from '../../types';

interface StatusBadgeProps {
  status: ProjectStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  'Implemented':            'bg-green-50  text-green-700  border-green-200',
  'In Progress':            'bg-blue-50   text-blue-700   border-blue-200',
  'Needed but Constrained': 'bg-orange-50 text-orange-700 border-orange-200',
  'Planned':                'bg-gray-100  text-gray-700   border-gray-200',
};

const DEFAULT_STYLE = 'bg-gray-100 text-gray-600 border-gray-200';

export default function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const colors = STATUS_STYLES[status] ?? DEFAULT_STYLE;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs font-semibold'
      : 'px-3 py-1 text-xs font-medium';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border whitespace-nowrap',
        sizeClasses,
        colors,
        className,
      ].join(' ')}
    >
      {status}
    </span>
  );
}
