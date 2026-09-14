import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CommerceFunnelTelemetry from "./CommerceFunnelTelemetry";
import { trackTelemetryEvent } from "../telemetry";
import { getOrdering } from "../services/platCommerceApi";

jest.mock("../telemetry", () => ({ trackTelemetryEvent: jest.fn() }));
jest.mock("../services/platCommerceApi", () => ({
  getOrdering: jest.fn(),
}));

describe("CommerceFunnelTelemetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    getOrdering.mockResolvedValue({ establishment: { id: 42, slug: "bar-do-peter" } });
  });

  it("measures catalog, cart, checkout intent and checkout submission with acquisition context", async () => {
    render(
      <MemoryRouter initialEntries={["/establishment/view/bar-do-peter?source=merchant_first_order&utm_source=whatsapp"]}>
        <CommerceFunnelTelemetry />
        <button aria-label="Adicionar Pizza">+</button>
        <button className="plat-customer-cta">Continuar pedido</button>
        <div className="plat-cart-count"><b>2</b></div>
        <form className="plat-checkout" aria-label="checkout"><button type="submit">Confirmar</button></form>
      </MemoryRouter>
    );

    await waitFor(() => expect(trackTelemetryEvent).toHaveBeenCalledWith("plat_ordering_catalog_viewed", expect.objectContaining({
      metadata: expect.objectContaining({
        slug: "bar-do-peter",
        source: "merchant_first_order",
        utm_source: "whatsapp",
        entity_type: "establishment",
        entity_id: 42,
      }),
    })));

    fireEvent.click(screen.getByLabelText("Adicionar Pizza"));
    expect(trackTelemetryEvent).toHaveBeenCalledWith("plat_ordering_item_added", expect.objectContaining({
      label: "Pizza",
      metadata: expect.objectContaining({ slug: "bar-do-peter", entity_id: 42 }),
    }));

    fireEvent.click(screen.getByText("Continuar pedido"));
    expect(trackTelemetryEvent).toHaveBeenCalledWith("plat_ordering_checkout_opened", expect.any(Object));

    fireEvent.submit(screen.getByLabelText("checkout"));
    expect(trackTelemetryEvent).toHaveBeenCalledWith("plat_ordering_checkout_submitted", expect.objectContaining({
      metadata: expect.objectContaining({ slug: "bar-do-peter", item_count: 2, entity_id: 42 }),
    }));

    expect(JSON.parse(sessionStorage.getItem("plat:ordering-funnel:pending"))).toEqual(expect.objectContaining({
      slug: "bar-do-peter",
      item_count: 2,
      entity_id: 42,
      source: "merchant_first_order",
    }));
  });

  it("attributes the created order to the checkout intent and clears pending state", () => {
    sessionStorage.setItem("plat:ordering-funnel:pending", JSON.stringify({
      slug: "bar-do-peter",
      item_count: 3,
      started_at: Date.now(),
      entity_id: 42,
      source: "merchant_first_order",
      utm_source: "whatsapp",
      utm_medium: "",
      utm_campaign: "",
    }));

    render(
      <MemoryRouter initialEntries={["/pedido/987"]}>
        <CommerceFunnelTelemetry />
      </MemoryRouter>
    );

    expect(trackTelemetryEvent).toHaveBeenCalledWith("plat_ordering_order_created", expect.objectContaining({
      label: "987",
      metadata: expect.objectContaining({
        order_id: "987",
        slug: "bar-do-peter",
        item_count: 3,
        entity_type: "establishment",
        entity_id: 42,
        utm_source: "whatsapp",
      }),
    }));
    expect(sessionStorage.getItem("plat:ordering-funnel:pending")).toBeNull();
  });
});
