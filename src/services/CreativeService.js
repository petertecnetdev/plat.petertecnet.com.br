import axios from "axios";
import { apiBaseUrl, apiV1BaseUrl } from "../config";

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

const compact = (values) => Object.fromEntries(
  Object.entries(values).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== ""),
);

const creativeService = {
  generateCatalogDescription: async (payload) => {
    const { data } = await axios.post(
      `${apiBaseUrl}/ai/content/description`,
      {
        entity_type: "item",
        title: payload.subject,
        current_description: payload.current_description || undefined,
        context: compact({
          tipo: payload.item_type === "service" ? "serviço" : "produto",
          categoria: payload.category,
          subcategoria: payload.subcategory,
          marca: payload.brand,
          estabelecimento: payload.catalog_name,
        }),
        locale: "pt-BR",
        tone: payload.tone === "commercial"
          ? "comercial, natural, convidativo e objetivo"
          : payload.tone,
      },
      authConfig(),
    );
    return data;
  },

  generateCatalogImage: async (payload) => {
    const { data } = await axios.post(
      `${apiV1BaseUrl}/creative/catalog/image`,
      payload,
      authConfig(),
    );
    return data;
  },
};

export default creativeService;
