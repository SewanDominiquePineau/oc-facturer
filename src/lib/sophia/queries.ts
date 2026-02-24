export const CONTRACTS_LIST = `
  query Contracts($organizationId: UUID!, $pagination: Pagination, $status: [ContractStatus!], $search: String, $sort: [ContractSortItem!]) {
    contract {
      list(
        organizationId: $organizationId
        pagination: $pagination
        status: $status
        search: $search
        sort: $sort
      ) {
        edges {
          id
          contractNumber
          lastUpdate
          status
          client { id name internalReference }
        }
        pageInfo { nextPage previousPage count nbPage page }
      }
    }
  }
`;

export const SEARCH_PRODUCTS = `
  query ProductsByString($organizationId: UUID!, $search: String) {
    contract {
      searchProducts(organizationId: $organizationId, search: $search) {
        serviceId serviceName productName categoryId subCategoryName
        eventType catalogRef unit price SAF
        connectedReferences { productName subCategoryName eventType catalogRef unit price }
      }
    }
  }
`;

export const GET_ORGANIZATIONS_CHILDREN = `
  query GetOrganizations($parentOrganizationId: ID!) {
    organization {
      getOrganizations(parentOrganizationId: $parentOrganizationId) {
        organizations { id name type }
      }
    }
  }
`;

export const GET_ORGANIZATION = `
  query GetOrganization($id: ID!) {
    organization {
      getOrganization(id: $id) { id name type }
    }
  }
`;

export const SEARCH_SITES = `
  query TableSites($organizationId: ID!, $filters: SiteFilters, $pagination: Pagination) {
    site {
      getSites(organizationId: $organizationId, pagination: $pagination, filters: $filters) {
        edges { id name }
        pageInfo { count nbPage page }
      }
    }
  }
`;

export const GET_SITE_FROM_LIVE = `
  query GetSiteFromLive($perId: String!) {
    site {
      getSiteFromLive(perId: $perId) { id name livePerId }
    }
  }
`;
