import { trackDownload } from "../api/public";

export default function Hero({ t }) {

    const APK_URL = "/apk/app-release.apk";
    const IOS_URL = "https://apps.apple.com/uz/app/uputi/id6753739028";

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
                            <a href={APK_URL} download="UPuti.apk" onClick={() => trackDownload("android")}>
                                {t.playNoticeLinkText}
                            </a>
                        </p>
                        <p>{t.playNoticeSafety}</p>
                        <p>{t.playNoticeThanks}</p>
                    </div>
                </div>

                <div className="hero-store-buttons">
                    <a
                        className="store"
                        href={APK_URL}
                        download="UPuti.apk"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackDownload("android")}
                        aria-label={t.androidDownload}
                    >
                        <img src="/google_play.svg" alt={t.androidDownload} />
                    </a>

                    <a
                        className="store"
                        href={IOS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackDownload("ios")}
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