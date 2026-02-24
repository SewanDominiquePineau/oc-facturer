'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { BdcRow } from '@/types/bdc';
import { SophiaContractRow, SophiaOrganizationRow } from '@/types/sophia';
import { useContractSearch, useOrganizationChildren } from '@/hooks/useContractSearch';
import { SearchBar } from '@/components/shared/SearchBar';
import { Badge } from '@/components/shared/Badge';

const Panel = styled.div`
  width: 360px;
  background: #fff;
  border-left: 1px solid #D9DEE1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
`;

const Section = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
  text-transform: uppercase;
  margin-bottom: 6px;
`;

const Value = styled.div`
  font-size: 14px;
  color: #191F22;
`;

const ContractItem = styled.div<{ $selected?: boolean }>`
  padding: 8px 12px;
  border: 1px solid ${p => (p.$selected ? '#A0EBF0' : '#E5E7EB')};
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  background: ${p => (p.$selected ? '#F0FDFF' : '#fff')};
  &:hover { border-color: #A0EBF0; }
`;

const ContractName = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const ContractOrg = styled.div`
  font-size: 12px;
  color: #9CA3AF;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #D9DEE1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  &:focus { border-color: #A0EBF0; }
`;

const SaveButton = styled.button`
  padding: 8px 16px;
  background: #A0EBF0;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #191F22;
  cursor: pointer;
  width: 100%;
  margin-top: 12px;
  &:hover { background: #8DE5EB; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

interface ContractPanelProps {
  bdc: BdcRow | null;
  onSave: (contractId: string, contractName: string, entityId: string, entityName: string) => void;
}

export function ContractPanel({ bdc, onSave }: ContractPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedContract, setSelectedContract] = useState<SophiaContractRow | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const { contracts, isLoading: searchLoading } = useContractSearch(search);
  const { children: entities } = useOrganizationChildren(
    selectedContract?.organization?.id || null
  );

  if (!bdc) {
    return (
      <Panel>
        <Value style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 40 }}>
          Selectionnez un BDC
        </Value>
      </Panel>
    );
  }

  const handleSave = () => {
    if (!selectedContract) return;
    const entity = entities.find((e: SophiaOrganizationRow) => e.id === selectedEntityId);
    onSave(
      selectedContract.id,
      selectedContract.name,
      selectedEntityId || selectedContract.organization?.id || '',
      entity?.name || selectedContract.organization?.name || ''
    );
  };

  return (
    <Panel>
      <Section>
        <Label>BDC selectionne</Label>
        <Value>{bdc.numero_bdc} - {bdc.per_name}</Value>
      </Section>

      {bdc.gdc_contractName && (
        <Section>
          <Label>Contrat actuel</Label>
          <Badge variant="success">{bdc.gdc_contractName}</Badge>
          {bdc.gdc_invoicedEntityName && (
            <Value style={{ fontSize: 12, marginTop: 4 }}>Entite: {bdc.gdc_invoicedEntityName}</Value>
          )}
        </Section>
      )}

      <Section>
        <Label>Rechercher un contrat</Label>
        <SearchBar value={search} onChange={setSearch} placeholder="Numero de contrat..." />
      </Section>

      {search.length >= 2 && (
        <Section>
          {searchLoading ? (
            <Value style={{ color: '#9CA3AF' }}>Recherche...</Value>
          ) : contracts.length === 0 ? (
            <Value style={{ color: '#9CA3AF' }}>Aucun contrat trouve</Value>
          ) : (
            contracts.map(c => (
              <ContractItem
                key={c.id}
                $selected={selectedContract?.id === c.id}
                onClick={() => { setSelectedContract(c); setSelectedEntityId(''); }}
              >
                <ContractName>{c.name}</ContractName>
                <ContractOrg>{c.organization?.name || '-'}</ContractOrg>
              </ContractItem>
            ))
          )}
        </Section>
      )}

      {selectedContract && entities.length > 1 && (
        <Section>
          <Label>Entite de facturation</Label>
          <Select value={selectedEntityId} onChange={e => setSelectedEntityId(e.target.value)}>
            <option value="">-- Choisir --</option>
            {entities.map((e: SophiaOrganizationRow) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
        </Section>
      )}

      <SaveButton onClick={handleSave} disabled={!selectedContract}>
        Enregistrer le contrat
      </SaveButton>
    </Panel>
  );
}
