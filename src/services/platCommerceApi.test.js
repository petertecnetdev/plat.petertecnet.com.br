import axios from "axios";
import { getOrdering } from "./platCommerceApi";

jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));

describe("atualização do cardápio antes do checkout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/restaurants");
  });

  test("reutiliza a consulta recente na navegação comum", async () => {
    axios.get.mockResolvedValue({ data: { data: { ordering: { available: true } } } });

    const first = await getOrdering("restaurante-cache-teste");
    const second = await getOrdering("restaurante-cache-teste");

    expect(first.ordering.available).toBe(true);
    expect(second).toEqual(first);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test("ignora o cache quando o checkout exige estoque atualizado", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { data: { ordering: { available: true } } } })
      .mockResolvedValueOnce({ data: { data: { ordering: { available: false } } } });

    await getOrdering("restaurante-refresh-teste");
    const latest = await getOrdering("restaurante-refresh-teste", { forceRefresh: true });

    expect(latest.ordering.available).toBe(false);
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect((await getOrdering("restaurante-refresh-teste")).ordering.available).toBe(false);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test("erro de consulta antiga não apaga o cache de uma revalidação nova", async () => {
    let rejectOld;
    axios.get
      .mockImplementationOnce(() => new Promise((resolve, reject) => { rejectOld = reject; }))
      .mockResolvedValueOnce({ data: { data: { ordering: { available: false } } } });

    const previous = getOrdering("restaurante-concorrencia-teste");
    const refreshed = await getOrdering("restaurante-concorrencia-teste", { forceRefresh: true });
    expect(refreshed.ordering.available).toBe(false);

    rejectOld(new Error("falha na consulta antiga"));
    await expect(previous).rejects.toThrow("falha na consulta antiga");

    const cached = await getOrdering("restaurante-concorrencia-teste");
    expect(cached).toEqual(refreshed);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
