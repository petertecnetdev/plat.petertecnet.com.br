import axios from "axios";
import { apiV1BaseUrl } from "../config";

const SubscriptionPlanService = {
  async list() {
    const { data } = await axios.get(`${apiV1BaseUrl}/subscription-plans`);
    return data?.data ?? data;
  },
};

export default SubscriptionPlanService;
