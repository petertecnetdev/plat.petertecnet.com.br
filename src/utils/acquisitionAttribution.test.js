import { acquisitionTelemetryMetadata, captureAcquisitionAttribution } from "./acquisitionAttribution";

describe("acquisition attribution", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/establishment/create");
  });

  test("preserves organic referral attribution across activation steps", () => {
    window.history.replaceState(
      {},
      "",
      "/establishment/create?source=powered-by-plat&ref=cafe-central&utm_source=public_menu&utm_medium=product_badge&utm_campaign=powered_by_plat"
    );

    const establishmentAttribution = captureAcquisitionAttribution();
    expect(establishmentAttribution).toEqual({
      source: "powered-by-plat",
      referral: "cafe-central",
      utm_source: "public_menu",
      utm_medium: "product_badge",
      utm_campaign: "powered_by_plat",
    });

    window.history.replaceState({}, "", "/item/create/cafe-central");
    const itemAttribution = captureAcquisitionAttribution();

    expect(itemAttribution).toEqual(establishmentAttribution);
    expect(acquisitionTelemetryMetadata(itemAttribution)).toEqual({
      acquisition_source: "powered-by-plat",
      acquisition_referral: "cafe-central",
      utm_source: "public_menu",
      utm_medium: "product_badge",
      utm_campaign: "powered_by_plat",
    });
  });

  test("rejects unsafe attribution values instead of persisting them", () => {
    window.history.replaceState(
      {},
      "",
      "/establishment/create?source=https%3A%2F%2Fevil.example&ref=%3Cscript%3E"
    );

    expect(captureAcquisitionAttribution()).toEqual({
      source: "",
      referral: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
    });
    expect(localStorage.getItem("plat_acquisition_attribution")).toBeNull();
    expect(sessionStorage.getItem("plat_acquisition_attribution")).toBeNull();
  });
});
