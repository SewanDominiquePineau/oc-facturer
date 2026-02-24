'use client';

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { FacturationTab, FacturationFilter, ResourceRow } from '@/types/resource';
import { useFacturation, useCancelledBdcIds } from '@/hooks/useFacturation';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchBar } from '@/components/shared/SearchBar';
import { FilterDropdown } from '@/components/shared/FilterDropdown';
import { TabBar } from '@/components/shared/TabBar';
import { FacturationTable } from '@/components/facturation/FacturationTable';

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

const tabs = [
  { value: 'cmes' as const, label: 'CMES' },
  { value: 'fac_anticipees' as const, label: 'Fac. Anticipees' },
  { value: 'resilier' as const, label: 'Resilier', disabled: true },
  { value: 'reconduire' as const, label: 'Reconduire', disabled: true },
  { value: 'annuler' as const, label: 'Annuler', disabled: true },
];

const filterOptions = [
  { value: 'tous' as const, label: 'Tous' },
  { value: 'a_facturer' as const, label: 'A Facturer' },
  { value: 'masquees' as const, label: 'Masquees' },
  { value: 'dans_gdc' as const, label: 'Dans la GDC' },
];

export default function AFacturerPage() {
  const [tab, setTab] = useState<FacturationTab>('cmes');
  const [filter, setFilter] = useState<FacturationFilter>('tous');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { resources, count, isLoading, mutate } = useFacturation(tab, filter, debouncedSearch);
  const cancelledBdcIds = useCancelledBdcIds();

  const patchResource = useCallback(async (id: string, fields: Record<string, any>) => {
    await fetch(`/api/resources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
  }, []);

  const handleAddGdc = useCallback(async (resource: ResourceRow) => {
    const article = {
      contractId: resource.bdc_gdc_contractId,
      invoicedOrganizationId: resource.bdc_gdc_invoicedEntityId,
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
      await patchResource(resource.id_dpl, {
        gdc_id_product: data.data.id,
        gdc_itemStatus: data.data.itemStatus || 'INPROGRESS',
      });
      mutate();
    }
  }, [patchResource, mutate]);

  const handleValidate = useCallback(async (resource: ResourceRow) => {
    if (resource.gdc_id_product) {
      await fetch(`/api/sophia/articles/${resource.gdc_id_product}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article: { itemStatus: 'ACTIVATED', inServiceDate: new Date().toISOString() } }),
      });
      await patchResource(resource.id_dpl, { gdc_itemStatus: 'ACTIVATED' });
    } else {
      const article = {
        contractId: resource.bdc_gdc_contractId,
        invoicedOrganizationId: resource.bdc_gdc_invoicedEntityId,
        serviceId: resource.gdc_serviceId,
        categoryId: resource.gdc_categoryId,
        catalogRef: resource.gdc_catalogRef,
        concernedSiteId: resource.id_site_sophia_go,
        customName: resource.gdc_productName_update || resource.gdc_productName || resource.nom,
        qty: resource.quantite || 1,
        itemStatus: 'ACTIVATED',
        inServiceDate: new Date().toISOString(),
      };

      const res = await fetch('/api/sophia/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      });
      const data = await res.json();
      if (data.success && data.data?.id) {
        await patchResource(resource.id_dpl, {
          gdc_id_product: data.data.id,
          gdc_itemStatus: 'ACTIVATED',
        });
      }
    }
    mutate();
  }, [patchResource, mutate]);

  const handleDeleteArticle = useCallback(async (resource: ResourceRow) => {
    if (!resource.gdc_id_product) return;
    await fetch('/api/sophia/articles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [resource.gdc_id_product] }),
    });
    await patchResource(resource.id_dpl, { gdc_id_product: null, gdc_itemStatus: null });
    mutate();
  }, [patchResource, mutate]);

  const handleHide = useCallback(async (resource: ResourceRow) => {
    await fetch(`/api/resources/${resource.id_dpl}/hide`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden: !resource.gdc_hidden }),
    });
    mutate();
  }, [mutate]);

  const handleUpdateProductName = useCallback(async (resource: ResourceRow, newName: string) => {
    await patchResource(resource.id_dpl, { gdc_productName_update: newName });
    mutate();
  }, [patchResource, mutate]);

  const handleUpdateCodeProduit = useCallback(async (resource: ResourceRow, newCode: string) => {
    await patchResource(resource.id_dpl, { code_produit: newCode });
    if (newCode.length >= 2) {
      const res = await fetch(`/api/sophia/products/search/${encodeURIComponent(newCode)}`);
      const data = await res.json();
      if (data.success && data.data?.length === 1) {
        const product = data.data[0];
        await patchResource(resource.id_dpl, {
          gdc_catalogRef: product.catalogRef,
          gdc_categoryId: product.categoryId,
          gdc_serviceId: product.serviceId,
          gdc_productName: product.productName,
        });
      }
    }
    mutate();
  }, [patchResource, mutate]);

  return (
    <div>
      <TabBar value={tab} onChange={v => setTab(v as FacturationTab)} tabs={tabs} />

      <Toolbar>
        <FilterDropdown value={filter} onChange={setFilter} options={filterOptions} />
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher..." />
        <Count>{count} ressources</Count>
      </Toolbar>

      <FacturationTable
        resources={resources}
        isLoading={isLoading}
        cancelledBdcIds={cancelledBdcIds}
        onAddGdc={handleAddGdc}
        onValidate={handleValidate}
        onDeleteArticle={handleDeleteArticle}
        onHide={handleHide}
        onUpdateProductName={handleUpdateProductName}
        onUpdateCodeProduit={handleUpdateCodeProduit}
      />
    </div>
  );
}
