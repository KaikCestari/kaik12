"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, ReceiptText } from "lucide-react";
import type { TableSummary } from "@/lib/tables";

export default function WaiterTables({ tables, loading }: { tables: TableSummary[]; loading: boolean }) {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = tables.find((table) => String(table.number) === number);
  const occupied = selected && selected.status !== "AVAILABLE";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || saving) return;
    if (occupied) { router.push(`/mesas/${selected.number}`); return; }
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/tables/${selected.number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível registrar a mesa.");
      router.push(`/mesas/${selected.number}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível conectar. Tente novamente.");
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-body waiter-body">
      <section className="page-head"><div><h1>Registrar mesa</h1><p>Escolha a mesa e informe o nome para começar.</p></div></section>
      <form className="waiter-form" onSubmit={submit} aria-busy={saving}>
        <label htmlFor="waiter-table">Número da mesa</label>
        <select id="waiter-table" required value={number} disabled={loading || saving} onChange={(event) => { setNumber(event.target.value); setError(""); }}>
          <option value="">{loading ? "Carregando mesas..." : "Selecione o número"}</option>
          {tables.map((table) => <option key={table.id} value={table.number}>Mesa {String(table.number).padStart(2, "0")}{table.status !== "AVAILABLE" ? ` · ${table.currentName} · ${table.status === "AWAITING_PAYMENT" ? "No caixa" : "Em atendimento"}` : " · Livre"}</option>)}
        </select>
        {occupied ? (
          <div className="waiter-current" role="status"><ReceiptText size={20}/><div><strong>{selected.currentName}</strong><p>{selected.status === "AWAITING_PAYMENT" ? "Esta comanda está aguardando o caixa." : "Esta mesa já está aberta. Continue o atendimento."}</p></div></div>
        ) : (
          <><label htmlFor="waiter-name">Nome da comanda</label><input id="waiter-name" required maxLength={60} value={name} disabled={saving} onChange={(event) => setName(event.target.value)} placeholder="Ex.: João, família Silva..." /></>
        )}
        {error && <div className="login-error" role="alert">{error}</div>}
        <button className="primary-button" disabled={loading || saving || !selected || (!occupied && !name.trim())}>{saving ? <LoaderCircle size={18} className="spin"/> : <ArrowRight size={18}/>} {saving ? "Registrando..." : occupied ? "Acessar comanda" : "Registrar e fazer pedido"}</button>
        {!occupied && <p className="waiter-hint">Ao registrar, a mesa aparece no salão do administrador.</p>}
        {!loading && tables.length === 0 && <p role="status">Nenhuma mesa disponível no sistema. Solicite ajuda ao administrador.</p>}
      </form>
    </div>
  );
}
