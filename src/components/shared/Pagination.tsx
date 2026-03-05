'use client';

import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 13px;
  color: #6B7280;
`;

const Info = styled.span``;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid ${p => (p.$active ? '#3B82F6' : '#D1D5DB')};
  border-radius: 6px;
  background: ${p => (p.$active ? '#3B82F6' : '#fff')};
  color: ${p => (p.$active ? '#fff' : '#374151')};
  font-size: 13px;
  font-weight: ${p => (p.$active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: ${p => (p.$active ? '#2563EB' : '#F3F4F6')};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Ellipsis = styled.span`
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  font-size: 13px;
`;

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  if (total <= pageSize) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <Wrapper role="navigation" aria-label="Pagination">
      <Info>
        {from}–{to} sur {total}
      </Info>
      <Controls>
        <PageButton
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Page précédente"
        >
          ‹
        </PageButton>
        {pages.map((p, i) =>
          p === '...' ? (
            <Ellipsis key={`e${i}`}>…</Ellipsis>
          ) : (
            <PageButton
              key={p}
              $active={p === page}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </PageButton>
          )
        )}
        <PageButton
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Page suivante"
        >
          ›
        </PageButton>
      </Controls>
    </Wrapper>
  );
}
