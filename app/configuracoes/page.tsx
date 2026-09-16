import { BookOpen, ShieldCheck, Smartphone, UsersRound } from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  await requireUser("ADMIN");
  return <AppShell title="Configurações"><div className="dashboard-body narrow">
    <section className="page-head"><div><p className="eyebrow">Tudo pronto para atender</p><h1>Seu restaurante</h1><p>Organize os acessos e saiba como usar o Sabom no dia a dia.</p></div></section>
    <section className="settings-grid">
      <header><span>Preferências e acesso</span></header>
      <article><span className="setting-icon"><BookOpen/></span><div><strong>Cardápio do restaurante</strong><p>Cadastre produtos, ajuste preços e escolha o que está disponível para pedir.</p></div><Link className="secondary-button" href="/cardapio">Gerenciar</Link></article>
      <article><span className="setting-icon"><UsersRound/></span><div><strong>Acessos da equipe</strong><p>Administradores gerenciam o restaurante. Garçons abrem mesas, enviam pedidos e solicitam o fechamento.</p></div><Link className="secondary-button" href="/usuarios">Ver equipe</Link></article>
      <article><span className="setting-icon"><Smartphone/></span><div><strong>Sabom na tela inicial</strong><p>No celular, abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”. No iPhone, a opção fica em Compartilhar no Safari.</p></div></article>
      <article><span className="setting-icon"><ShieldCheck/></span><div><strong>Sua conta</strong><p>Use seu próprio acesso para identificar quem enviou cada pedido. Ao terminar o turno, escolha “Sair do sistema”. No celular, essa opção fica no menu “Mais”.</p></div></article>
    </section>
  </div></AppShell>;
}
