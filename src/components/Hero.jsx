import { trackDownload } from "../api/public";

export default function Hero({ t }) {

    const TELEGRAM_URL = "https://t.me/uputi_support?text=Здравствуйте! Хочу скачать приложение UPuti";

    return (
        <section className="hero">

            <h1>{t.heroTitle}</h1>

            <p className="hero-desc">
                {t.heroDesc}
            </p>

            <div className="hero-store">
                <div className="hero-store-buttons">
                    <div className="store-card">
                        <img className="store-card__logo" src="/yulchi.png" alt="Yulchi" />
                        <span className="store-card__arrow">↓</span>
                        <a
                            className="store"
                            href="https://play.google.com/store/apps/details?id=com.yulchi.yulchi"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackDownload("android")}
                            aria-label={t.androidDownload}
                        >
                            <img src="/google_play.svg" alt={t.androidDownload} />
                        </a>
                    </div>

                    <div className="store-card">
                        <img className="store-card__logo" src="/logo.png" alt="UPuti" />
                        <span className="store-card__arrow">↓</span>
                        <a
                            className="store"
                            href="https://apps.apple.com/uz/app/uputi/id6753739028"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackDownload("ios")}
                            aria-label={t.iosDownload}
                        >
                            <img src="/app_store.svg" alt={t.iosDownload} />
                        </a>
                    </div>
                </div>
            </div>

            <div className="hero-store-note">
                {t.storeDownloads}
            </div>

            <a
                href="https://www.instagram.com/uputi_net?igsh=aTBjY3VnazZtdWds&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-instagram"
                aria-label={t.instagramLabel}
            >
                <span className="hero-instagram__glow"></span>
                <span className="hero-instagram__inner">
                    <span className="hero-instagram__icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                    </span>
                    <span className="hero-instagram__divider"></span>
                    <span className="hero-instagram__text">
                        <span className="hero-instagram__handle">Instagram</span>
                        <span className="hero-instagram__subscribe">{t.instagramSubscribe || "Bonuslar yanada ko'proq"}</span>
                    </span>
                    <span className="hero-instagram__arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </span>
                    <span className="hero-instagram__shimmer"></span>
                </span>
            </a>

        </section>
    );
}