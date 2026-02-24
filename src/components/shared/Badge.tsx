'use client';

import styled from 'styled-components';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#E6F8EB', text: '#10B981' },
  warning: { bg: '#FFDC99', text: '#92400E' },
  error: { bg: '#FFDDDD', text: '#EF4444' },
  info: { bg: '#CCE0FF', text: '#3B82F6' },
  neutral: { bg: '#F2F4F5', text: '#333F44' },
};

const StyledBadge = styled.span<{ $variant: BadgeVariant }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background: ${p => variantColors[p.$variant].bg};
  color: ${p => variantColors[p.$variant].text};
  white-space: nowrap;
`;

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return <StyledBadge $variant={variant}>{children}</StyledBadge>;
}
