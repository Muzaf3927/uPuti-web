import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { adminTranslations } from "./adminTranslations";
import {
    fetchAdminCommissionStats,
    fetchAdminCommissions,
    getAdminToken,
    clearAdminToken,
    adminUpdateBalance,
    adminUpdateUserRole,
    adminSendToAll,
    adminSendToUser,
} from "./api";

function formatCurrency(value) {
    if (value == null) return "—";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString("ru-RU");
}

function formatDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [stats, setStats] = useState({
        total_turnover: 0,
        total_commission: 0,
        total_records: 0,
    });

    const [commissions, setCommissions] = useState([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // balance form
    const [balancePhone, setBalancePhone] = useState("");
    const [balanceAmount, setBalanceAmount] = useState("");
    const [balanceAction, setBalanceAction] = useState("add");
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [balanceMessage, setBalanceMessage] = useState("");
    const [balanceError, setBalanceError] = useState("");
    const [balanceLocked, setBalanceLocked] = useState(false);

    // role form
    const [rolePhone, setRolePhone] = useState("");
    const [roleValue, setRoleValue] = useState("driver");
    const [roleLoading, setRoleLoading] = useState(false);
    const [roleMessage, setRoleMessage] = useState("");
    const [roleError, setRoleError] = useState("");

    // messages: broadcast
    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [broadcastRole, setBroadcastRole] = useState("");
    const [broadcastLoading, setBroadcastLoading] = useState(false);
    const [broadcastResult, setBroadcastResult] = useState("");
    const [broadcastError, setBroadcastError] = useState("");

    // messages: single user
    const [singlePhone, setSinglePhone] = useState("");
    const [singleMessage, setSingleMessage] = useState("");
    const [singleLoading, setSingleLoading] = useState(false);
    const [singleResult, setSingleResult] = useState("");
    const [singleError, setSingleError] = useState("");

    useEffect(() => {
        const token = getAdminToken();
        if (!token) {
            navigate("/admin", { replace: true });
            return;
        }

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const [statsRes, listRes] = await Promise.all([
                    fetchAdminCommissionStats({ from, to, token }),
                    fetchAdminCommissions({ from, to, page, token }),
                ]);

                if (cancelled) return;

                setStats(statsRes);
                setCommissions(listRes.data || []);
                setPage(listRes.current_page || 1);
                setLastPage(listRes.last_page || 1);
                setTotal(listRes.total || 0);
            } catch (err) {
                if (err.status === 401) {
                    clearAdminToken();
                    navigate("/admin", { replace: true });
                    return;
                }
                setError(err.message || "Не удалось загрузить данные комиссий.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [from, to, page, navigate]);

    const canPrev = page > 1;
    const canNext = page < lastPage;

    const ensureTokenOrRedirect = () => {
        const token = getAdminToken();
        if (!token) {
            navigate("/admin", { replace: true });
            return null;
        }
        return token;
    };

    const handleBalanceSubmit = async (e) => {
        e.preventDefault();
        const token = ensureTokenOrRedirect();
        if (!token) return;
        setBalanceError("");
        setBalanceMessage("");
        setBalanceLoading(true);
        try {
            const cleanPhone = balancePhone.replace(/\D/g, "");
            const resp = await adminUpdateBalance({
                phone: cleanPhone,
                amount: Number(balanceAmount),
                action: balanceAction,
                token,
            });
            setBalanceMessage(`Баланс обновлён. Новый баланс: ${resp.new_balance}`);
            setBalanceLocked(true);
        } catch (err) {
            if (err.status === 401) {
                clearAdminToken();
                navigate("/admin", { replace: true });
                return;
            }
            setBalanceError(err.message);
        } finally {
            setBalanceLoading(false);
        }
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        const token = ensureTokenOrRedirect();
        if (!token) return;
        setRoleError("");
        setRoleMessage("");
        setRoleLoading(true);
        try {
            const cleanPhone = rolePhone.replace(/\D/g, "");
            await adminUpdateUserRole({
                phone: cleanPhone,
                role: roleValue,
                token,
            });
            setRoleMessage("Роль пользователя успешно обновлена.");
        } catch (err) {
            if (err.status === 401) {
                clearAdminToken();
                navigate("/admin", { replace: true });
                return;
            }
            setRoleError(err.message);
        } finally {
            setRoleLoading(false);
        }
    };

    const handleBroadcastSubmit = async (e) => {
        e.preventDefault();
        const token = ensureTokenOrRedirect();
        if (!token) return;
        setBroadcastError("");
        setBroadcastResult("");
        setBroadcastLoading(true);
        try {
            const resp = await adminSendToAll({
                message: broadcastMessage,
                role: broadcastRole || undefined,
                token,
            });
            setBroadcastResult(
                `Рассылка отправлена успешно. Доставлено пользователям: ${resp.total_sent ?? "—"}`,
            );
        } catch (err) {
            if (err.status === 401) {
                clearAdminToken();
                navigate("/admin", { replace: true });
                return;
            }
            setBroadcastError(err.message);
        } finally {
            setBroadcastLoading(false);
        }
    };

    const handleSingleSubmit = async (e) => {
        e.preventDefault();
        const token = ensureTokenOrRedirect();
        if (!token) return;
        setSingleError("");
        setSingleResult("");
        setSingleLoading(true);
        try {
            const cleanPhone = singlePhone.replace(/\D/g, "");
            await adminSendToUser({
                phone: cleanPhone,
                message: singleMessage,
                token,
            });
            setSingleResult("Сообщение успешно отправлено пользователю.");
        } catch (err) {
            if (err.status === 401) {
                clearAdminToken();
                navigate("/admin", { replace: true });
                return;
            }
            setSingleError(err.message);
        } finally {
            setSingleLoading(false);
        }
    };

    return (
        <AdminLayout>
            {({ lang, activeSection }) => {
                const t = adminTranslations[lang];
                return (
                    <>
                        {activeSection === "commissions" && (
                        <section id="commissions" className="admin-section">
                            <h2>{t.commissionsTitle}</h2>
                            <p className="admin-section__hint">
                                {t.commissionsHint}
                            </p>

                            <div className="admin-filters">
                                <label>
                                    {t.filterFrom}
                                    <input
                                        type="date"
                                        value={from}
                                        onChange={(e) => {
                                            setPage(1);
                                            setFrom(e.target.value);
                                        }}
                                    />
                                </label>
                                <label>
                                    {t.filterTo}
                                    <input
                                        type="date"
                                        value={to}
                                        onChange={(e) => {
                                            setPage(1);
                                            setTo(e.target.value);
                                        }}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className="admin-form button-reset"
                                    onClick={() => {
                                        setFrom("");
                                        setTo("");
                                        setPage(1);
                                    }}
                                >
                                    {t.filterReset}
                                </button>
                            </div>

                            <div className="admin-cards">
                                <div className="admin-card">
                                    <div className="admin-card__label">{t.cardTurnover}</div>
                                    <div className="admin-card__value">
                                        {formatCurrency(stats.total_turnover)}
                                    </div>
                                </div>
                                <div className="admin-card">
                                    <div className="admin-card__label">{t.cardCommission}</div>
                                    <div className="admin-card__value">
                                        {formatCurrency(stats.total_commission)}
                                    </div>
                                </div>
                                <div className="admin-card">
                                    <div className="admin-card__label">{t.cardRecords}</div>
                                    <div className="admin-card__value">
                                        {stats.total_records ?? 0}
                                    </div>
                                </div>
                            </div>

                            {error && <div className="admin-auth__error" style={{ marginTop: 12 }}>{error}</div>}

                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>{t.tableId}</th>
                                            <th>{t.tableTripId}</th>
                                            <th>{t.tableDriverId}</th>
                                            <th>{t.tableDriverPhone}</th>
                                            <th>{t.tableTurnover}</th>
                                            <th>{t.tableCommission}</th>
                                            <th>{t.tablePercent}</th>
                                            <th>{t.tableDate}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="admin-table__loading">
                                                    {t.tableLoading}
                                                </td>
                                            </tr>
                                        ) : commissions.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="admin-table__empty">
                                                    {t.tableEmpty}
                                                </td>
                                            </tr>
                                        ) : (
                                            commissions.map((c) => (
                                                <tr key={c.id}>
                                                    <td>{c.id}</td>
                                                    <td>{c.trip_id ?? c.trip?.id ?? "—"}</td>
                                                    <td>{c.user?.id ?? "—"}</td>
                                                    <td>{c.user?.phone ?? "—"}</td>
                                                    <td>{formatCurrency(c.total_amount)}</td>
                                                    <td>{formatCurrency(c.commission_amount)}</td>
                                                    <td>{c.commission_percent ?? "—"}%</td>
                                                    <td>{formatDateTime(c.created_at)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="admin-pagination">
                                <span>
                                    {adminTranslations[lang].paginationText(page, lastPage, total)}
                                </span>
                                <div className="admin-pagination__buttons">
                                    <button
                                        type="button"
                                        onClick={() => canPrev && setPage((p) => p - 1)}
                                        disabled={!canPrev}
                                    >
                                        Назад
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => canNext && setPage((p) => p + 1)}
                                        disabled={!canNext}
                                    >
                                        Вперёд
                                    </button>
                                </div>
                            </div>
                        </section>
                        )}

                        {activeSection === "users" && (
                        <section id="users" className="admin-section">
                            <h2>{t.usersTitle}</h2>
                            <p className="admin-section__hint">
                                {t.usersHint}
                            </p>

                            <div className="admin-grid-2">
                                <div className="admin-card admin-card--form">
                                    <h3>{t.balanceTitle}</h3>
                                    <form
                                        className={`admin-form ${balanceLocked ? "admin-form--locked" : ""}`}
                                        onSubmit={handleBalanceSubmit}
                                    >
                                        <label>
                                            {t.balancePhoneLabel}
                                            <input
                                                type="tel"
                                                placeholder="901234567"
                                                value={balancePhone}
                                                onChange={(e) => {
                                                    setBalancePhone(e.target.value);
                                                    setBalanceLocked(false);
                                                }}
                                                required
                                            />
                                        </label>
                                        <label>
                                            {t.balanceAmountLabel}
                                            <input
                                                type="number"
                                                placeholder="50000"
                                                value={balanceAmount}
                                                onChange={(e) => {
                                                    setBalanceAmount(e.target.value);
                                                    setBalanceLocked(false);
                                                }}
                                                min="1"
                                                required
                                            />
                                        </label>
                                        <label>
                                            {t.balanceActionLabel}
                                            <select
                                                value={balanceAction}
                                                onChange={(e) => {
                                                    setBalanceAction(e.target.value);
                                                    setBalanceLocked(false);
                                                }}
                                            >
                                                <option value="add">{t.balanceActionAdd}</option>
                                                <option value="subtract">{t.balanceActionSubtract}</option>
                                            </select>
                                        </label>
                                        <button type="submit" disabled={balanceLoading || balanceLocked}>
                                            {balanceLocked
                                                ? t.balanceDone
                                                : balanceLoading
                                                    ? t.balanceSubmitting
                                                    : t.balanceSubmit}
                                        </button>
                                        {balanceError && <div className="admin-auth__error">{balanceError}</div>}
                                        {balanceMessage && <div className="admin-auth__success">{balanceMessage}</div>}
                                    </form>
                                </div>

                                <div className="admin-card admin-card--form">
                                    <h3>{t.roleTitle}</h3>
                                    <form className="admin-form" onSubmit={handleRoleSubmit}>
                                        <label>
                                            {t.rolePhoneLabel}
                                            <input
                                                type="tel"
                                                placeholder="901234567"
                                                value={rolePhone}
                                                onChange={(e) => setRolePhone(e.target.value)}
                                                required
                                            />
                                        </label>
                                        <label>
                                            {t.roleSelectLabel}
                                            <select
                                                value={roleValue}
                                                onChange={(e) => setRoleValue(e.target.value)}
                                            >
                                                <option value="driver">{t.roleDriver}</option>
                                                <option value="passenger">{t.rolePassenger}</option>
                                            </select>
                                        </label>
                                        <button type="submit" disabled={roleLoading}>
                                            {roleLoading ? t.roleSubmitting : t.roleSubmit}
                                        </button>
                                        {roleError && <div className="admin-auth__error">{roleError}</div>}
                                        {roleMessage && <div className="admin-auth__success">{roleMessage}</div>}
                                    </form>
                                </div>
                            </div>
                        </section>
                        )}

                        {activeSection === "messages" && (
                        <section id="messages" className="admin-section">
                            <h2>{t.messagesTitle}</h2>
                            <p className="admin-section__hint">
                                {t.messagesHint}
                            </p>

                            <div className="admin-grid-2">
                                <div className="admin-card admin-card--form">
                                    <h3>{t.broadcastTitle}</h3>
                                    <form className="admin-form" onSubmit={handleBroadcastSubmit}>
                                        <label>
                                            {t.broadcastRoleLabel}
                                            <select
                                                value={broadcastRole}
                                                onChange={(e) => setBroadcastRole(e.target.value)}
                                            >
                                                <option value="">{t.broadcastRoleAll}</option>
                                                <option value="driver">{t.broadcastRoleDriver}</option>
                                                <option value="passenger">{t.broadcastRolePassenger}</option>
                                            </select>
                                        </label>
                                        <label>
                                            {t.broadcastMessageLabel}
                                            <textarea
                                                rows={4}
                                                placeholder="..."
                                                value={broadcastMessage}
                                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                                required
                                            />
                                        </label>
                                        <button type="submit" disabled={broadcastLoading}>
                                            {broadcastLoading ? t.broadcastSubmitting : t.broadcastSubmit}
                                        </button>
                                        {broadcastError && <div className="admin-auth__error">{broadcastError}</div>}
                                        {broadcastResult && <div className="admin-auth__success">{broadcastResult}</div>}
                                    </form>
                                </div>

                                <div className="admin-card admin-card--form">
                                    <h3>{t.singleTitle}</h3>
                                    <form className="admin-form" onSubmit={handleSingleSubmit}>
                                        <label>
                                            {t.singlePhoneLabel}
                                            <input
                                                type="tel"
                                                placeholder="901234567"
                                                value={singlePhone}
                                                onChange={(e) => setSinglePhone(e.target.value)}
                                                required
                                            />
                                        </label>
                                        <label>
                                            {t.singleMessageLabel}
                                            <textarea
                                                rows={4}
                                                placeholder="..."
                                                value={singleMessage}
                                                onChange={(e) => setSingleMessage(e.target.value)}
                                                required
                                            />
                                        </label>
                                        <button type="submit" disabled={singleLoading}>
                                            {singleLoading ? t.singleSubmitting : t.singleSubmit}
                                        </button>
                                        {singleError && <div className="admin-auth__error">{singleError}</div>}
                                        {singleResult && <div className="admin-auth__success">{singleResult}</div>}
                                    </form>
                                </div>
                            </div>
                        </section>
                        )}
                    </>
                );
            }}
        </AdminLayout>
    );
}

