import axios from "axios";
import { apiV1BaseUrl } from "../config";

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

const creativeService = {
  generateCatalogDescription: async (payload) => {
    const { data } = await axios.post(
      `${apiV1BaseUrl}/creative/catalog/description`,
      payload,
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
