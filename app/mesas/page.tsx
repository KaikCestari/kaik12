"use client";

import Link from "next/link";
import { AlertCircle, Clock3, LoaderCircle, ReceiptText, RefreshCw, Utensils, Search, ArrowUpRight, Wallet, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import { useCurrentUser } from "@/components/use-current-user";
import WaiterTables from "@/components/waiter-tables";
import type { TableSummary } from "@/lib/tables";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function MesasPage() {
  const { user } = useCurrentUser();
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/tables", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível carregar as mesas.");
      setTables(data.tables);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar as mesas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => load(true), 15000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [load]);

  const summary = useMemo(() => ({
    available: tables.filter((table) => table.status === "AVAILABLE").length,
    occupied: tables.filter((table) => table.status === "OCCUPIED").length,
    payment: tables.filter((table) => table.status === "AWAITING_PAYMENT").length,
  }), [tables]);

  const visibleTables = tables.filter(table => (filter === "ALL" || table.status === filter) && `${table.number} ${String(table.number).padStart(2, "0")} ${table.currentName ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")));
  const paymentTables = tables.filter(table => table.status === "AWAITING_PAYMENT");

  if (!user) return <AppShell title="Atendimento"><div className="page-loading"><LoaderCircle className="spin"/><span>Carregando atendimento...</span></div></AppShell>;

  if (user.role === "WAITER") return (
    <AppShell title="Registrar mesa">
      {error && <div className="content-error" role="alert"><AlertCircle size={18}/><span>{error}</span><button onClick={() => load()}>Tentar novamente</button></div>}
      <WaiterTables tables={tables} loading={loading}/>
    </AppShell>
  );

  return (
    <AppShell title="Visão do salão">
      <div className="dashboard-body">
        <section className="page-head">
          <div><p className="eyebrow">Cada mesa, bem atendida</p><h1>Vamos abrir o salão?</h1><p>Seus atendimentos organizados, do pedido à conta.</p></div>
          <button className="secondary-button" onClick={() => load(true)} disabled={refreshing}><RefreshCw className={refreshing ? "spin" : ""} size={17} /> Atualizar</button>
        </section>

        <section className="summary" aria-label="Resumo das mesas">
          <div><span>Total de mesas</span><strong>{loading ? "—" : tables.length}</strong><small>cadastradas</small></div>
          <div><span>Disponíveis</span><strong className="green">{loading ? "—" : summary.available}</strong><small>prontas para abrir</small></div>
          <div><span>Em atendimento</span><strong className="blue">{loading ? "—" : summary.occupied}</strong><small>comandas abertas</small></div>
          <div><span>No caixa</span><strong className="amber">{loading ? "—" : summary.payment}</strong><small>aguardando pagamento</small></div>
        </section>

        <div className="salon-layout"><div className="salon-main">
        <div className="section-toolbar"><div><h2>Suas mesas</h2><span>{tables.length} no salão</span></div><label className="orders-search"><Search size={18}/><input aria-label="Buscar mesa ou cliente" value={search} onChange={e => setSearch(e.target.value)} placeholder="Mesa ou nome do cliente"/></label></div>
        <div className="filter-tabs table-filters" aria-label="Filtrar mesas">{[["ALL", "Todas", tables.length], ["AVAILABLE", "Livres", summary.available], ["OCCUPIED", "Em atendimento", summary.occupied], ["AWAITING_PAYMENT", "No caixa", summary.payment]].map(([value, label, count]) => <button key={value} aria-pressed={filter === value} className={filter === value ? "active" : ""} onClick={() => setFilter(String(value))}>{label}<span>{count}</span></button>)}</div>

        {error && <div className="content-error"><AlertCircle size={18} /><span>{error}</span><button onClick={() => load()}>Tentar novamente</button></div>}
        {loading ? <div className="page-loading"><LoaderCircle className="spin" /><span>Carregando salão...</span></div> : (
          <section className="tables-grid" aria-label="Mesas do salão">
            {!visibleTables.length && <div className="orders-empty"><Search/><strong>Nenhuma mesa encontrada</strong><span>{tables.length ? "Tente outro nome ou altere o filtro." : "As mesas cadastradas aparecerão aqui."}</span>{tables.length > 0 && <button className="secondary-button" onClick={() => { setSearch(""); setFilter("ALL"); }}>Limpar filtros</button>}</div>}
            {visibleTables.map((table) => {
              const available = table.status === "AVAILABLE";
              const statusClass = table.status === "OCCUPIED" ? "ocupada" : table.status === "AWAITING_PAYMENT" ? "pagamento" : "disponivel";
              return (
                <Link className={`table-card ${statusClass}`} href={`/mesas/${table.number}`} key={table.id}>
                  <div className="table-top"><span>Mesa</span><strong>{String(table.number).padStart(2, "0")}</strong><i className={`dot ${available ? "available" : table.status === "OCCUPIED" ? "busy" : "payment"}`} /></div>
                  {available ? (
                    <div className="empty-table"><span><Utensils size={24} /></span><p>Mesa livre</p><small>Pronta para receber</small></div>
                  ) : (
                    <div className="table-info">
                      <h3>{table.currentName}</h3>
                      <p><ReceiptText size={14} /> {table.orderCount} {table.orderCount === 1 ? "envio" : "envios"}</p>
                      <div><span>Total da comanda</span><strong>{money.format(table.total)}</strong></div>
                      <small><Clock3 size={13} /> {table.status === "AWAITING_PAYMENT" ? "Aguardando caixa" : "Em atendimento"}</small>
                    </div>
                  )}
                  <span className="table-action">{available ? "Abrir mesa" : "Ver comanda"}<ArrowUpRight size={17}/></span>
                </Link>
              );
            })}
          </section>
        )}
        </div><aside className="payment-panel"><div className="payment-panel-title"><span><Wallet size={19}/></span><h2>Prontas para fechar</h2><b>{paymentTables.length}</b></div><p>Comandas aguardando pagamento.</p>{paymentTables.length ? paymentTables.map(table => <Link className="payment-item" key={table.id} href={`/mesas/${table.number}`}><span className="payment-number">{String(table.number).padStart(2, "0")}</span><span><strong>{table.currentName}</strong><small>{money.format(table.total)}</small></span><ArrowUpRight size={17}/></Link>) : <div className="payment-empty"><ReceiptText size={32}/><strong>Tudo em dia por aqui</strong><p>Quando uma mesa pedir a conta, ela aparece aqui.</p></div>}<div className="salon-tip"><Plus size={18}/><p><strong>Um novo atendimento?</strong>Toque em uma mesa livre para abrir a comanda.</p></div></aside></div>
      </div>
    </AppShell>
  );
}
