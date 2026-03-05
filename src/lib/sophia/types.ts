export interface SophiaContract {
  id: string;
  name: string;
  contractNumber?: string;
  status: string;
  organization?: { id: string; name: string };
  client?: { id: string; name: string; internalReference?: string };
  lastUpdate?: string;
}

export interface SophiaProduct {
  serviceId: string;
  serviceName: string;
  productName: string;
  categoryId: string;
  subCategoryName: string;
  eventType: string | null;
  catalogRef: string;
  unit: string;
  price: number;
  SAF: number | null;
  connectedReferences: {
    productName: string;
    subCategoryName: string;
    eventType: string | null;
    catalogRef: string;
    unit: string;
    price: number;
  }[];
}

export interface SophiaSite {
  id: string;
  name: string;
}

export interface SophiaOrganization {
  id: string;
  name: string;
  type: string;
}

export interface SophiaArticle {
  id: string;
  invoiceDate?: string;
  inServiceDate?: string;
  SAF?: number;
  amount?: number;
  customName?: string;
  catalogRef?: string;
  billingOrderRef?: string;
  concernedSite?: { id: string };
  resourceLink?: string;
  resourceLinkName?: string;
  itemStatus?: string;
  qty?: number;
  resourceLocationId?: string;
}
