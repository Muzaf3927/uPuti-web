export default function TextContent({ t }) {
    return (
        <section className="text-content">
            <div className="text-content__container">
                <p className="text-content__intro">{t.aboutText}</p>

                <div className="text-content__columns">
                    <div className="text-content__col text-content__col--driver">
                        <h2>{t.driverTitle}</h2>
                        <p>{t.driverDesc}</p>
                    </div>
                    <div className="text-content__col text-content__col--passenger">
                        <h2>{t.passengerTitle}</h2>
                        <p>{t.passengerDesc}</p>
                    </div>
                </div>

                <div className="text-content__full">
                    <h2>{t.tripsTitle}</h2>
                    <p>{t.tripsIntro}</p>
                    <ul>
                        {t.tripsList.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>

                    <h2>{t.benefitsTitle}</h2>
                    <ul>
                        {t.benefitsList.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}