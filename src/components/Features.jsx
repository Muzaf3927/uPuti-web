export default function Features({ t }) {
    return (
        <section className="features">

            <div className="card">
                <h3>{t.driver}</h3>
                <p>Публикуйте поездку и находите пассажиров.</p>
            </div>

            <div className="card">
                <h3>{t.passenger}</h3>
                <p>Бронируйте поездки и путешествуйте дешевле.</p>
            </div>

            <div className="card">
                <h3>{t.cityTrips}</h3>
                <p>Поездки по городу и между городами.</p>
            </div>

        </section>
    );
}