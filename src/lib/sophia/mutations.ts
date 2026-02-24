export const ADD_ARTICLE = `
  mutation Mutation($article: ContractArticleInput!) {
    contract {
      addArticle(article: $article) {
        invoiceDate inServiceDate SAF amount id customName
        catalogRef billingOrderRef
        concernedSite { id }
        resourceLink resourceLinkName itemStatus qty resourceLocationId
      }
    }
  }
`;

export const ADD_ARTICLES = `
  mutation createArticles($contractId: UUID!, $articles: [ContractArticlesInput!]!) {
    contract {
      addArticles(contractId: $contractId, articles: $articles) { id }
    }
  }
`;

export const UPDATE_ARTICLE = `
  mutation UpdateArticle($id: ID!, $article: ContractArticleUpdateInput!) {
    contract {
      updateArticle(id: $id, article: $article) { id inServiceDate itemStatus }
    }
  }
`;

export const DELETE_ARTICLES = `
  mutation DeleteArticles($ids: [ID!]!) {
    contract {
      deleteArticles(ids: $ids)
    }
  }
`;
