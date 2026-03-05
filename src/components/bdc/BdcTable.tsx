'use client';

import { useMemo } from 'react';
import { BdcRow } from '@/types/bdc';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/shared/Badge';

interface BdcTableProps {
  data: BdcRow[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (bdc: BdcRow) => void;
  onToggleAjoutGdc: (bdc: BdcRow) => void;
}

export function BdcTable({ data, isLoading, selectedId, onSelect, onToggleAjoutGdc }: BdcTableProps) {
  const columns = useMemo(() => [
    { key: 'numero_bdc', header: 'N. Commande', width: '130px' },
    { key: 'per_name', header: 'Client' },
    { key: 'commercial_nom', header: 'Commercial', width: '120px' },
    {
      key: 'cree_le',
      header: 'Date',
      width: '100px',
      render: (row: BdcRow) => row.cree_le ? new Date(row.cree_le).toLocaleDateString('fr-FR') : '-',
    },
    {
      key: 'gdc_contractName',
      header: 'Contrat',
      render: (row: BdcRow) =>
        row.gdc_contractName
          ? <Badge variant="success">{row.gdc_contractName}</Badge>
          : <Badge variant="warning">Sans contrat</Badge>,
    },
    {
      key: 'ajout_gdc',
      header: 'GDC',
      width: '50px',
      render: (row: BdcRow) => (
        <input
          type="checkbox"
          checked={!!row.ajout_gdc}
          onChange={e => {
            e.stopPropagation();
            onToggleAjoutGdc(row);
          }}
        />
      ),
    },
  ], [onToggleAjoutGdc]);

  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey={row => row.id_bon_de_commande}
      onRowClick={onSelect}
      selectedKey={selectedId}
      isLoading={isLoading}
      emptyMessage="Aucun BDC trouve"
    />
  );
}
