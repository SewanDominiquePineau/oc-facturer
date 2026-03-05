export const ADD_ARTICLE = `
  mutation Mutation($article: ContractArticleInput!) {
    contract {
      addArticle(article: $article) {
        id catalogRef customName billingOrderRef
        invoiceDate inServiceDate
        amount SAF qty
        itemStatus resourceLink resourceLinkName resourceLocationId
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
  mutation UpdateArticle($id: UUID!, $article: ContractArticleUpdate!) {
    contract {
      updateArticle(id: $id, article: $article) { id inServiceDate terminationDate itemStatus }
    }
  }
`;

export const DELETE_ARTICLES = `
  mutation DeleteArticles($ids: [UUID!]!) {
    contract {
      deleteArticles(ids: $ids)
    }
  }
`;
