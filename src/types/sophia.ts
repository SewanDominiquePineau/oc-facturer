export interface SophiaContractRow {
  id: string;
  name: string;
  status: string;
  organization?: { id: string; name: string };
  lastUpdate?: string;
}

export interface SophiaProductRow {
  serviceId: string;
  serviceName: string;
  productName: string;
  categoryId: string;
  subCategoryName: string;
  catalogRef: string;
}

export interface SophiaOrganizationRow {
  id: string;
  name: string;
  type: string;
}

export interface SophiaSiteRow {
  id: string;
  name: string;
}
