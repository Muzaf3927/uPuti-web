export default function CTA({ t }) {
    return (
        <section className="cta">

            <h2>{t.ctaTitle}</h2>

            <p>{t.ctaDesc}</p>

            <div className="cta-stats">
                <div className="cta-stat">
                    <div className="cta-stat__value">{t.statsUsers}</div>
                    <div className="cta-stat__label">по всему Узбекистану</div>
                </div>
                <div className="cta-stat">
                    <div className="cta-stat__value">{t.statsTrips}</div>
                    <div className="cta-stat__label">каждый день</div>
                </div>
            </div>

        </section>
    );
}