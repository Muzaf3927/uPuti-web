export default function Users({ t }) {
    return (
        <section className="users">

            <div className="container grid">

                <div className="card">
                    <h3>{t.driverTitle}</h3>
                    <p>{t.driverDesc}</p>
                </div>

                <div className="card">
                    <h3>{t.passengerTitle}</h3>
                    <p>{t.passengerDesc}</p>
                </div>

            </div>

        </section>
    );
}