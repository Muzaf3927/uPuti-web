import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    adminLogin,
    adminRegister,
    saveAdminToken,
    getAdminToken,
} from "./api";
import { adminTranslations } from "./adminTranslations";

export default function AdminLogin() {
    const navigate = useNavigate();

    const [lang, setLang] = useState("uz");
    const t = adminTranslations[lang];

    const [mode, setMode] = useState("login"); // 'login' | 'register'
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [secret, setSecret] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const token = getAdminToken();
        if (token) {
            navigate("/admin/panel", { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const cleanPhone = phone.replace(/\D/g, "");

            if (mode === "register") {
                await adminRegister({
                    phone: cleanPhone,
                    password,
                    secret,
                });
                setSuccess("Админ успешно создан. Теперь можно войти.");
                setMode("login");
            } else {
                const data = await adminLogin({
                    phone: cleanPhone,
                    password,
                });
                if (data.access_token) {
                    saveAdminToken(data.access_token);
                }
                navigate("/admin/panel", { replace: true });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode((prev) => (prev === "login" ? "register" : "login"));
        setError("");
        setSuccess("");
    };

    return (
        <div className="admin-auth">
            <div className="admin-auth__card">
                <h1>{t.appTitle}</h1>
                <p>{mode === "login" ? t.authSubtitleLogin : t.authSubtitleRegister}</p>

                <div className="admin-auth__tabs">
                    <button
                        type="button"
                        className={mode === "login" ? "active" : ""}
                        onClick={() => setMode("login")}
                    >
                        {t.authTabLogin}
                    </button>
                    <button
                        type="button"
                        className={mode === "register" ? "active" : ""}
                        onClick={() => setMode("register")}
                    >
                        {t.authTabRegister}
                    </button>
                </div>

                <div className="admin-lang admin-lang--auth">
                    <button
                        type="button"
                        className={lang === "ru" ? "active" : ""}
                        onClick={() => setLang("ru")}
                    >
                        RU
                    </button>
                    <button
                        type="button"
                        className={lang === "uz" ? "active" : ""}
                        onClick={() => setLang("uz")}
                    >
                        UZ
                    </button>
                </div>

                {error && <div className="admin-auth__error">{error}</div>}
                {success && <div className="admin-auth__success">{success}</div>}

                <form onSubmit={handleSubmit} className="admin-auth__form">
                    <label>
                        <span>{t.authPhoneLabel}</span>
                        <div className="admin-phone-input">
                            <span>+998</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="901234567"
                                required
                            />
                        </div>
                    </label>

                    <label>
                        <span>{t.authPasswordLabel}</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </label>

                    {mode === "register" && (
                        <label>
                            <span>{t.authSecretLabel}</span>
                            <input
                                type="text"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                required={mode === "register"}
                            />
                        </label>
                    )}

                    <button type="submit" className="admin-auth__submit" disabled={loading}>
                        {loading
                            ? "Загрузка..."
                            : mode === "login"
                                ? t.authLoginButton
                                : t.authRegisterButton}
                    </button>
                </form>

                <button type="button" className="admin-auth__link" onClick={toggleMode}>
                    {mode === "login" ? t.authNoAccount : t.authHasAccount}
                </button>
            </div>
        </div>
    );
}

