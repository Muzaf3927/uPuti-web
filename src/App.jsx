import { useState } from "react";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TextContent from "./components/TextContent";
import CTA from "./components/CTA";
import Support from "./components/Support";

import { translations } from "./i18n/translations";

export default function App() {

    const [lang, setLang] = useState("ru");

    const t = translations[lang];

    return (
        <div>

            <Navbar lang={lang} setLang={setLang} t={t} />

            <Hero t={t} />
            <TextContent t={t} />
            <CTA t={t} />
            <Support t={t} />

        </div>
    );
}