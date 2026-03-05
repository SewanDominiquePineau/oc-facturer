'use client';

import { useMemo } from 'react';
import styled from 'styled-components';
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
  onSiteClick: (resource: ResourceRow) => void;
}

/* ─── Styled action buttons ─── */

const ActionBtn = styled.button<{ $variant: 'add' | 'validate' | 'delete' }>`
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s, filter 0.15s;

  border: 1px solid ${p =>
    p.$variant === 'add' ? '#F59E0B' :
    p.$variant === 'validate' ? '#10B981' :
    '#EF4444'};

  background: ${p =>
    p.$variant === 'add' ? '#FFDC99' :
    p.$variant === 'validate' ? '#E6F8EB' :
    '#FFDDDD'};

  color: ${p =>
    p.$variant === 'add' ? '#92400E' :
    p.$variant === 'validate' ? '#065F46' :
    '#EF4444'};

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    filter: grayscale(0.5);
  }

  &:not(:disabled):hover {
    filter: brightness(0.95);
  }
`;

/* ─── Site indicator ─── */

const SiteCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid transparent;

  &:hover {
    border-color: #D9DEE1;
    background: #F9FAFB;
  }
`;

const SiteDot = styled.span<{ $ok: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${p => p.$ok ? '#10B981' : '#EF4444'};
`;

const SiteLines = styled.span`
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  font-size: 13px;
  span { color: #9CA3AF; font-size: 11px; }
`;

/* ─── Status badge ─── */

function statusBadge(status: string | null) {
  if (!status) return <Badge variant="neutral">-</Badge>;
  switch (status) {
    case 'ACTIVATED': return <Badge variant="success">ACTIVATED</Badge>;
    case 'INPROGRESS': return <Badge variant="warning">INPROGRESS</Badge>;
    default: return <Badge variant="neutral">{status}</Badge>;
  }
}

/* ─── Validation dots ─── */

const ValidationDots = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const RuleDot = styled.span<{ $status: 'ok' | 'warn' | 'error' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${p =>
    p.$status === 'ok' ? '#10B981' :
    p.$status === 'warn' ? '#F59E0B' :
    '#EF4444'};
`;

const RuleLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: #6B7280;
  margin-right: 1px;
`;

/* ─── 3 Règles de validation (Plan_Regles_Facturation_Sewan) ─── */

type RuleStatus = 'ok' | 'warn' | 'error';
interface RuleResult { status: RuleStatus; missing: string[]; warnings: string[] }

/** Règle 1 — Bon de commande : contractId, invoicedEntityName, invoicedEntityId */
function validateContrat(r: ResourceRow): RuleResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  if (!r.bdc_gdc_contractId) missing.push('Contrat (contractId)');
  if (!r.bdc_gdc_invoicedEntityId) missing.push('Entite facturee (ID)');
  if (!r.bdc_gdc_invoicedEntityName) warnings.push('Entite facturee (nom)');
  const status: RuleStatus = missing.length > 0 ? 'error' : warnings.length > 0 ? 'warn' : 'ok';
  return { status, missing, warnings };
}

/** Règle 2 — Site : id_site_sophia_go renseigné */
function validateSite(r: ResourceRow): RuleResult {
  const missing: string[] = [];
  if (!r.id_site_sophia_go) missing.push('Site Sophia Go');
  return { status: missing.length > 0 ? 'error' : 'ok', missing, warnings: [] };
}

/** Règle 3 — Produit : serviceId, categoryId, catalogRef, productName */
function validateProduit(r: ResourceRow): RuleResult {
  const missing: string[] = [];
  if (!r.gdc_serviceId) missing.push('Service (serviceId)');
  if (!r.gdc_categoryId) missing.push('Categorie (categoryId)');
  if (!r.gdc_catalogRef) missing.push('Ref. catalogue (catalogRef)');
  if (!r.gdc_productName && !r.gdc_productName_update) missing.push('Nom produit');
  return { status: missing.length > 0 ? 'error' : 'ok', missing, warnings: [] };
}

/** Combine les 3 règles — bloquant = error uniquement (warn ne bloque pas) */
function hasRequiredFields(r: ResourceRow): boolean {
  return validateContrat(r).status !== 'error'
    && validateSite(r).status !== 'error'
    && validateProduit(r).status !== 'error';
}

/** Tooltip détaillé pour les 3 règles */
function validationTooltip(r: ResourceRow): string {
  const r1 = validateContrat(r);
  const r2 = validateSite(r);
  const r3 = validateProduit(r);
  const fmt = (label: string, rule: RuleResult) => {
    if (rule.status === 'ok') return `${label}: OK`;
    const parts: string[] = [];
    if (rule.missing.length) parts.push(rule.missing.join(', '));
    if (rule.warnings.length) parts.push(`(warning: ${rule.warnings.join(', ')})`);
    return `${label}: ${parts.join(' ')}`;
  };
  return [fmt('Contrat', r1), fmt('Site', r2), fmt('Produit', r3)].join('\n');
}

