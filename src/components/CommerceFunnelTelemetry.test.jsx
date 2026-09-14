import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CommerceFunnelTelemetry from "./CommerceFunnelTelemetry";
import { trackTelemetryEvent } from "../telemetry";

jest.mock("../telemetry", () => ({ trackTelemetryEvent: jest.fn() }));

describe("CommerceFunnelTelemetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it("measures catalog, cart, checkout intent and checkout submission with acquisition context", () => {
    render(
      <MemoryRouter initialEntries={["/establishment/view/bar-do-peter?source=merchant_first_order&utm_source=whatsapp"]}>
        <CommerceFunnelTelemetry />
        <button aria-label="Adicionar Pizza">+</button>
        <button className="plat-customer-cta">Continuar pedido</button>
        <div className="plat-cart-count"><b>2</b></div>
        <form className="plat-checkout" aria-label="checkout"><button type="submit">Confirmar</button></form>
      </MemoryRouter>
    );

    expect(trackTelemetryEvent).toHaveBeenCalledWith("plat_ordering_catalog_viewed", expect.objectContaining({
      metadata: expect.objectContaining({ slug: "bar-do-peter", source: "merchant_first_order", utm_source: "whatsapp" }),
    }));

    fireEvent.click(screen.getByLabelText("Adicionar Pizza"));
    expect(trackTelemetryEvent).toHaveBeenCalledWith("plat_ordering_item_added", expect.objectContaining({
      label: "Pizza",
      metadata: expect.objectContaining({ slug: "bar-do-peter" }),
    }));

    fireEvent.click(screen.getByText("Continuar pedido"));
    expect(trackTelemetryEvent).toHaveBeenCalledWith("plat_ordering_checkout_opened", expect.any(Object));

    fireEvent.submit(screen.getByLabelText("checkout"));
    expect(trackTelemetryEvent).toHaveBeenCalledWith("plat_ordering_checkout_submitted", expect.objectContaining({
      metadata: expect.objectContaining({ slug: "bar-do-peter", item_count: 2 }),
    }));

    expect(JSON.parse(sessionStorage.getItem("plat:ordering-funnel:pending"))).toEqual(expect.objectContaining({
      slug: "bar-do-peter",
      item_count: 2,
      source: "merchant_first_order",
    }));
  });

  it("attributes the created order to the checkout intent and clears pending state", () => {
    sessionStorage.setItem("plat:ordering-funnel:pending", JSON.stringify({
      slug: "bar-do-peter",
      item_count: 3,
      started_at: Date.now(),
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
      metadata: expect.objectContaining({ order_id: "987", slug: "bar-do-peter", item_count: 3, utm_source: "whatsapp" }),
    }));
    expect(sessionStorage.getItem("plat:ordering-funnel:pending")).toBeNull();
  });
});
