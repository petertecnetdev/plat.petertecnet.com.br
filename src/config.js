const apiBaseUrl = "https://api.petertecnet.com.br/api";
const storageUrl = "https://api.petertecnet.com.br/";

// Legacy numeric ID remains exported until all consumers move to the v1 context.
const appId = 5;
const appSlug = "plat";
const apiV1BaseUrl = `${apiBaseUrl}/v1/apps/${appSlug}`;

export { apiBaseUrl, apiV1BaseUrl, storageUrl, appId, appSlug };
