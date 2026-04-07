import { useState, useEffect } from "react";

export default function Navbar({ lang, setLang, t }) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>

            <div className="logo">
                <img src="/yulchi.png" alt="Yulchi" />
                <span className="logo__text">Yulchi</span>
            </div>

            <div className="lang">

                <button
                    onClick={() => setLang("ru")}
                    className={lang === "ru" ? "active" : ""}
                >
                    RU
                </button>

                <button
                    onClick={() => setLang("uz")}
                    className={lang === "uz" ? "active" : ""}
                >
                    UZ
                </button>

                <button
                    type="button"
                    className="nav-support-btn"
                    onClick={() => window.dispatchEvent(new Event("open-support"))}
                    aria-label={t.support}
                >
                    <span className="nav-support-btn__icon">📞</span>
                </button>

            </div>

        </nav>
    );
}