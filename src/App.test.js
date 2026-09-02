import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SeoManager from "./components/SeoManager";

const renderSeo = (path) => render(<MemoryRouter initialEntries={[path]}><SeoManager/></MemoryRouter>);

describe("Plat SEO", () => {
  test("keeps the public landing page indexable", () => {
    renderSeo("/");
    expect(document.title).toMatch(/Plat/);
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute("content", expect.stringContaining("index"));
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute("href", "https://plat.petertecnet.com.br/");
  });

  test("marks authenticated application routes as noindex", () => {
    renderSeo("/dashboard");
    expect(document.title).toBe("Painel | Plat");
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute("content", expect.stringContaining("noindex"));
  });

  test("marks unknown routes as noindex", () => {
    renderSeo("/nao-existe");
    expect(document.title).toBe("Página não encontrada | Plat");
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute("content", expect.stringContaining("noindex"));
  });
});
