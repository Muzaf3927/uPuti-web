import { trackDownload } from "../api/public";

export default function Hero({ t }) {

    const handleAndroidClick = () => {
        trackDownload("android");
        // здесь позже можно открыть Google Play
    };

    const handleIosClick = () => {
        trackDownload("ios");
        // здесь позже можно открыть App Store
    };

    return (
        <section className="hero">

            <h1>{t.heroTitle}</h1>

            <p className="hero-desc">
                {t.heroDesc}
            </p>

            <div className="hero-store-buttons">

                <button type="button" className="store" onClick={handleAndroidClick}>
                    <img src="/google_play.svg" />
                </button>

                <button type="button" className="store" onClick={handleIosClick}>
                    <img src="/app_store.svg" />
                </button>

            </div>

            <div className="hero-store-note">
                {t.storeDownloads}
            </div>

        </section>
    );
}