"use client";
import Modal from "@/components/modal";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Coffee, Utensils, Plus } from "lucide-react";
import AppShell from "@/components/app-shell";

type Product = { id: number; name: string; price: number; category_id: number; destination: string; active: number };
type Category = { id: number; name: string };
export default function CatalogClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setProducts(data.products); setCategories(data.categories);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao carregar."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  async function save(event: FormEvent<HTMLFormElement>, category = false) {
    event.preventDefault(); setBusy(true); setError("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const existing = editing && editing !== "new" ? editing : null;
    const body = category ? { kind: "category", name: values.name } : { ...values, id: existing?.id, price: Number(values.price), category_id: Number(values.category_id), active: Number(values.active) };
    try {
      const response = await fetch("/api/catalog", { method: existing && !category ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (category) form.reset(); else setEditing(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao salvar."); }
    finally { setBusy(false); }
  }
  const filtered = products.filter(p => (categoryFilter === null || p.category_id === categoryFilter) && p.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  const product = editing && editing !== "new" ? editing : null;
  return <AppShell title="Cardápio"><div className="dashboard-body">
    <section className="page-head"><div><p className="eyebrow">Do seu jeito, com seu sabor</p><h1>Cardápio</h1><p>Organize os produtos e deixe tudo pronto para o próximo pedido.</p></div><button className="primary-button" onClick={() => setEditing("new")}><Plus size={17}/>Novo produto</button></section>
    {error && <div className="content-error" role="alert">{error}<button onClick={() => { setError(""); void load(); }}>Tentar novamente</button></div>}
    <div className="catalog-tools"><label>Buscar produto<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome do produto" /></label><form onSubmit={e => save(e, true)}><label>Nova categoria<input name="name" required maxLength={60} placeholder="Ex.: Sobremesas" /></label><button className="primary-button" disabled={busy}>Adicionar categoria</button></form></div>
    <div className="filter-tabs catalog-category-filters" aria-label="Categorias do cardápio"><button aria-pressed={categoryFilter === null} className={categoryFilter === null ? "active" : ""} onClick={() => setCategoryFilter(null)}>Todos os produtos</button>{categories.map(c => <button key={c.id} aria-pressed={categoryFilter === c.id} className={categoryFilter === c.id ? "active" : ""} onClick={() => setCategoryFilter(c.id)}>{c.name}</button>)}</div>
    {loading ? <p>Carregando cardápio...</p> : <div className="catalog-grid">{filtered.map(p => <article className="operation-card" key={p.id}><div className="product-symbol">{p.destination === "BAR" ? <Coffee size={24}/> : <Utensils size={24}/>}</div><small>{categories.find(c => c.id === p.category_id)?.name} · {p.destination === "BAR" ? "Bar" : "Cozinha"}</small><h2>{p.name}</h2><strong>{Number(p.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong><p>{p.active ? "Disponível para pedidos" : "Indisponível"}</p><button className="primary-button" onClick={() => setEditing(p)}>Editar produto</button></article>)}{!filtered.length && <div className="orders-empty"><Utensils/><strong>{products.length ? "Nenhum produto encontrado" : "Seu cardápio começa aqui"}</strong><span>{products.length ? "Altere a busca ou escolha outra categoria." : "Crie uma categoria e cadastre seu primeiro produto."}</span></div>}</div>}
    {editing && <Modal label="Produto" onClose={() => { if (!busy) setEditing(null); }}><form className="custom-modal" onSubmit={save} key={product?.id ?? "new"}><div className="modal-head"><h2>{product ? "Editar produto" : "Novo produto"}</h2><button type="button" disabled={busy} onClick={() => setEditing(null)} aria-label="Fechar">×</button></div>
      <label>Nome<input name="name" required maxLength={80} defaultValue={product?.name} /></label>
      <div className="form-row"><label>Preço (R$)<input name="price" type="number" min="0" max="999999.99" step="0.01" required defaultValue={product?.price} /></label><label>Categoria<select name="category_id" required defaultValue={product?.category_id ?? ""}><option value="" disabled>Selecione</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
      <div className="form-row"><label>Destino<select name="destination" defaultValue={product?.destination ?? "KITCHEN"}><option value="KITCHEN">Cozinha</option><option value="BAR">Bar</option></select></label><label>Disponibilidade<select name="active" defaultValue={product?.active ?? 1}><option value={1}>Disponível</option><option value={0}>Indisponível</option></select></label></div>
      {error && <p role="alert" className="login-error">{error}</p>}<div className="modal-actions"><button type="button" disabled={busy} onClick={() => setEditing(null)}>Cancelar</button><button disabled={busy || !categories.length}>{busy ? "Salvando..." : "Salvar produto"}</button></div>
    </form></Modal>}
  </div></AppShell>;
}
