
const GRAPHQL_URL =
  process.env.WORDPRESS_GRAPHQL_URL ||
  (process.env.WOOCOMMERCE_URL ? `${process.env.WOOCOMMERCE_URL}/graphql` : 'https://purostill.com/graphql');

/**
 * Fetch data from WordPress GraphQL
 */
export async function fetchGraphQL(query: string, variables: any = {}) {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    const json = await res.json();

    if (json.errors) {
      console.error(`[GraphQL] Error at ${GRAPHQL_URL}:`, json.errors);
      return null;
    }

    return json.data;
  } catch (error) {
    console.error(`[GraphQL] Request failed at ${GRAPHQL_URL}:`, error);
    return null;
  }
}

/**
 * SEO Fragment for Yoast SEO fields
 */
export const SeoFragment = `
  seo {
    title
    metaDesc
    opengraphTitle
    opengraphDescription
    opengraphImage {
      sourceUrl
    }
    canonical
    twitterTitle
    twitterDescription
    twitterImage {
      sourceUrl
    }
    schema {
      raw
    }
  }
`;

/**
 * Get SEO data for a Page
 */
export async function getPageSeo(uri: string) {
  const query = `
    query GetPageSeo($uri: ID!) {
      page(id: $uri, idType: URI) {
        ${SeoFragment}
      }
    }
  `;
  const data = await fetchGraphQL(query, { uri });
  return data?.page?.seo;
}

/**
 * Get SEO data for a Product
 */
export async function getProductSeo(slug: string) {
  const query = `
    query GetProductSeo($slug: ID!) {
      product(id: $slug, idType: SLUG) {
        ${SeoFragment}
      }
    }
  `;
  const data = await fetchGraphQL(query, { slug });
  return data?.product?.seo;
}

/**
 * Get SEO data for a Category
 */
export async function getCategorySeo(slug: string) {
  const query = `
    query GetCategorySeo($slug: ID!) {
      productCategory(id: $slug, idType: SLUG) {
        ${SeoFragment}
      }
    }
  `;
  const data = await fetchGraphQL(query, { slug });
  return data?.productCategory?.seo;
}

/**
 * Get SEO data for a Page by Database ID
 */
export async function getPageSeoById(id: number) {
  const query = `
    query GetPageSeoById($id: ID!) {
      page(id: $id, idType: DATABASE_ID) {
        ${SeoFragment}
      }
    }
  `;
  const data = await fetchGraphQL(query, { id });
  return data?.page?.seo;
}

export type SeoData = {
  title: string;
  metaDesc: string;
  opengraphTitle: string;
  opengraphDescription: string;
  opengraphImage?: { sourceUrl: string };
  canonical: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage?: { sourceUrl: string };
  schema?: { raw: string };
};
