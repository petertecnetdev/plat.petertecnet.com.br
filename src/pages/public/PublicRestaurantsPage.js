import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiAlertCircle, FiArrowRight, FiGrid, FiMapPin, FiRefreshCw, FiSearch, FiShoppingBag, FiSliders, FiX } from "react-icons/fi";
import { storageUrl } from "../../config";
import { apiErrorMessage, getRestaurants } from "../../services/platCommerceApi";
import "./PublicRestaurantsPage.css";

const initials = (value) => String(value || "PL").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const imageUrl = (path) => !path ? null : String(path).startsWith("http") ? String(path) : `${storageUrl}/${String(path).replace(/^\//, "")}`;
const restaurantName = (r) => r?.fantasy || r?.name || "Restaurante";
const categoryName = (r) => typeof r?.category === "string" ? r.category : (r?.category?.name || r?.type || "Restaurante");

export default function PublicRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState("all");
  const authenticated = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getRestaurants({ per_page: 100 })
      .then((result) => { if (active) setRestaurants(Array.isArray(result?.data) ? result.data : []); })
      .catch((requestError) => {
        if (!active) return;
        setRestaurants([]);
        setError(apiErrorMessage(requestError, "Não foi possível carregar os restaurantes agora."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retryKey]);

  const cities = useMemo(() => [...new Set(restaurants.map((r) => r.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")), [restaurants]);
  const categories = useMemo(() => [...new Set(restaurants.map(categoryName).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")), [restaurants]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return restaurants.filter((r) => {
      const searchable = [r.name, r.fantasy, categoryName(r), r.type, r.city, r.uf].filter(Boolean).join(" ").toLowerCase();
      return (!term || searchable.includes(term)) && (city === "all" || r.city === city) && (category === "all" || categoryName(r) === category);
    });
  }, [restaurants, query, city, category]);
  const hasFilters = Boolean(query) || city !== "all" || category !== "all";
  const clearFilters = () => { setQuery(""); setCity("all"); setCategory("all"); };

  return <div className="plat-discovery">
    <header className="plat-discovery__nav">
      <Link to="/" className="plat-discovery__brand" aria-label="Plat - página inicial"><img src="/images/plat-logo.svg" alt=""/><div><strong>PLAT</strong><span>Restaurantes & pedidos</span></div></Link>
      <nav className="plat-discovery__nav-actions" aria-label="Navegação principal"><Link to="/">Início</Link>{authenticated && <Link to="/my-orders">Meus pedidos</Link>}<Link to={authenticated ? "/dashboard" : "/login"}>{authenticated ? "Minha conta" : "Entrar"}</Link><Link className="plat-discovery__manage" to={authenticated ? "/establishment" : "/register"}>Sou restaurante</Link></nav>
    </header>
    <main className="plat-discovery__main" id="conteudo-principal">
      <section className="plat-discovery__hero"><div className="plat-discovery__hero-copy"><span className="plat-discovery__eyebrow"><FiShoppingBag/> Descubra, escolha e peça</span><h1>Seu próximo pedido começa aqui.</h1><p>Explore restaurantes da Plat, escolha seu pedido e acompanhe cada etapa até a conclusão.</p></div><div className="plat-discovery__hero-stat" aria-live="polite"><span>Na Plat agora</span><strong>{loading ? "—" : restaurants.length}</strong><small>{restaurants.length === 1 ? "restaurante" : "restaurantes"}</small></div></section>
      <section className="plat-discovery__toolbar" aria-label="Filtros de restaurantes">
        <label className="plat-discovery__search"><FiSearch/><span className="visually-hidden">Buscar restaurantes</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Busque por restaurante, comida ou cidade" aria-label="Buscar restaurantes"/>{query ? <button type="button" onClick={()=>setQuery("")} aria-label="Limpar busca"><FiX/></button> : null}</label>
        <div className="plat-discovery__select-wrap"><FiMapPin/><select aria-label="Filtrar por cidade" value={city} onChange={(e)=>setCity(e.target.value)}><option value="all">Todas as cidades</option>{cities.map((v)=><option key={v} value={v}>{v}</option>)}</select></div>
        <div className="plat-discovery__select-wrap"><FiSliders/><select aria-label="Filtrar por categoria" value={category} onChange={(e)=>setCategory(e.target.value)}><option value="all">Todas as categorias</option>{categories.map((v)=><option key={v} value={v}>{v}</option>)}</select></div>
      </section>
      {categories.length > 1 && <div className="plat-discovery__chips" aria-label="Categorias"><button type="button" className={category === "all" ? "is-active" : ""} onClick={()=>setCategory("all")}>Todos</button>{categories.slice(0,7).map((v)=><button type="button" key={v} className={category===v?"is-active":""} onClick={()=>setCategory(v)}>{v}</button>)}</div>}
      <section className="plat-discovery__results-head"><div><span className="plat-discovery__results-icon"><FiGrid/></span><div><h2>Restaurantes</h2><p aria-live="polite">{loading ? "Carregando opções disponíveis…" : error ? "Não foi possível carregar" : `${filtered.length} ${filtered.length===1?"opção encontrada":"opções encontradas"}`}</p></div></div>{hasFilters && !error && <button type="button" onClick={clearFilters}>Limpar filtros</button>}</section>
      {loading ? <section className="plat-discovery__grid" aria-label="Carregando restaurantes">{[0,1,2,3,4,5].map((i)=><article className="plat-restaurant-card plat-restaurant-card--skeleton" key={i}><div className="plat-restaurant-card__cover"/><div className="plat-restaurant-card__body"><i/><i/><i/></div></article>)}</section>
        : error ? <section className="plat-discovery__empty" role="alert"><div><FiAlertCircle/></div><h2>Não foi possível carregar os restaurantes</h2><p>{error}</p><button type="button" onClick={()=>setRetryKey((value)=>value+1)}><FiRefreshCw/> Tentar novamente</button></section>
        : filtered.length === 0 ? <section className="plat-discovery__empty"><div><FiSearch/></div><h2>Nenhum restaurante encontrado</h2><p>Tente outro nome, cidade ou categoria.</p>{hasFilters && <button type="button" onClick={clearFilters}>Limpar filtros</button>}</section>
        : <section className="plat-discovery__grid">{filtered.map((r)=>{const cover=imageUrl(r.background);const logo=imageUrl(r.logo);const name=restaurantName(r);const location=[r.city,r.uf].filter(Boolean).join(" • ");return <Link to={`/establishment/view/${r.slug}`} className="plat-restaurant-card" key={r.id} aria-label={`${name}${location ? `, ${location}` : ""}. Ver cardápio`}><div className={`plat-restaurant-card__cover${cover?" has-image":""}`} style={cover?{backgroundImage:`url("${cover.replace(/"/g, "%22")}")`}:undefined}><span className="plat-restaurant-card__category">{categoryName(r)}</span><span className="plat-restaurant-card__open-label">Ver cardápio</span></div><div className="plat-restaurant-card__identity"><div className="plat-restaurant-card__logo">{logo?<img src={logo} alt="" loading="lazy" decoding="async"/>:<span>{initials(name)}</span>}</div><div className="plat-restaurant-card__title"><h2>{name}</h2><p>{r.name && r.name!==name?r.name:categoryName(r)}</p></div></div><div className="plat-restaurant-card__body"><div className="plat-restaurant-card__location"><FiMapPin/><span>{location||"Localização não informada"}</span></div><div className="plat-restaurant-card__footer"><span><FiShoppingBag/> Pedir pela Plat</span><i><FiArrowRight/></i></div></div></Link>})}</section>}
    </main>
  </div>;
}
