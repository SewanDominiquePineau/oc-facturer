'use client';

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { BdcFilter, BdcRow } from '@/types/bdc';
import { ResourceRow } from '@/types/resource';
import { useBdcList, useBdcResources } from '@/hooks/useBdcList';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchBar } from '@/components/shared/SearchBar';
import { FilterDropdown } from '@/components/shared/FilterDropdown';
import { BdcTable } from '@/components/bdc/BdcTable';
import { ContractPanel } from '@/components/bdc/ContractPanel';
import { ResourcesTable } from '@/components/bdc/ResourcesTable';

const PageWrapper = styled.div`
  display: flex;
  height: 100%;
  gap: 0;
`;

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
`;

const Count = styled.span`
  font-size: 13px;
  color: #9CA3AF;
  margin-left: auto;
`;

const SplitPane = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #191F22;
  margin: 8px 0;
`;

const filterOptions = [
  { value: 'all' as const, label: 'Tous' },
  { value: 'sans_contrat' as const, label: 'Sans Contrat' },
  { value: 'plus_1mois' as const, label: '+ 1 mois' },
  { value: 'enregistre' as const, label: 'Enregistre' },
];

export default function ValidationBdcPage() {
  const [filter, setFilter] = useState<BdcFilter>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedBdc, setSelectedBdc] = useState<BdcRow | null>(null);

  const { bdcList, count, isLoading, mutate } = useBdcList(filter, debouncedSearch);
  const { resources, isLoading: resourcesLoading, mutate: mutateResources } = useBdcResources(
    selectedBdc?.id_bon_de_commande ?? null
  );

  const handleToggleAjoutGdc = useCallback(async (bdc: BdcRow) => {
    await fetch(`/api/bdc/${bdc.id_bon_de_commande}/ajout-gdc`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ajout_gdc: !bdc.ajout_gdc }),
    });
    mutate();
  }, [mutate]);

  const handleSaveContract = useCallback(async (
    contractId: string, contractName: string, entityId: string, entityName: string
  ) => {
    if (!selectedBdc) return;
    await fetch(`/api/bdc/${selectedBdc.id_bon_de_commande}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gdc_contractId: contractId,
        gdc_contractName: contractName,
        gdc_invoicedEntityId: entityId,
        gdc_invoicedEntityName: entityName,
      }),
    });
    mutate();
  }, [selectedBdc, mutate]);

  const handleAddArticle = useCallback(async (resource: ResourceRow) => {
    if (!selectedBdc) return;
    const article = {
      contractId: selectedBdc.gdc_contractId,
      invoicedOrganizationId: selectedBdc.gdc_invoicedEntityId,
      serviceId: resource.gdc_serviceId,
      categoryId: resource.gdc_categoryId,
      catalogRef: resource.gdc_catalogRef,
      concernedSiteId: resource.id_site_sophia_go,
      customName: resource.gdc_productName_update || resource.gdc_productName || resource.nom,
      qty: resource.quantite || 1,
    };

    const res = await fetch('/api/sophia/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article }),
    });
    const data = await res.json();
    if (data.success && data.data?.id) {
      await fetch(`/api/resources/${resource.id_dpl}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gdc_id_product: data.data.id, gdc_itemStatus: data.data.itemStatus || 'INPROGRESS' }),
      });
      mutateResources();
    }
  }, [selectedBdc, mutateResources]);

  const handleDeleteArticle = useCallback(async (resource: ResourceRow) => {
    if (!resource.gdc_id_product) return;
    await fetch('/api/sophia/articles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [resource.gdc_id_product] }),
    });
    await fetch(`/api/resources/${resource.id_dpl}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gdc_id_product: null, gdc_itemStatus: null }),
    });
    mutateResources();
  }, [mutateResources]);

  return (
    <PageWrapper>
      <MainArea>
        <Toolbar>
          <FilterDropdown value={filter} onChange={setFilter} options={filterOptions} />
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher BDC..." />
          <Count>{count} BDC</Count>
        </Toolbar>

        <SplitPane>
          <BdcTable
            data={bdcList}
            isLoading={isLoading}
            selectedId={selectedBdc?.id_bon_de_commande ?? null}
            onSelect={setSelectedBdc}
            onToggleAjoutGdc={handleToggleAjoutGdc}
          />

          {selectedBdc && (
            <>
              <SectionTitle>Ressources - {selectedBdc.numero_bdc}</SectionTitle>
              <ResourcesTable
                resources={resources}
                isLoading={resourcesLoading}
                onAddArticle={handleAddArticle}
                onDeleteArticle={handleDeleteArticle}
              />
            </>
          )}
        </SplitPane>
      </MainArea>

      <ContractPanel bdc={selectedBdc} onSave={handleSaveContract} />
    </PageWrapper>
  );
}
