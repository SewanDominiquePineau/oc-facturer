'use client';

import { ResourceRow } from '@/types/resource';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/shared/Badge';
import { InlineEdit } from '@/components/shared/InlineEdit';

interface FacturationTableProps {
  resources: ResourceRow[];
  isLoading: boolean;
  cancelledBdcIds: Set<string>;
  onAddGdc: (resource: ResourceRow) => void;
  onValidate: (resource: ResourceRow) => void;
  onDeleteArticle: (resource: ResourceRow) => void;
  onHide: (resource: ResourceRow) => void;
  onUpdateProductName: (resource: ResourceRow, newName: string) => void;
  onUpdateCodeProduit: (resource: ResourceRow, newCode: string) => void;
}

function statusBadge(status: string | null) {
  if (!status) return <Badge variant="neutral">-</Badge>;
  switch (status) {
    case 'ACTIVATED': return <Badge variant="success">ACTIVATED</Badge>;
    case 'INPROGRESS': return <Badge variant="warning">INPROGRESS</Badge>;
    default: return <Badge variant="neutral">{status}</Badge>;
  }
}

function canAddGdc(r: ResourceRow): boolean {
  return !r.gdc_itemStatus
    && !!r.nom_site
    && !!r.bdc_gdc_contractId
    && !!r.gdc_serviceId
    && !!r.id_site_sophia_go
    && !!r.bdc_gdc_invoicedEntityId
    && !!r.gdc_catalogRef
    && !!r.gdc_categoryId
    && !r.gdc_id_product;
}

function canValidate(r: ResourceRow): boolean {
  return ((!r.gdc_itemStatus && !r.gdc_id_product) || (r.gdc_itemStatus === 'INPROGRESS' && !!r.gdc_id_product))
    && !!r.nom_site
    && !!r.bdc_gdc_contractId
    && !!r.gdc_serviceId
    && !!r.id_site_sophia_go
    && !!r.gdc_catalogRef;
}

function canDelete(r: ResourceRow): boolean {
  return !!r.gdc_id_product;
}

export function FacturationTable({
  resources, isLoading, cancelledBdcIds,
  onAddGdc, onValidate, onDeleteArticle, onHide,
  onUpdateProductName, onUpdateCodeProduit,
}: FacturationTableProps) {
  const columns = [
    { key: 'numero_bdc', header: 'BDC', width: '110px' },
    { key: 'per_name', header: 'Client', width: '140px' },
    {
      key: 'code_produit',
      header: 'Code Produit',
      width: '140px',
      render: (row: ResourceRow) => (
        <InlineEdit
          value={row.code_produit || ''}
          onSave={v => onUpdateCodeProduit(row, v)}
          placeholder="Code..."
        />
      ),
    },
    {
      key: 'gdc_productName',
      header: 'Nom Produit',
      render: (row: ResourceRow) => (
        <InlineEdit
          value={row.gdc_productName_update || row.gdc_productName || ''}
          onSave={v => onUpdateProductName(row, v)}
          placeholder="Nom produit..."
        />
      ),
    },
    { key: 'nom_site', header: 'Site', width: '110px' },
    {
      key: 'J2_date_CMES',
      header: 'Date CMES',
      width: '100px',
      render: (row: ResourceRow) =>
        row.J2_date_CMES ? new Date(row.J2_date_CMES).toLocaleDateString('fr-FR') : '-',
    },
    {
      key: 'gdc_itemStatus',
      header: 'Statut',
      width: '100px',
      render: (row: ResourceRow) => statusBadge(row.gdc_itemStatus),
    },
    {
      key: 'actions',
      header: '',
      width: '180px',
      render: (row: ResourceRow) => (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {canAddGdc(row) && (
            <button onClick={e => { e.stopPropagation(); onAddGdc(row); }}
              style={{ padding: '3px 6px', fontSize: 11, border: '1px solid #F59E0B', borderRadius: 4, background: '#FFDC99', color: '#92400E', cursor: 'pointer' }}>
              GDC
            </button>
          )}
          {canValidate(row) && (
            <button onClick={e => { e.stopPropagation(); onValidate(row); }}
              style={{ padding: '3px 6px', fontSize: 11, border: '1px solid #10B981', borderRadius: 4, background: '#E6F8EB', color: '#10B981', cursor: 'pointer' }}>
              Valider
            </button>
          )}
          {canDelete(row) && (
            <button onClick={e => { e.stopPropagation(); onDeleteArticle(row); }}
              style={{ padding: '3px 6px', fontSize: 11, border: '1px solid #EF4444', borderRadius: 4, background: '#FFDDDD', color: '#EF4444', cursor: 'pointer' }}>
              Suppr
            </button>
          )}
          <input
            type="checkbox"
            checked={!!row.gdc_hidden}
            title="Masquer"
            onChange={e => { e.stopPropagation(); onHide(row); }}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={resources}
      rowKey={row => row.id_dpl}
      isLoading={isLoading}
      isRowMuted={row => cancelledBdcIds.has(row.id_commande)}
      emptyMessage="Aucune ressource"
    />
  );
}
