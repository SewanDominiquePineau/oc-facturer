export interface ResourceRow {
  id_dpl: string;
  id_oc: string | null;
  id_commande: string;
  code_produit: string | null;
  nom: string | null;
  quantite: number;
  nom_site: string | null;
  id_site_sophia_go: string | null;
  site: string | null;
  gdc_contractId: string | null;
  gdc_serviceId: string | null;
  gdc_categoryId: string | null;
  gdc_catalogRef: string | null;
  gdc_productName: string | null;
  gdc_productName_update: string | null;
  gdc_id_product: string | null;
  gdc_itemStatus: string | null;
  gdc_hidden: number;
  J2_date_CMES: string | null;
  J0_id_operateur: string | null;
  date_factu_anticipee: string | null;
  // Joined fields from facturation query
  numero_bdc?: string;
  per_name?: string;
  bdc_gdc_contractId?: string;
  bdc_gdc_contractName?: string;
  bdc_gdc_invoicedEntityId?: string;
  bdc_gdc_invoicedEntityName?: string | null;
  bdc_date_annulation?: string | null;
  // Joined from site + client tables
  site_site_nom_sophia?: string | null;
  site_sophia_go?: string | null;
  client_id_sophia_go?: string | null;
  client_nom_sophia?: string | null;
}

export type FacturationTab = 'cmes' | 'fac_anticipees';
export type FacturationFilter = 'tous' | 'a_facturer' | 'masquees' | 'dans_gdc';
