import { useState } from "react";
import { HeartPulse, Languages, Menu, Moon, Sun, X } from "lucide-react";
import { useApp } from "../contexts/AppContext";

export function Header({ onLogin }: { onLogin: () => void }) {
  const { language, theme, toggleLanguage, toggleTheme, dir } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const ar = language === "ar";
  const close = () => setMenuOpen(false);

  return <header className="landing-nav landing-nav-v4" dir={dir}>
    <div className="landing-nav__inner">
      <a href="#top" className="brand-lockup" onClick={close}>
        <span className="brand-mark"><HeartPulse /></span><div><strong>سلامتك</strong><small>{ar ? "رعايتك أقرب" : "Care, closer"}</small></div>
      </a>
      <nav className={menuOpen ? "landing-links is-open" : "landing-links"}>
        <a href="#services" onClick={close}>{ar ? "الخدمات" : "Services"}</a>
        <a href="#how" onClick={close}>{ar ? "كيف تعمل؟" : "How it works"}</a>
        <button className="mobile-login" onClick={onLogin}>{ar ? "تسجيل الدخول" : "Sign in"}</button>
      </nav>
      <div className="nav-actions">
        <button className="icon-action nav-language" onClick={toggleLanguage}><Languages /><span>{ar ? "EN" : "عربي"}</span></button>
        <button className="icon-action icon-action--square" onClick={toggleTheme}>{theme === "light" ? <Moon /> : <Sun />}</button>
        <button className="nav-login" onClick={onLogin}>{ar ? "تسجيل الدخول" : "Sign in"}</button>
        <button className="menu-toggle" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
    </div>
  </header>;
}
