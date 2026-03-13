import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogout, clearAdminToken, getAdminToken } from "./api";
import { adminTranslations } from "./adminTranslations";

export default function AdminLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [activeSection, setActiveSection] = useState("commissions");
    const [lang, setLang] = useState("uz");
    const t = adminTranslations[lang];
    const navigate = useNavigate();

    const handleLogout = async () => {
        const token = getAdminToken();
        try {
            await adminLogout(token);
        } catch (e) {
            // игнорируем ошибку, просто чистим токен
        }
        clearAdminToken();
        navigate("/admin", { replace: true });
    };

    return (
        <div className="admin-shell">
            <aside className={`admin-sidebar ${collapsed ? "admin-sidebar--collapsed" : ""}`}>
                <div className="admin-sidebar__top">
                    <div className="admin-logo">
                        <img src="/logo.png" alt="UPuti" />
                        {!collapsed && <span>{t.sidebarTitle}</span>}
                    </div>
                    <button
                        type="button"
                        className="admin-sidebar__toggle"
                        onClick={() => setCollapsed((v) => !v)}
                    >
                        {collapsed ? "›" : "‹"}
                    </button>
                </div>

                <nav className="admin-nav">
                    <button
                        type="button"
                        className={`admin-nav__item ${activeSection === "commissions" ? "admin-nav__item--active" : ""}`}
                        onClick={() => setActiveSection("commissions")}
                    >
                        {t.navCommissions}
                    </button>
                    <button
                        type="button"
                        className={`admin-nav__item ${activeSection === "users" ? "admin-nav__item--active" : ""}`}
                        onClick={() => setActiveSection("users")}
                    >
                        {t.navUsers}
                    </button>
                    <button
                        type="button"
                        className={`admin-nav__item ${activeSection === "messages" ? "admin-nav__item--active" : ""}`}
                        onClick={() => setActiveSection("messages")}
                    >
                        {t.navMessages}
                    </button>
                    <div className="admin-lang">
                        <button
                            type="button"
                            className={lang === "ru" ? "active" : ""}
                            onClick={() => setLang("ru")}
                        >
                            RU
                        </button>
                        <button
                            type="button"
                            className={lang === "uz" ? "active" : ""}
                            onClick={() => setLang("uz")}
                        >
                            UZ
                        </button>
                    </div>
                    <button type="button" className="admin-nav__item admin-nav__logout" onClick={handleLogout}>
                        {t.navLogout}
                    </button>
                </nav>
            </aside>

            <main className="admin-main">
                {typeof children === "function" ? children({ lang, t, activeSection }) : children}
            </main>
        </div>
    );
}

