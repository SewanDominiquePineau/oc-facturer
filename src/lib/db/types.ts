export interface BonDeCommande {
  id_bon_de_commande: string;
  numero_bdc: string;
  per_name: string;
  dynamics_account_id: string | null;
  statut_bdc: number;
  cree_le: string;
  modifie_le: string;
  date_annulation: string | null;
  bdc_a_annuler: string | null;
  ajout_gdc: number;
  gdc_contractId: string | null;
  gdc_contractName: string | null;
  gdc_invoicedEntityId: string | null;
  gdc_invoicedEntityName: string | null;
  commercial_nom: string | null;
  type_de_vente: string | null;
  duree_engagement: number | null;
}

export interface RessourceDpl {
  id_dpl: string;
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
  date_factu_anticipee: string | null;
}

export interface Client {
  id_client_dynamics: string;
  id_sophia_go: string | null;
  nom_dynamics: string | null;
  nom_sophia: string | null;
}
