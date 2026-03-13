export default function Hero({ t }) {
    return (
        <section className="hero">

            <h1>{t.heroTitle}</h1>

            <p className="hero-desc">
                {t.heroDesc}
            </p>

            <div className="hero-store-buttons">

                <a className="store">
                    <img src="/google_play.svg" />
                </a>

                <a className="store">
                    <img src="/app_store.svg" />
                </a>

            </div>

            <div className="hero-store-note">
                {t.storeDownloads}
            </div>

        </section>
    );
}