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

        </section>
    );
}