'use client';

import React from 'react';

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  photoUrl,
  color = '#2563EB',
  size = 'md',
  isOnline,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative inline-block select-none">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover shadow-sm ring-1 ring-black/5 dark:ring-white/10`}
        />
      ) : (
        <div
          style={{ backgroundColor: color }}
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold shadow-sm tracking-wide`}
        >
          {getInitials(name)}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-slate-900 ${
            size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'
          } ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
        />
      )}
    </div>
  );
};
