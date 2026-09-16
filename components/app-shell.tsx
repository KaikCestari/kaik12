"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, ChefHat, ClipboardList, LayoutGrid, LogOut, Settings, UsersRound, MoreHorizontal, X, ArrowUpRight } from "lucide-react";
import { useCurrentUser } from "@/components/use-current-user";

export default function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const { user, logout } = useCurrentUser();
  const [more, setMore] = useState(false);
  const isAdmin = user?.role === "ADMIN";
  const links = [
    { href: "/mesas", label: "Mesas", icon: LayoutGrid, visible: true },
    { href: "/pedidos", label: "Pedidos", icon: ClipboardList, visible: isAdmin },
    { href: "/preparo", label: "Preparo", icon: ChefHat, visible: true },
    { href: "/cardapio", label: "Cardápio", icon: BookOpen, visible: isAdmin },
    { href: "/usuarios", label: "Equipe", icon: UsersRound, visible: isAdmin },
    { href: "/configuracoes", label: "Configurações", icon: Settings, visible: isAdmin },
  ].filter(item => item.visible);
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Pular para o conteúdo</a>
      <aside className="app-sidebar">
        <Link href="/mesas" className="sidebar-brand"><span className="brand-symbol"><ChefHat size={24}/></span><div><b>sabom<span>.</span></b><small>Bom atendimento começa aqui</small></div></Link>
        <p className="sidebar-section-label">Seu restaurante</p>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {links.map(({ href, label, icon: Icon }) => <Link className={active(href) ? "active" : ""} aria-current={active(href) ? "page" : undefined} href={href} key={href}><Icon size={20}/><span>{label}</span>{active(href) && <i/>}</Link>)}
        </nav>
        <div className="sidebar-note"><ChefHat size={24}/><strong>Tudo no seu tempo.</strong><p>Do primeiro pedido à conta fechada, cuide de cada mesa.</p><Link href="/preparo">Ver fila de preparo <ArrowUpRight size={16}/></Link></div>
        <div className="sidebar-user"><div className="sidebar-avatar">{user?.name?.slice(0, 1).toUpperCase() ?? "S"}</div><span><strong>{user?.name ?? "Carregando…"}</strong><small>{isAdmin ? "Administrador" : "Garçom"}</small></span><button onClick={logout} aria-label="Sair do sistema"><LogOut size={18}/></button></div>
      </aside>
      <div className="app-workspace">
        <header className="workspace-bar"><Link href="/mesas" className="mobile-brand"><ChefHat size={22}/><b>sabom.</b></Link><div className="workspace-title">Seu restaurante <span>/</span><strong>{title}</strong></div><div className="workspace-profile"><span className="profile-dot"/>{user?.name ?? "Carregando…"}</div></header>
        <main id="main-content" tabIndex={-1}>{children}</main>
      </div>
      <nav className="mobile-nav" aria-label="Navegação no celular">
        {links.slice(0, isAdmin ? 4 : 2).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={active(href) ? "active" : ""} aria-current={active(href) ? "page" : undefined}><Icon size={21}/><span>{label}</span></Link>)}
        <button onClick={() => setMore(!more)} aria-expanded={more} aria-controls="mobile-more">{more ? <X size={21}/> : <MoreHorizontal size={21}/>}<span>Mais</span></button>
      </nav>
      {more && <div className="mobile-more" id="mobile-more"><strong>{user?.name}</strong>{links.slice(isAdmin ? 4 : 2).map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMore(false)}><Icon size={19}/>{label}</Link>)}<button onClick={logout}><LogOut size={19}/>Sair do sistema</button><button onClick={() => setMore(false)}><X size={19}/>Fechar menu</button></div>}
    </div>
  );
}
