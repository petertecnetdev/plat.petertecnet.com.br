import axios from "axios";
import { apiV1BaseUrl } from "../config";

export const ORDERING_FUNNEL_EVENTS = [
  "plat_ordering_catalog_viewed",
  "plat_ordering_item_added",
  "plat_ordering_checkout_opened",
  "plat_ordering_checkout_submitted",
  "plat_ordering_order_created",
];

export const PIX_FUNNEL_EVENTS = [
  "frontend_pix_payment_ready",
  "frontend_pix_code_copied",
  "frontend_payment_approved",
];

const REVENUE_FUNNEL_EVENTS = [...ORDERING_FUNNEL_EVENTS, ...PIX_FUNNEL_EVENTS];
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

export const getEstablishmentRevenueFunnel = async (establishmentId, days = 30) => {
  const { data } = await axios.get(`${apiV1BaseUrl}/establishments/${establishmentId}/metrics`, {
    headers: headers(),
    params: {
      interaction_types: REVENUE_FUNNEL_EVENTS,
      interaction_days: days,
    },
  });

  return data?.data?.interaction_funnel || { days, counts: {} };
};
