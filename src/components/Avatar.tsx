import { colorForUsername, getInitials } from '../lib/utils';

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

export function Avatar({ username, avatarUrl, size = 'md', onClick, className = '' }: AvatarProps) {
  const cls = `${sizeMap[size]} rounded-full object-cover ${onClick ? 'cursor-pointer' : ''} ${className}`;
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username} className={cls} onClick={onClick} />;
  }
  return (
    <div
      onClick={onClick}
      className={`${sizeMap[size]} rounded-full bg-gradient-to-br ${colorForUsername(username)} flex items-center justify-center font-bold text-white shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {getInitials(username)}
    </div>
  );
}
