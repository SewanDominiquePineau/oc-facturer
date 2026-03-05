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
  query ProductsByString($organizationId: UUID!, $search: String!) {
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

export const CHECK_SITE_IN_CONTRACT = `
  query CheckSiteInContract($contractId: UUID!, $siteId: ID!) {
    contract { get(id: $contractId) { client { id name } } }
    organization { getHierarchy(entityId: $siteId) { id name type } }
    site { getSite(id: $siteId) { id livePerId } }
  }
`;

export const SEARCH_SITES_DETAILED = `
  query SearchSitesDetailed($organizationId: ID!, $internalRecursive: Boolean = true, $filters: SiteFilters, $pagination: Pagination) {
    site {
      getSites(organizationId: $organizationId, internalRecursive: $internalRecursive, filters: $filters, pagination: $pagination) {
        edges { id name address { street zipCode city country complement } }
        pageInfo { count nbPage page }
      }
    }
  }
`;

export const GET_ARTICLE = `
  query GetArticle($id: UUID!) {
    contract {
      getArticle(id: $id) {
        id catalogRef customName billingOrderRef
        invoiceDate inServiceDate terminationDate
        amount SAF qty itemStatus
        resourceLink resourceLinkName
        productName serviceName subCategoryName eventType
      }
    }
  }
`;

export const LIST_ARTICLES = `
  query ListArticles($contractId: UUID!, $concernedSiteId: [UUID!], $pagination: Pagination) {
    contract {
      listArticles(contractId: $contractId, concernedSiteId: $concernedSiteId, pagination: $pagination) {
        edges {
          id catalogRef customName billingOrderRef
          invoiceDate inServiceDate terminationDate
          amount SAF qty itemStatus
          resourceLink resourceLinkName
          productName serviceName
        }
        pageInfo { count nbPage page }
      }
    }
  }
`;

export const GET_SITE_DETAIL = `
  query GetSiteDetail($id: ID!) {
    site {
      getSite(id: $id) {
        id name livePerId
        address { street zipCode city country complement }
        organization { id name type livePerId parentOrganizationId }
      }
    }
  }
`;
