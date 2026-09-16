"use client";
import Modal from "@/components/modal";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle, ArrowLeft, Check, ChefHat, Clock3, LoaderCircle, Minus, Plus,
  Printer, Search, Send, ShoppingBasket, Trash2, X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentUser } from "@/components/use-current-user";
import type { Destination, TableStatus } from "@/lib/db";

type Product = { id: number; name: string; price: number; category: string; destination: Destination };
type CartItem = Product & { quantity: number; notes?: string; custom?: boolean };
type SentOrder = { id: number | string; items: CartItem[]; total: number; sentAt: Date; createdBy?: string; preview?: boolean };
type TableData = { id: number; number: number; currentName: string | null; status: TableStatus; total: number; orderCount: number };

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export default function OrderPage() {
  const params = useParams<{ numero: string }>();
  const router = useRouter();
  const cartRef = useRef<HTMLElement>(null);
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const [table, setTable] = useState<TableData | null>(null);
  const [tableName, setTableName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sentOrders, setSentOrders] = useState<SentOrder[]>([]);
  const [printOrder, setPrintOrder] = useState<SentOrder | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/tables/${params.numero}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível carregar a comanda.");
      setTable(data.table);
      setTableName(data.table.currentName ?? "");
      setProducts(data.products);
      setSentOrders(data.orders.map((order: Omit<SentOrder, "sentAt"> & { sentAt: string }) => ({ ...order, sentAt: new Date(order.sentAt.includes("T") ? order.sentAt : `${order.sentAt.replace(" ", "T")}Z`) })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar a comanda.");
    } finally { setLoading(false); }
  }, [params.numero]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initial);
  }, [load]);

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(products.map((item) => item.category)))], [products]);
  const visibleProducts = products.filter((item) => {
    const matchesCategory = category === "Todos" || item.category === category;
    const matchesSearch = item.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"));
    return matchesCategory && matchesSearch;
  });
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const opened = table?.status !== "AVAILABLE";
  const awaitingPayment = table?.status === "AWAITING_PAYMENT";

  async function openTable() {
    if (!tableName.trim()) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/tables/${params.numero}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: tableName }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setTable(data.table);
      setNotice("Atendimento aberto. A mesa já está visível para toda a equipe.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível abrir a mesa."); }
    finally { setSaving(false); }
  }

  function addProduct(product: Product) {
    if (awaitingPayment) return;
    setCart((current) => {
      const found = current.find((item) => item.id === product.id && !item.custom);
      return found ? current.map((item) => item === found ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(id: number, custom: boolean | undefined, amount: number) {
    setCart((current) => current.map((item) => item.id === id && item.custom === custom ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  }

  function updateNotes(id: number, custom: boolean | undefined, notes: string) {
    setCart((current) => current.map((item) => item.id === id && item.custom === custom ? { ...item, notes } : item));
  }

  function addCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const price = Number(data.get("price"));
    if (!name || !Number.isFinite(price) || price < 0) return;
    setCart((current) => [...current, { id: Date.now(), name, price, quantity: Number(data.get("quantity")) || 1, category: "Avulso", destination: data.get("destination") as Destination, notes: String(data.get("notes") ?? "").trim(), custom: true }]);
    setCustomOpen(false);
  }

  async function sendOrder() {
    if (!opened || !cart.length || awaitingPayment) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/tables/${params.numero}/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      const order = { ...data.order, sentAt: new Date(data.order.sentAt.includes("T") ? data.order.sentAt : `${data.order.sentAt.replace(" ", "T")}Z`) } as SentOrder;
      setSentOrders((current) => [order, ...current]);
      setTable((current) => current ? { ...current, total: current.total + cartTotal, orderCount: current.orderCount + 1 } : current);
      setNotice(`Pedido #${String(order.id).padStart(4, "0")} enviado para produção.`);
      setCart([]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível enviar o pedido."); }
    finally { setSaving(false); }
  }

  async function checkout() {
    const action = isAdmin ? "CONFIRM" : "REQUEST";
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/tables/${params.numero}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (action === "CONFIRM") { router.replace("/mesas"); router.refresh(); return; }
      setTable(data.table);
      setNotice("Fechamento solicitado. A comanda foi enviada ao caixa.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível fechar a comanda."); }
    finally { setSaving(false); }
  }

  function print(order: SentOrder) { setPrintOrder(order); window.setTimeout(() => window.print(), 100); }
  function printPreview() { if (cart.length) print({ id: "PRÉVIA", items: cart.map((item) => ({ ...item })), total: cartTotal, sentAt: new Date(), preview: true }); }

  if (loading) return <main className="open-table-page"><div className="page-loading"><LoaderCircle className="spin"/><span>Carregando comanda...</span></div></main>;
  if (!table) return <main className="open-table-page"><section className="open-table-card"><AlertCircle size={28}/><h1>Comanda indisponível</h1><p>{error}</p><Link href="/mesas"><ArrowLeft size={17}/> {isAdmin ? "Voltar ao salão" : "Escolher mesa"}</Link></section></main>;

  if (!opened) return (
    <main className="open-table-page">
      <section className="open-table-card">
        <div className="window-controls"><i/><i/><i/></div>
        <Link href="/mesas"><ArrowLeft size={17}/> {isAdmin ? "Voltar ao salão" : "Escolher mesa"}</Link>
        <div className="open-table-icon"><ChefHat size={25}/></div>
        <span className="table-number">MESA {String(params.numero).padStart(2, "0")}</span>
        <h1>Abrir atendimento</h1>
        <p>Dê um nome à comanda para a equipe identificar esta mesa.</p>
        <label>Nome da comanda<input autoFocus value={tableName} onChange={(event) => setTableName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") openTable(); }} placeholder="Ex.: João, família Silva..." maxLength={60}/></label>
        {error && <div className="login-error"><AlertCircle size={16}/>{error}</div>}
        <button disabled={!tableName.trim() || saving} onClick={openTable}>{saving ? <LoaderCircle className="spin" size={19}/> : <Check size={19}/>} {saving ? "Abrindo..." : "Abrir mesa"}</button>
      </section>
    </main>
  );

  return (
    <main className="order-page">
      <header className="order-topbar">
        <div className="window-controls"><i/><i/><i/></div>
        <Link href="/mesas" className="order-brand"><ChefHat size={20}/><strong>Sabom</strong></Link>
        <div className="order-table-title"><span>Mesa {String(table.number).padStart(2, "0")}</span><strong>{table.currentName}</strong></div>
        <div className={`order-status ${awaitingPayment ? "payment" : "active"}`}><i/>{awaitingPayment ? "Aguardando caixa" : "Atendimento ativo"}</div>
      </header>
      {notice && <div className="toast" role="status"><Check size={17}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Fechar aviso"><X size={15}/></button></div>}
      <div className="order-layout">
        <section className="catalog">
          <div className="catalog-head"><div><Link href="/mesas"><ArrowLeft size={16}/> {isAdmin ? "Visão do salão" : "Escolher mesa"}</Link><h1>{awaitingPayment ? "Comanda no caixa" : "Adicionar itens"}</h1><p>{awaitingPayment ? "O pedido está bloqueado enquanto aguarda pagamento." : "Selecione os produtos para montar o próximo envio."}</p></div><button disabled={awaitingPayment} onClick={() => setCustomOpen(true)}><Plus size={17}/> Item avulso</button></div>
          <label className="product-search"><Search size={18}/><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar no cardápio" placeholder="Buscar no cardápio..." disabled={awaitingPayment}/></label>
          <nav className="categories" aria-label="Categorias">{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item} disabled={awaitingPayment}>{item}</button>)}</nav>
          <div className="product-grid">{visibleProducts.map((product) => <button className="product-card" onClick={() => addProduct(product)} key={product.id} disabled={awaitingPayment}><span>{product.destination === "KITCHEN" ? "Cozinha" : "Bar"}</span><strong>{product.name}</strong><b>{money.format(product.price)}</b><i><Plus size={16}/></i></button>)}</div>
          {!visibleProducts.length && <div className="no-products">Nenhum produto encontrado.</div>}
        </section>

        <aside className="cart" ref={cartRef}>
          <div className="cart-title"><div><strong>Comanda da mesa</strong><small>{table.orderCount} {table.orderCount === 1 ? "envio realizado" : "envios realizados"}</small></div><span>{money.format(table.total + cartTotal)}</span></div>
          {error && <div className="cart-error"><AlertCircle size={16}/>{error}</div>}
          {sentOrders.length > 0 && <section className="sent-orders"><strong>Histórico da comanda</strong>{sentOrders.map((order) => <div key={order.id}><span><b>Pedido #{String(order.id).padStart(4, "0")}</b><small><Clock3 size={11}/>{time.format(order.sentAt)} · {money.format(order.total)}</small></span><button onClick={() => print(order)} aria-label={`Imprimir pedido ${order.id}`}><Printer size={15}/></button></div>)}</section>}
          <div className="cart-section-label"><span>PRÓXIMO ENVIO</span><b>{itemCount} {itemCount === 1 ? "ITEM" : "ITENS"}</b></div>
          <div className="cart-items">{cart.length === 0 ? <div className="empty-cart"><span><ShoppingBasket size={24}/></span><p>Seu pedido está vazio</p><small>Adicione produtos do cardápio ao lado.</small></div> : cart.map((item) => <div className="cart-item" key={`${item.id}-${item.custom}`}><div className="cart-item-main"><strong>{item.name}{item.custom && <em>AVULSO</em>}</strong><small>{money.format(item.price)} · {item.destination === "KITCHEN" ? "Cozinha" : "Bar"}</small><input className="item-note" value={item.notes ?? ""} onChange={(event) => updateNotes(item.id, item.custom, event.target.value)} aria-label={`Observação de ${item.name}`} placeholder="Adicionar observação"/></div><div className="quantity"><button onClick={() => changeQuantity(item.id, item.custom, -1)} aria-label="Diminuir quantidade">{item.quantity === 1 ? <Trash2 size={13}/> : <Minus size={13}/>}</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, item.custom, 1)} aria-label="Aumentar quantidade"><Plus size={13}/></button></div></div>)}</div>
          <div className="cart-footer"><div><span>Total deste envio</span><strong>{money.format(cartTotal)}</strong></div><button disabled={!cart.length || saving || awaitingPayment} onClick={sendOrder}>{saving ? <LoaderCircle className="spin" size={18}/> : <Send size={18}/>} {saving ? "Enviando..." : "Enviar pedido"}</button><button className="print-button" disabled={!cart.length || saving} onClick={printPreview}><Printer size={17}/> Imprimir prévia</button><button className="finish-button" disabled={saving || cart.length > 0 || (!isAdmin && awaitingPayment)} onClick={checkout}>{cart.length ? "Envie ou remova os itens para fechar" : isAdmin ? "Confirmar pagamento e liberar" : awaitingPayment ? "Aguardando confirmação do caixa" : "Solicitar fechamento"}</button></div>
        </aside>
      </div>

      {cart.length > 0 && <div className="mobile-cart-bar"><span><small>{itemCount} {itemCount === 1 ? "item" : "itens"}</small><strong>{money.format(cartTotal)}</strong></span><button onClick={() => cartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}><ShoppingBasket size={18}/> Ver pedido</button></div>}
      {customOpen && <Modal label="Adicionar item avulso" onClose={() => { setCustomOpen(false); }}><form className="custom-modal" onSubmit={addCustom}><div className="modal-head"><div><span>ITEM AVULSO</span><h2>Adicionar ao pedido</h2></div><button type="button" onClick={() => setCustomOpen(false)} aria-label="Fechar"><X/></button></div><label>Nome do item<input name="name" required placeholder="Ex.: Porção especial" maxLength={80}/></label><div className="form-row"><label>Valor<input name="price" required min="0" step="0.01" type="number" placeholder="0,00"/></label><label>Quantidade<input name="quantity" required min="1" max="99" type="number" defaultValue="1"/></label></div><label>Enviar para<select name="destination" defaultValue="KITCHEN"><option value="KITCHEN">Cozinha</option><option value="BAR">Bar / bebidas</option></select></label><label>Observação<textarea name="notes" placeholder="Opcional" maxLength={180}/></label><div className="modal-actions"><button type="button" onClick={() => setCustomOpen(false)}>Cancelar</button><button type="submit"><Plus size={17}/> Adicionar item</button></div></form></Modal>}
      {printOrder && <section className="print-receipt" aria-hidden="true"><header><strong>SABOM</strong><span>{printOrder.preview ? "PRÉVIA DO PEDIDO" : "PEDIDO"}</span></header><div className="print-meta"><b>MESA {String(params.numero).padStart(2, "0")}</b><span>{table.currentName}</span><span>Pedido #{printOrder.id}</span><span>{printOrder.sentAt.toLocaleString("pt-BR")}</span></div><div className="print-items">{printOrder.items.map((item, index) => <article key={`${item.id}-${index}`}><b>{item.quantity}x {item.name}</b><span>{item.destination === "KITCHEN" ? "COZINHA" : "BAR"} · {money.format(item.price * item.quantity)}</span>{item.notes && <em>Obs.: {item.notes}</em>}</article>)}</div><footer><span>Total</span><strong>{money.format(printOrder.total)}</strong></footer></section>}
    </main>
  );
}
