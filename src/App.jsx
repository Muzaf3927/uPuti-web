import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TextContent from "./components/TextContent";
import CTA from "./components/CTA";
import Support from "./components/Support";

import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";

import { translations } from "./i18n/translations";

function PublicLanding() {
    const [lang, setLang] = useState("uz");
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

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<PublicLanding />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/panel" element={<AdminDashboard />} />
        </Routes>
    );
}