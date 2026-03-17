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
                <div className="hero-play-warning" role="note">
                    <div className="hero-play-warning__title">{t.playNoticeTitle}</div>
                    <div className="hero-play-warning__text">
                        <p>{t.playNoticeP1}</p>
                        <p>
                            {t.playNoticeP2Prefix}{" "}
                            <a
                                href={TELEGRAM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackDownload("telegram")}
                            >
                                {t.playNoticeLinkText}
                            </a>
                        </p>

                        <p>{t.playNoticeSafety}</p>
                        <p>{t.playNoticeThanks}</p>
                    </div>
                </div>

                <div className="hero-store-buttons">
                    {/* 🔥 Android теперь ведет в Telegram */}
                    <a
                        className="store"
                        href={TELEGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackDownload("telegram")}
                        aria-label={t.androidDownload}
                    >
                        <img src="/google_play.svg" alt={t.androidDownload} />
                    </a>

                    {/* 🔥 iOS тоже в Telegram (если хочешь можешь оставить App Store) */}
                    <a
                        className="store"
                        href={TELEGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackDownload("telegram")}
                        aria-label={t.iosDownload}
                    >
                        <img src="/app_store.svg" alt={t.iosDownload} />
                    </a>
                </div>
            </div>

            <div className="hero-store-note">
                {t.storeDownloads}
            </div>

        </section>
    );
}