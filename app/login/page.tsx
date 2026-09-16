"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, ChefHat, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) {
        setError(result?.message ?? "Não foi possível entrar no sistema.");
        return;
      }
      window.location.assign("/mesas");
    } catch {
      setError("Não foi possível conectar ao sistema. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story"><div className="story-brand"><ChefHat size={30}/><b>sabom.</b></div><div className="story-copy"><span>Feito para quem serve bem.</span><h1>Mais atenção à mesa.<br/>Menos trabalho na gestão.</h1><p>Pedidos, cozinha e caixa no mesmo ritmo. Tudo o que sua equipe precisa para um bom atendimento.</p></div><div className="table-illustration" aria-hidden="true"><div className="illustration-plate"><div/><span>bom<br/>apetite.</span></div><div className="illustration-glass"/><div className="illustration-fork"/><div className="illustration-knife"/><span className="illustration-ticket">Mesa 08<br/><b>Um bom momento<br/>começa aqui.</b><i/></span></div><div className="story-footer"><span>Do salão à cozinha.</span><span>Simples assim.</span></div></section>
      <section className="login-window">
        <header className="login-titlebar"><div className="login-brand"><ChefHat size={23}/><b>sabom.</b></div><span>Seu restaurante, em boas mãos.</span></header>
        <form className="login-form" onSubmit={login}>
          <div className="login-heading"><span className="login-mark"><ChefHat size={27}/></span><h1>Bom ter você aqui.</h1><p>Entre com seu usuário e senha para iniciar o atendimento.</p></div>
          <div className="login-fields">
            <label htmlFor="username">Usuário</label>
            <div className="input-box"><UserRound size={18} /><input id="username" name="username" autoComplete="username" required autoFocus value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Digite seu usuário" /></div>
            <label htmlFor="password">Senha</label>
            <div className="input-box"><LockKeyhole size={18} /><input id="password" name="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} type={visible ? "text" : "password"} placeholder="Digite sua senha" /><button type="button" onClick={() => setVisible(!visible)} aria-label="Mostrar ou ocultar senha">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          </div>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button className="login-submit" type="submit" disabled={loading}><span>{loading ? "Entrando..." : "Entrar no restaurante"}</span><ArrowRight size={18} /></button>
        </form>
        <footer className="login-footer"><LockKeyhole size={15}/><span>Precisa de acesso? Fale com o administrador.</span></footer>
      </section>
    </main>
  );
}
