"use client";
import Modal from "@/components/modal";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertCircle, LoaderCircle, Plus, ShieldCheck, UserRound, X } from "lucide-react";
import AppShell from "@/components/app-shell";

type User = { id: number; name: string; username: string; role: "ADMIN" | "WAITER"; active: number };

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível carregar a equipe.");
      setUsers(data.users ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar a equipe.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initial);
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Não foi possível criar o acesso.");
      form.reset();
      setOpen(false);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível criar o acesso.");
    } finally { setSaving(false); }
  }

  return (
    <AppShell title="Equipe">
      <div className="dashboard-body">
        <section className="page-head">
          <div><p className="eyebrow">Quem faz acontecer</p><h1>Equipe</h1><p>Gerencie quem pode acessar o sistema e os níveis de permissão.</p></div>
          <button className="primary-button" onClick={() => { setError(""); setOpen(true); }}><Plus size={18}/> Novo usuário</button>
        </section>
        {error && !open && <div className="content-error"><AlertCircle size={18}/><span>{error}</span><button onClick={load}>Tentar novamente</button></div>}
        {loading ? <div className="page-loading"><LoaderCircle className="spin"/><span>Carregando equipe...</span></div> : (
          <section className="users-list">
            <header><span>Usuário</span><span>Perfil</span><span>Status</span></header>
            {users.map((user) => <article key={user.id}><div className={`user-avatar ${user.role.toLowerCase()}`}>{user.role === "ADMIN" ? <ShieldCheck/> : <UserRound/>}</div><div><strong>{user.name}</strong><span>@{user.username}</span></div><em>{user.role === "ADMIN" ? "Administrador" : "Garçom"}</em><i className="status-active"><b/>{user.active ? "Ativo" : "Inativo"}</i></article>)}
          </section>
        )}
      </div>
      {open && <Modal label="Cadastrar usuário" onClose={() => { if (!saving) setOpen(false); }}><form className="custom-modal" onSubmit={create}>
        <div className="modal-head"><div><span>Novo acesso</span><h2>Cadastrar usuário</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar"><X/></button></div>
        <label>Nome completo<input name="name" required placeholder="Nome do colaborador"/></label>
        <label>Usuário<input name="username" required autoComplete="off" placeholder="usuario.acesso"/></label>
        <div className="form-row"><label>Senha<input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required placeholder="Mínimo de 12 caracteres"/></label><label>Perfil<select name="role" defaultValue="WAITER"><option value="WAITER">Garçom</option><option value="ADMIN">Administrador</option></select></label></div>
        {error && <div className="login-error">{error}</div>}
        <div className="modal-actions"><button type="button" onClick={() => setOpen(false)}>Cancelar</button><button type="submit" disabled={saving}>{saving ? "Criando..." : "Criar acesso"}</button></div>
      </form></Modal>}
    </AppShell>
  );
}
