'use client';

import { ResourceRow } from '@/types/resource';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/shared/Badge';

interface ResourcesTableProps {
  resources: ResourceRow[];
  isLoading: boolean;
  onAddArticle: (resource: ResourceRow) => void;
  onDeleteArticle: (resource: ResourceRow) => void;
}

function statusBadge(status: string | null) {
  if (!status) return <Badge variant="neutral">-</Badge>;
  switch (status) {
    case 'ACTIVATED': return <Badge variant="success">ACTIVATED</Badge>;
    case 'INPROGRESS': return <Badge variant="warning">INPROGRESS</Badge>;
    default: return <Badge variant="neutral">{status}</Badge>;
  }
}

export function ResourcesTable({ resources, isLoading, onAddArticle, onDeleteArticle }: ResourcesTableProps) {
  const columns = [
    { key: 'code_produit', header: 'Code Produit', width: '140px' },
    { key: 'nom', header: 'Produit' },
    { key: 'nom_site', header: 'Site', width: '120px' },
    { key: 'quantite', header: 'Qte', width: '50px' },
    {
      key: 'gdc_productName',
      header: 'Produit Sophia',
      render: (row: ResourceRow) => row.gdc_productName || <span style={{ color: '#9CA3AF' }}>-</span>,
    },
    {
      key: 'gdc_itemStatus',
      header: 'Statut GDC',
      width: '110px',
      render: (row: ResourceRow) => statusBadge(row.gdc_itemStatus),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (row: ResourceRow) => {
        const canAdd = !row.gdc_id_product && row.nom_site && row.gdc_catalogRef;
        const canDelete = !!row.gdc_id_product;

        return (
          <div style={{ display: 'flex', gap: 4 }}>
            {canAdd && (
              <button
                onClick={e => { e.stopPropagation(); onAddArticle(row); }}
                style={{
                  padding: '4px 8px', fontSize: 12, border: '1px solid #10B981',
                  borderRadius: 4, background: '#E6F8EB', color: '#10B981', cursor: 'pointer',
                }}
              >
                + GDC
              </button>
            )}
            {canDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDeleteArticle(row); }}
                style={{
                  padding: '4px 8px', fontSize: 12, border: '1px solid #EF4444',
                  borderRadius: 4, background: '#FFDDDD', color: '#EF4444', cursor: 'pointer',
                }}
              >
                Suppr.
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={resources}
      rowKey={row => row.id_dpl}
      isLoading={isLoading}
      emptyMessage="Aucune ressource"
    />
  );
}
