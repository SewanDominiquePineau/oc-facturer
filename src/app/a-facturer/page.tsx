'use client';

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { FacturationTab, FacturationFilter, ResourceRow } from '@/types/resource';
import { useFacturation, useCancelledBdcIds } from '@/hooks/useFacturation';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchBar } from '@/components/shared/SearchBar';
import { FilterDropdown } from '@/components/shared/FilterDropdown';
import { Pagination } from '@/components/shared/Pagination';
import { TabBar } from '@/components/shared/TabBar';
import { FacturationTable } from '@/components/facturation/FacturationTable';
import { SiteSearchModal } from '@/components/facturation/SiteSearchModal';

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

const ErrorBanner = styled.div`
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #DC2626;
  padding: 10px 16px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #DC2626;
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
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
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const [siteModalResource, setSiteModalResource] = useState<ResourceRow | null>(null);

  const { resources, count, isLoading, isError: fetchError, mutate } = useFacturation(tab, filter, debouncedSearch, page, 50);
  const cancelledBdcIds = useCancelledBdcIds();

  const [error, setError] = useState<string | null>(null);

  const patchResource = useCallback(async (id: string, fields: Record<string, unknown>) => {
    const res = await fetch(`/api/resources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error(`Erreur PATCH resource: ${res.status}`);
  }, []);

  const handleAddGdc = useCallback(async (resource: ResourceRow) => {
    try {
      setError(null);
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
      if (!res.ok) throw new Error(`Erreur ajout GDC: ${res.status}`);
      const data = await res.json();
      if (data.success && data.data?.id) {
        await patchResource(resource.id_dpl, {
          gdc_id_product: data.data.id,
          gdc_itemStatus: data.data.itemStatus || 'INPROGRESS',
        });
        mutate();
      }
    } catch (err) {
      console.error('handleAddGdc error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout GDC');
    }
  }, [patchResource, mutate]);

  const handleValidate = useCallback(async (resource: ResourceRow) => {
    try {
      setError(null);
      if (resource.gdc_id_product) {
        const res = await fetch(`/api/sophia/articles/${resource.gdc_id_product}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article: { itemStatus: 'ACTIVATED', inServiceDate: new Date().toISOString() } }),
        });
        if (!res.ok) throw new Error(`Erreur validation: ${res.status}`);
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
        if (!res.ok) throw new Error(`Erreur validation: ${res.status}`);
        const data = await res.json();
        if (data.success && data.data?.id) {
          await patchResource(resource.id_dpl, {
            gdc_id_product: data.data.id,
            gdc_itemStatus: 'ACTIVATED',
          });
        }
      }
      mutate();
    } catch (err) {
      console.error('handleValidate error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
    }
  }, [patchResource, mutate]);

  const handleDeleteArticle = useCallback(async (resource: ResourceRow) => {
    try {
      setError(null);
      if (!resource.gdc_id_product) return;
      const res = await fetch('/api/sophia/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [resource.gdc_id_product] }),
      });
      if (!res.ok) throw new Error(`Erreur suppression article: ${res.status}`);
      await patchResource(resource.id_dpl, { gdc_id_product: null, gdc_itemStatus: null });
      mutate();
    } catch (err) {
      console.error('handleDeleteArticle error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  }, [patchResource, mutate]);

  const handleHide = useCallback(async (resource: ResourceRow) => {
    try {
      setError(null);
      const res = await fetch(`/api/resources/${resource.id_dpl}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: !resource.gdc_hidden }),
      });
      if (!res.ok) throw new Error(`Erreur masquage: ${res.status}`);
      mutate();
    } catch (err) {
      console.error('handleHide error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du masquage');
    }
  }, [mutate]);

  const handleUpdateProductName = useCallback(async (resource: ResourceRow, newName: string) => {
    try {
      setError(null);
      await patchResource(resource.id_dpl, { gdc_productName_update: newName });
      mutate();
    } catch (err) {
      console.error('handleUpdateProductName error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise a jour du nom');
    }
  }, [patchResource, mutate]);

  const handleUpdateCodeProduit = useCallback(async (resource: ResourceRow, newCode: string) => {
    try {
      setError(null);
      await patchResource(resource.id_dpl, { code_produit: newCode });
      if (newCode.length >= 2) {
        const res = await fetch(`/api/sophia/products/search/${encodeURIComponent(newCode)}`);
        if (!res.ok) throw new Error(`Erreur recherche produit: ${res.status}`);
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
    } catch (err) {
      console.error('handleUpdateCodeProduit error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise a jour du code');
    }
  }, [patchResource, mutate]);

  const handleSiteClick = useCallback((resource: ResourceRow) => {
    if (!resource.client_id_sophia_go) {
      setError('Ce client n\'a pas d\'organisation Sophia associee. Verifiez la fiche client.');
      return;
    }
    setSiteModalResource(resource);
  }, []);

  const handleSiteSelect = useCallback(async (siteId: string) => {
    try {
      setError(null);
      if (!siteModalResource) return;

      const contractId = siteModalResource.bdc_gdc_contractId;
      if (!contractId) {
        setError('Aucun contrat GDC associe a ce BDC.');
        setSiteModalResource(null);
        return;
      }

      const res = await fetch('/api/sophia/sites/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          resourceId: siteModalResource.id_dpl,
          contractId,
        }),
      });
      if (!res.ok) throw new Error(`Erreur selection site: ${res.status}`);

      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Erreur lors de la selection du site');
      }

      setSiteModalResource(null);
      mutate();
    } catch (err) {
      console.error('handleSiteSelect error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la selection du site');
      setSiteModalResource(null);
    }
  }, [siteModalResource, mutate]);

  const displayError = error || (fetchError ? 'Erreur lors du chargement des donnees' : null);

  return (
    <div>
      <TabBar value={tab} onChange={v => { setTab(v as FacturationTab); setPage(1); }} tabs={tabs} />

      {displayError && (
        <ErrorBanner>
          <span>{displayError}</span>
          <CloseBtn onClick={() => setError(null)}>&times;</CloseBtn>
        </ErrorBanner>
      )}

      <Toolbar>
        <FilterDropdown value={filter} onChange={v => { setFilter(v); setPage(1); }} options={filterOptions} />
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Rechercher..." />
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
        onSiteClick={handleSiteClick}
      />
      <Pagination page={page} pageSize={50} total={count} onPageChange={setPage} />

      {siteModalResource && siteModalResource.client_id_sophia_go && (
        <SiteSearchModal
          organizationId={siteModalResource.client_id_sophia_go}
          onSelect={handleSiteSelect}
          onClose={() => setSiteModalResource(null)}
        />
      )}
    </div>
  );
}
