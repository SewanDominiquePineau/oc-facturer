export type BdcFilter = 'all' | 'sans_contrat' | 'plus_1mois' | 'enregistre';

export interface BdcRow {
  id_bon_de_commande: string;
  numero_bdc: string;
  per_name: string;
  dynamics_account_id: string | null;
  cree_le: string;
  commercial_nom: string | null;
  type_de_vente: string | null;
  ajout_gdc: number;
  gdc_contractId: string | null;
  gdc_contractName: string | null;
  gdc_invoicedEntityId: string | null;
  gdc_invoicedEntityName: string | null;
}