/**
 * Ajouter GDC (INPROGRESS) :
 * - gdc_itemStatus IS NULL
 * - gdc_id_product IS NULL
 * - site/contrat/produit tous renseignés
 */
function canAddGdc(r: ResourceRow): boolean {
  return !r.gdc_itemStatus
    && !r.gdc_id_product
    && hasRequiredFields(r);
}

/**
 * Valider (ACTIVATED) :
 * - Cas 1 : pas encore d'article → créer + activer directement
 * - Cas 2 : article INPROGRESS existant → activer
 * + site/contrat/produit renseignés
 */
function canValidate(r: ResourceRow): boolean {
  const statusOk = (!r.gdc_itemStatus && !r.gdc_id_product)
    || (r.gdc_itemStatus === 'INPROGRESS' && !!r.gdc_id_product);
  return statusOk && hasRequiredFields(r);
}

/**
 * Supprimer article :
 * - gdc_id_product IS NOT NULL
 */
function canDelete(r: ResourceRow): boolean {
  return !!r.gdc_id_product;
}

/** Indique si le bouton "Valider" doit être visible (pas déjà ACTIVATED) */
function showValidate(r: ResourceRow): boolean {
  return r.gdc_itemStatus !== 'ACTIVATED';
}

/** Indique si le bouton "Ajouter GDC" doit être visible */
function showAddGdc(r: ResourceRow): boolean {
  return !r.gdc_id_product && r.gdc_itemStatus !== 'ACTIVATED';
}

export function FacturationTable({
  resources, isLoading, cancelledBdcIds,
  onAddGdc, onValidate, onDeleteArticle, onHide,
  onUpdateProductName, onUpdateCodeProduit, onSiteClick,
}: FacturationTableProps) {
  const columns = useMemo(() => [
    { key: 'numero_bdc', header: 'BDC', width: '165px' },
    { key: 'per_name', header: 'Client', width: '210px' },
    {
      key: 'code_produit',
      header: 'Code Produit',
      width: '210px',
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
    {
      key: 'nom_site',
      header: 'Site',
      width: '210px',
      render: (row: ResourceRow) => (
        <SiteCell
          onClick={e => { e.stopPropagation(); onSiteClick(row); }}
          title={row.id_site_sophia_go ? 'Site Sophia lie' : 'Cliquer pour associer un site'}
        >
          <SiteDot $ok={!!row.id_site_sophia_go} />
          <SiteLines>
            {row.nom_site || <span style={{ color: '#9CA3AF' }}>—</span>}
            {row.site_site_nom_sophia && <span>{row.site_site_nom_sophia}</span>}
          </SiteLines>
        </SiteCell>
      ),
    },
    {
      key: 'J2_date_CMES',
      header: 'Date CMES',
      width: '150px',
      render: (row: ResourceRow) =>
        row.J2_date_CMES ? new Date(row.J2_date_CMES).toLocaleDateString('fr-FR') : '-',
    },
    {
      key: 'validation',
      header: 'Validation',
      width: '150px',
      render: (row: ResourceRow) => {
        const r1 = validateContrat(row);
        const r2 = validateSite(row);
        const r3 = validateProduit(row);
        return (
          <ValidationDots title={validationTooltip(row)}>
            <RuleLabel>C</RuleLabel><RuleDot $status={r1.status} />
            <RuleLabel>S</RuleLabel><RuleDot $status={r2.status} />
            <RuleLabel>P</RuleLabel><RuleDot $status={r3.status} />
          </ValidationDots>
        );
      },
    },
    {
      key: 'gdc_itemStatus',
      header: 'Statut',
      width: '150px',
      render: (row: ResourceRow) => statusBadge(row.gdc_itemStatus),
    },
    {
      key: 'actions',
      header: '',
      width: '330px',
      render: (row: ResourceRow) => (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {showAddGdc(row) && (
            <ActionBtn
              $variant="add"
              disabled={!canAddGdc(row)}
              title={!canAddGdc(row) ? validationTooltip(row) : 'Ajouter dans la GDC (INPROGRESS)'}
              onClick={e => { e.stopPropagation(); onAddGdc(row); }}
            >
              GDC
            </ActionBtn>
          )}
          {showValidate(row) && (
            <ActionBtn
              $variant="validate"
              disabled={!canValidate(row)}
              title={!canValidate(row) ? validationTooltip(row) : 'Valider (ACTIVATED)'}
              onClick={e => { e.stopPropagation(); onValidate(row); }}
            >
              Valider
            </ActionBtn>
          )}
          {canDelete(row) && (
            <ActionBtn
              $variant="delete"
              onClick={e => { e.stopPropagation(); onDeleteArticle(row); }}
              title="Supprimer l'article de la GDC"
            >
              Suppr
            </ActionBtn>
          )}
          <input
            type="checkbox"
            checked={!!row.gdc_hidden}
            title="Masquer cette ressource"
            onChange={e => { e.stopPropagation(); onHide(row); }}
          />
        </div>
      ),
    },
  ], [onAddGdc, onValidate, onDeleteArticle, onHide, onUpdateProductName, onUpdateCodeProduit, onSiteClick]);

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
