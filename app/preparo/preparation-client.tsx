"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/app-shell";
type Item = { id: number; order_id: number; name: string; quantity: number; destination: string; notes: string | null; preparation_status: string; sent_at: string; table_name: string | null; table_number: number };
const stages = [{ key: "PENDING", label: "Pendentes", action: "Iniciar preparo" }, { key: "PREPARING", label: "Preparando", action: "Marcar pronto" }, { key: "READY", label: "Prontos", action: "Confirmar entrega" }];
export default function PreparationClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [destination, setDestination] = useState("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const version = useRef(0);
  const load = useCallback(async () => {
    const current = ++version.current;
    try {
      const response = await fetch("/api/preparation", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (version.current === current) { setItems(data.items); setError(""); }
    } catch (e) { if (version.current === current) setError(e instanceof Error ? e.message : "Falha ao carregar."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const timer = window.setInterval(() => void load(), 10000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [load]);
  async function advance(item: Item) {
    setBusy(item.id); setError("");
    try {
      const response = await fetch("/api/preparation", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, expected: item.preparation_status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao atualizar."); }
    finally { await load(); setBusy(null); }
  }
  return <AppShell title="Preparo"><div className="dashboard-body">
    <section className="page-head"><div><p className="eyebrow">Cada pedido no ponto certo</p><h1>Preparo dos pedidos</h1><p>Fila por ordem de chegada, atualizada a cada 10 segundos.</p></div><label>Destino<select value={destination} onChange={e => setDestination(e.target.value)}><option value="ALL">Todos</option><option value="KITCHEN">Cozinha</option><option value="BAR">Bar</option></select></label></section>
    {error && <div className="content-error" role="alert">{error}<button onClick={() => { setError(""); void load(); }}>Atualizar</button></div>}
    {loading ? <p>Carregando fila...</p> : <div className="preparation-board">{stages.map(stage => {
      const visible = items.filter(i => i.preparation_status === stage.key && (destination === "ALL" || i.destination === destination));
      return <section key={stage.key}><h2>{stage.label} <small>({visible.length})</small></h2>{!visible.length && <p className="queue-empty">Nenhum item nesta etapa.</p>}{visible.map(item => <article className="operation-card" key={item.id}><small>Mesa {item.table_number} · Pedido #{item.order_id} · {item.destination === "BAR" ? "Bar" : "Cozinha"}</small><h3>{item.quantity}× {item.name}</h3>{item.table_name && <p>{item.table_name}</p>}{item.notes && <p className="preparation-notes">{item.notes}</p>}<p>Enviado em {new Date(item.sent_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p><button className="primary-button" disabled={busy !== null} onClick={() => advance(item)}>{busy === item.id ? "Atualizando..." : stage.action}</button></article>)}</section>;
    })}</div>}
  </div></AppShell>;
}
