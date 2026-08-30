import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FiArrowRight,
  FiGrid,
  FiMapPin,
  FiSearch,
  FiShoppingBag,
  FiSliders,
  FiX,
} from "react-icons/fi";
import { apiBaseUrl, appId, storageUrl } from "../../config";
import "./PublicRestaurantsPage.css";

const initials = (value) =>
  String(value || "PL")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const imageUrl = (path) => {
  if (!path) return null;
  const value = String(path);
  return value.startsWith("http")
    ? value
    : `${storageUrl}/${value.replace(/^\//, "")}`;
};

const restaurantName = (restaurant) =>
  restaurant?.fantasy || restaurant?.name || "Restaurante";

const categoryName = (restaurant) =>
  restaurant?.category || restaurant?.type || "Restaurante";

export default function PublicRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/home/${appId}`
        );

        if (active) {
          setRestaurants(
            Array.isArray(data?.establishments) ? data.establishments : []
          );
        }
      } catch {
        if (active) setRestaurants([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const cities = useMemo(
    () =>
      [...new Set(restaurants.map((item) => item.city).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "pt-BR")
      ),
    [restaurants]
  );

  const categories = useMemo(
    () =>
      [...new Set(restaurants.map(categoryName).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [restaurants]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const searchable = [
        restaurant.name,
        restaurant.fantasy,
        restaurant.category,
        restaurant.type,
        restaurant.city,
        restaurant.uf,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !term || searchable.includes(term);
      const matchesCity = city === "all" || restaurant.city === city;
      const matchesCategory =
        category === "all" || categoryName(restaurant) === category;

      return matchesQuery && matchesCity && matchesCategory;
    });
  }, [restaurants, query, city, category]);

  const hasFilters = query || city !== "all" || category !== "all";

  const clearFilters = () => {
    setQuery("");
    setCity("all");
    setCategory("all");
  };

  return (
    <div className="plat-discovery">
      <header className="plat-discovery__nav">
        <Link to="/" className="plat-discovery__brand" aria-label="Plat">
          <img src="/images/plat-logo.svg" alt="" />
          <div>
            <strong>PLAT</strong>
            <span>Restaurantes & pedidos</span>
          </div>
        </Link>

        <nav className="plat-discovery__nav-actions">
          <Link to="/">Início</Link>
          <Link to="/login">Entrar</Link>
          <Link className="plat-discovery__manage" to="/register">
            Sou restaurante
          </Link>
        </nav>
      </header>

      <main className="plat-discovery__main">
        <section className="plat-discovery__hero">
          <div className="plat-discovery__hero-copy">
            <span className="plat-discovery__eyebrow">
              <FiShoppingBag /> Descubra, escolha e peça
            </span>
            <h1>Seu próximo pedido começa aqui.</h1>
            <p>
              Explore restaurantes disponíveis na Plat, encontre o que combina
              com você e abra o cardápio em poucos segundos.
            </p>
          </div>

          <div className="plat-discovery__hero-stat" aria-label="Restaurantes disponíveis">
            <span>Na Plat agora</span>
            <strong>{loading ? "—" : restaurants.length}</strong>
            <small>{restaurants.length === 1 ? "restaurante" : "restaurantes"}</small>
          </div>
        </section>

        <section className="plat-discovery__toolbar" aria-label="Filtros de restaurantes">
          <label className="plat-discovery__search">
            <FiSearch />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busque por restaurante, comida ou cidade"
              aria-label="Buscar restaurantes"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">
                <FiX />
              </button>
            ) : null}
          </label>

          <div className="plat-discovery__select-wrap">
            <FiMapPin />
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="all">Todas as cidades</option>
              {cities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="plat-discovery__select-wrap">
            <FiSliders />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">Todas as categorias</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </section>

        {categories.length > 1 ? (
          <div className="plat-discovery__chips" aria-label="Categorias rápidas">
            <button
              type="button"
              className={category === "all" ? "is-active" : ""}
              onClick={() => setCategory("all")}
            >
              Todos
            </button>
            {categories.slice(0, 7).map((value) => (
              <button
                type="button"
                key={value}
                className={category === value ? "is-active" : ""}
                onClick={() => setCategory(value)}
              >
                {value}
              </button>
            ))}
          </div>
        ) : null}

        <section className="plat-discovery__results-head">
          <div>
            <span className="plat-discovery__results-icon"><FiGrid /></span>
            <div>
              <h2>Restaurantes</h2>
              <p>
                {loading
                  ? "Carregando opções disponíveis…"
                  : `${filtered.length} ${filtered.length === 1 ? "opção encontrada" : "opções encontradas"}`}
              </p>
            </div>
          </div>

          {hasFilters ? (
            <button type="button" onClick={clearFilters}>
              Limpar filtros
            </button>
          ) : null}
        </section>

        {loading ? (
          <section className="plat-discovery__grid" aria-label="Carregando restaurantes">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <article className="plat-restaurant-card plat-restaurant-card--skeleton" key={item}>
                <div className="plat-restaurant-card__cover" />
                <div className="plat-restaurant-card__body">
                  <i />
                  <i />
                  <i />
                </div>
              </article>
            ))}
          </section>
        ) : filtered.length === 0 ? (
          <section className="plat-discovery__empty">
            <div><FiSearch /></div>
            <h2>Nenhum restaurante encontrado</h2>
            <p>
              Tente outro nome, cidade ou categoria para encontrar uma opção na Plat.
            </p>
            {hasFilters ? (
              <button type="button" onClick={clearFilters}>
                Limpar filtros
              </button>
            ) : null}
          </section>
        ) : (
          <section className="plat-discovery__grid">
            {filtered.map((restaurant) => {
              const cover = imageUrl(restaurant.background);
              const logo = imageUrl(restaurant.logo);
              const name = restaurantName(restaurant);
              const location = [restaurant.city, restaurant.uf]
                .filter(Boolean)
                .join(" • ");

              return (
                <Link
                  to={`/establishment/view/${restaurant.slug}`}
                  className="plat-restaurant-card"
                  key={restaurant.id}
                >
                  <div
                    className={`plat-restaurant-card__cover${cover ? " has-image" : ""}`}
                    style={cover ? { backgroundImage: `url('${cover}')` } : undefined}
                  >
                    <span className="plat-restaurant-card__category">
                      {categoryName(restaurant)}
                    </span>
                    <span className="plat-restaurant-card__open-label">
                      Ver cardápio
                    </span>
                  </div>

                  <div className="plat-restaurant-card__identity">
                    <div className="plat-restaurant-card__logo">
                      {logo ? <img src={logo} alt="" /> : <span>{initials(name)}</span>}
                    </div>
                    <div className="plat-restaurant-card__title">
                      <h2>{name}</h2>
                      <p>{restaurant.name && restaurant.name !== name ? restaurant.name : categoryName(restaurant)}</p>
                    </div>
                  </div>

                  <div className="plat-restaurant-card__body">
                    <div className="plat-restaurant-card__location">
                      <FiMapPin />
                      <span>{location || "Localização não informada"}</span>
                    </div>

                    <div className="plat-restaurant-card__footer">
                      <span>
                        <FiShoppingBag /> Pedir pela Plat
                      </span>
                      <i><FiArrowRight /></i>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
