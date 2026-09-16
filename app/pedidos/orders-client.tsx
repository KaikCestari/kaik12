"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, ReceiptText, RefreshCw, Search, WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import type { NightOrder, NightOrderStatus } from "@/lib/orders";

type Filter = "ALL" | NightOrderStatus;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function parseDate(value: string) {
  return new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<NightOrder[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível carregar os pedidos.");
      setOrders(data.orders);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar os pedidos.");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(true), 15000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [load]);

  const totals = useMemo(() => ({
    all: orders.reduce((sum, order) => sum + order.total, 0),
    unpaid: orders.filter((order) => order.status === "UNPAID").reduce((sum, order) => sum + order.total, 0),
    paid: orders.filter((order) => order.status === "PAID").reduce((sum, order) => sum + order.total, 0),
  }), [orders]);

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return orders.filter((order) => (filter === "ALL" || order.status === filter) && (!term || `${order.tableNumber} ${order.tableName} ${order.createdBy}`.toLocaleLowerCase("pt-BR").includes(term)));
  }, [filter, orders, search]);

  return (
    <AppShell title="Pedidos do turno">
      <div className="dashboard-body">
        <section className="page-head"><div><p className="eyebrow">O movimento do seu restaurante</p><h1>Pedidos do turno</h1><p>Acompanhe comandas abertas e pagamentos em uma única tela.</p></div><button className="secondary-button" onClick={() => load(true)} disabled={refreshing}><RefreshCw className={refreshing ? "spin" : ""} size={17}/>Atualizar</button></section>

        <section className="orders-summary">
          <article><span><ReceiptText size={17}/>Movimento total</span><strong>{money.format(totals.all)}</strong><small>{orders.length} {orders.length === 1 ? "comanda" : "comandas"}</small></article>
          <article className="unpaid"><span><Clock3 size={17}/>Não pago</span><strong>{money.format(totals.unpaid)}</strong><small>{orders.filter((order) => order.status === "UNPAID").length} em aberto</small></article>
          <article className="paid"><span><CheckCircle2 size={17}/>Pago</span><strong>{money.format(totals.paid)}</strong><small>{orders.filter((order) => order.status === "PAID").length} finalizadas</small></article>
        </section>

        <div className="orders-toolbar">
          <div className="filter-tabs">{([['ALL','Todos'],['UNPAID','Não pagos'],['PAID','Pagos']] as const).map(([value, label]) => <button aria-pressed={filter === value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)} key={value}>{label}<span>{value === "ALL" ? orders.length : orders.filter((order) => order.status === value).length}</span></button>)}</div>
          <label className="orders-search"><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar mesa ou cliente" placeholder="Buscar mesa ou cliente..."/></label>
        </div>

        {error && <div className="content-error"><AlertCircle size={18}/><span>{error}</span><button onClick={() => load()}>Tentar novamente</button></div>}
        {loading ? <div className="page-loading"><LoaderCircle className="spin"/><span>Carregando pedidos...</span></div> : visibleOrders.length === 0 ? <div className="orders-empty"><WalletCards/><strong>Nenhum pedido encontrado</strong><span>Os pedidos enviados neste turno aparecerão aqui.</span></div> : (
          <section className="orders-table">
            <header><span>Comanda</span><span>Horário</span><span>Atendimento</span><span>Itens</span><span>Valor</span><span>Status</span><span/></header>
            {visibleOrders.map((order) => <article key={`${order.id}-${order.closedAt ?? "open"}`}><div className="order-identification"><b>{String(order.tableNumber).padStart(2, "0")}</b><span><strong>Mesa {order.tableNumber} · {order.tableName}</strong><small>{order.orderCount} {order.orderCount === 1 ? "envio" : "envios"}</small></span></div><time>{time.format(parseDate(order.lastSentAt))}</time><span className="order-operator">{order.createdBy}</span><span>{order.itemCount}</span><strong className="order-value">{money.format(order.total)}</strong><span className={`payment-badge ${order.status.toLowerCase()}`}><i/>{order.status === "PAID" ? "Pago" : "Não pago"}</span>{order.status === "UNPAID" ? <Link href={`/mesas/${order.tableNumber}`}>{order.tableStatus === "AWAITING_PAYMENT" ? "Receber" : "Abrir"}</Link> : <span className="order-done"><CheckCircle2 size={16}/></span>}</article>)}
          </section>
        )}
      </div>
    </AppShell>
  );
}
