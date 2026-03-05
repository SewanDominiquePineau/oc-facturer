'use client';

import styled from 'styled-components';

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 150%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const Thead = styled.thead`
  background: #F9FAFB;
`;

const Th = styled.th`
  padding: 10px 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #E5E7EB;
`;

const Tr = styled.tr<{ $selected?: boolean; $muted?: boolean }>`
  background: ${p => (p.$selected ? '#CCE0FF' : p.$muted ? '#F2F4F5' : '#fff')};
  cursor: ${p => (p.onClick ? 'pointer' : 'default')};
  transition: background 0.1s;

  &:hover {
    background: ${p => (p.$selected ? '#CCE0FF' : '#F9FAFB')};
  }
`;

const Td = styled.td`
  padding: 8px 12px;
  font-size: 14px;
  color: #191F22;
  border-bottom: 1px solid #E5E7EB;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
`;

const EmptyState = styled.div`
  padding: 48px;
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
`;

const pulse = `
  @keyframes skeleton-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
`;

const SkeletonWrap = styled.div`
  ${pulse}
  padding: 8px 0;
`;

const SkeletonRow = styled.div`
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #E5E7EB;
`;

const SkeletonCell = styled.div`
  flex: 1;
  height: 16px;
  background: #E5E7EB;
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
`;

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number | null;
  isRowMuted?: (row: T) => boolean;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  onRowClick,
  selectedKey,
  isRowMuted,
  emptyMessage = 'Aucune donnee',
  isLoading,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <TableWrapper>
        <SkeletonWrap role="status" aria-label="Chargement des données">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i}>
              {columns.map(col => (
                <SkeletonCell key={col.key} />
              ))}
            </SkeletonRow>
          ))}
        </SkeletonWrap>
      </TableWrapper>
    );
  }

  if (data.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <TableWrapper>
      <Table role="table">
        <Thead>
          <tr>
            {columns.map(col => (
              <Th key={col.key} scope="col" style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </Th>
            ))}
          </tr>
        </Thead>
        <tbody>
          {data.map(row => {
            const key = rowKey(row);
            return (
              <Tr
                key={key}
                $selected={selectedKey === key}
                $muted={isRowMuted?.(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map(col => (
                  <Td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </Td>
                ))}
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrapper>
  );
}
