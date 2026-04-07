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
    adminAutoCompleteTrips,
    fetchAdminUsers,
    adminUpdateUser,
    adminUpdateUserCar,
    adminDeleteUserCar,
    fetchAdminTrips,
    adminDeleteTrip,
    fetchAdminBookings,
    adminDeleteBooking,
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

    // auto-complete trips
    const [autoCompleteLoading, setAutoCompleteLoading] = useState(false);
    const [autoCompleteResult, setAutoCompleteResult] = useState("");
    const [autoCompleteError, setAutoCompleteError] = useState("");

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

    const handleAutoComplete = async () => {
        const token = ensureTokenOrRedirect();
        if (!token) return;
        setAutoCompleteError("");
        setAutoCompleteResult("");
        setAutoCompleteLoading(true);
        try {
            const resp = await adminAutoCompleteTrips({ token });
            setAutoCompleteResult(resp);
        } catch (err) {
            if (err.status === 401) {
                clearAdminToken();
                navigate("/admin", { replace: true });
                return;
            }
            setAutoCompleteError(err.message);
        } finally {
            setAutoCompleteLoading(false);
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

                        {activeSection === "trips" && (
                        <section id="trips" className="admin-section">
                            <h2>{t.tripsTitle}</h2>
                            <p className="admin-section__hint">
                                {t.tripsHint}
                            </p>

                            <div className="admin-card admin-card--form" style={{ maxWidth: 480 }}>
                                <button
                                    type="button"
                                    className="admin-form"
                                    style={{
                                        width: "100%",
                                        padding: "12px 24px",
                                        fontSize: "1rem",
                                        cursor: autoCompleteLoading ? "wait" : "pointer",
                                    }}
                                    disabled={autoCompleteLoading}
                                    onClick={handleAutoComplete}
                                >
                                    {autoCompleteLoading ? t.autoCompleteRunning : t.autoCompleteButton}
                                </button>
                                {autoCompleteError && (
                                    <div className="admin-auth__error" style={{ marginTop: 12 }}>
                                        {autoCompleteError}
                                    </div>
                                )}
                                {autoCompleteResult && (
                                    <div className="admin-auth__success" style={{ marginTop: 12 }}>
                                        {t.autoCompleteResult(
                                            autoCompleteResult.trips_completed ?? 0,
                                            autoCompleteResult.commissions_charged ?? 0,
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                        )}

                        {activeSection === "usersList" && (
                            <UsersListSection t={t} token={token} onAuthError={onAuthError} />
                        )}

                        {activeSection === "tripsList" && (
                            <TripsListSection t={t} token={token} onAuthError={onAuthError} />
                        )}

                        {activeSection === "bookingsList" && (
                            <BookingsListSection t={t} token={token} onAuthError={onAuthError} />
                        )}
                    </>
                );
            }}
        </AdminLayout>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   USERS LIST SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

function UsersListSection({ t, token, onAuthError }) {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [editUser, setEditUser] = useState(null);

    const load = async (p = page) => {
        setLoading(true);
        try {
            const res = await fetchAdminUsers({ page: p, search, role: roleFilter, token });
            setUsers(res.data || []);
            setPage(res.current_page || 1);
            setLastPage(res.last_page || 1);
            setTotal(res.total || 0);
        } catch (e) {
            if (e.status === 401) onAuthError();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(1); }, [search, roleFilter]);

    const handleSaveUser = async (id, data) => {
        try {
            await adminUpdateUser({ id, data, token });
            setEditUser(null);
            load();
        } catch (e) {
            if (e.status === 401) onAuthError();
            else alert(e.message);
        }
    };

    const handleSaveCar = async (userId, data) => {
        try {
            await adminUpdateUserCar({ userId, data, token });
            load();
        } catch (e) {
            if (e.status === 401) onAuthError();
            else alert(e.message);
        }
    };

    const handleDeleteCar = async (userId) => {
        if (!confirm(t.confirmDelete)) return;
        try {
            await adminDeleteUserCar({ userId, token });
            load();
        } catch (e) {
            if (e.status === 401) onAuthError();
            else alert(e.message);
        }
    };

    return (
        <section>
            <h2 className="admin-section-title">{t.usersListTitle}</h2>
            <p className="admin-section-hint">{t.usersListHint}</p>

            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <input
                    className="admin-input"
                    placeholder={t.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 200 }}
                />
                <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">{t.allRoles}</option>
                    <option value="driver">{t.driver}</option>
                    <option value="passenger">{t.passenger}</option>
                </select>
            </div>

            {loading ? (
                <p>{t.loading}</p>
            ) : users.length === 0 ? (
                <p>{t.noData}</p>
            ) : (
                <>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{t.colId}</th>
                                    <th>{t.colName}</th>
                                    <th>{t.colPhone}</th>
                                    <th>{t.colRole}</th>
                                    <th>{t.colBalance}</th>
                                    <th>{t.colCar}</th>
                                    <th>{t.colActions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.id}</td>
                                        <td>{u.name || "—"}</td>
                                        <td>{u.phone}</td>
                                        <td>{u.role || "—"}</td>
                                        <td>{formatCurrency(u.balance)}</td>
                                        <td>{u.car ? `${u.car.model} ${u.car.color} ${u.car.number}` : t.noCar}</td>
                                        <td>
                                            <button className="admin-btn admin-btn--sm" onClick={() => setEditUser(u)}>
                                                {t.btnEdit}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="admin-pagination">
                        <button disabled={page <= 1} onClick={() => load(page - 1)}>←</button>
                        <span>{page} / {lastPage} ({total})</span>
                        <button disabled={page >= lastPage} onClick={() => load(page + 1)}>→</button>
                    </div>
                </>
            )}

            {editUser && (
                <UserEditModal
                    t={t}
                    user={editUser}
                    onClose={() => setEditUser(null)}
                    onSaveUser={handleSaveUser}
                    onSaveCar={handleSaveCar}
                    onDeleteCar={handleDeleteCar}
                />
            )}
        </section>
    );
}

function UserEditModal({ t, user, onClose, onSaveUser, onSaveCar, onDeleteCar }) {
    const [name, setName] = useState(user.name || "");
    const [phone, setPhone] = useState(user.phone || "");
    const [role, setRole] = useState(user.role || "passenger");
    const [balance, setBalance] = useState(user.balance ?? 0);

    const [carModel, setCarModel] = useState(user.car?.model || "");
    const [carColor, setCarColor] = useState(user.car?.color || "");
    const [carNumber, setCarNumber] = useState(user.car?.number || "");

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3>{t.editUser} #{user.id}</h3>

                <div className="admin-modal__grid">
                    <label>{t.colName}
                        <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label>{t.colPhone}
                        <input className="admin-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </label>
                    <label>{t.colRole}
                        <select className="admin-select" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="driver">{t.driver}</option>
                            <option value="passenger">{t.passenger}</option>
                        </select>
                    </label>
                    <label>{t.colBalance}
                        <input className="admin-input" type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} />
                    </label>
                </div>

                <button className="admin-btn" onClick={() => onSaveUser(user.id, { name, phone, role, balance })} style={{ marginTop: 12 }}>
                    {t.btnSave}
                </button>

                <hr style={{ margin: "16px 0" }} />

                <h4>{t.editCar}</h4>
                <div className="admin-modal__grid">
                    <label>{t.carModel}
                        <input className="admin-input" value={carModel} onChange={(e) => setCarModel(e.target.value)} />
                    </label>
                    <label>{t.carColor}
                        <input className="admin-input" value={carColor} onChange={(e) => setCarColor(e.target.value)} />
                    </label>
                    <label>{t.carNumber}
                        <input className="admin-input" value={carNumber} onChange={(e) => setCarNumber(e.target.value)} />
                    </label>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="admin-btn" onClick={() => onSaveCar(user.id, { model: carModel, color: carColor, number: carNumber })}>
                        {user.car ? t.saveCar : t.addCar}
                    </button>
                    {user.car && (
                        <button className="admin-btn admin-btn--danger" onClick={() => onDeleteCar(user.id)}>
                            {t.deleteCar}
                        </button>
                    )}
                </div>

                <button className="admin-btn admin-btn--secondary" onClick={onClose} style={{ marginTop: 16, width: "100%" }}>
                    {t.btnCancel}
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRIPS LIST SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

function TripsListSection({ t, token, onAuthError }) {
    const [trips, setTrips] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const load = async (p = page) => {
        setLoading(true);
        try {
            const res = await fetchAdminTrips({ page: p, search, status: statusFilter, role: roleFilter, from, to, token });
            setTrips(res.data || []);
            setPage(res.current_page || 1);
            setLastPage(res.last_page || 1);
            setTotal(res.total || 0);
        } catch (e) {
            if (e.status === 401) onAuthError();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(1); }, [search, statusFilter, roleFilter, from, to]);

    const handleDelete = async (id) => {
        if (!confirm(t.confirmDelete)) return;
        try {
            await adminDeleteTrip({ id, token });
            load();
        } catch (e) {
            if (e.status === 401) onAuthError();
            else alert(e.message);
        }
    };

    return (
        <section>
            <h2 className="admin-section-title">{t.tripsListTitle}</h2>
            <p className="admin-section-hint">{t.tripsListHint}</p>

            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <input
                    className="admin-input"
                    placeholder={t.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 200 }}
                />
                <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t.allStatuses}</option>
                    <option value="active">{t.statusActive}</option>
                    <option value="in_progress">{t.statusInProgress}</option>
                    <option value="completed">{t.statusCompleted}</option>
                </select>
                <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">{t.allRoles}</option>
                    <option value="driver">{t.driver}</option>
                    <option value="passenger">{t.passenger}</option>
                </select>
                <input type="date" className="admin-input" value={from} onChange={(e) => setFrom(e.target.value)} />
                <input type="date" className="admin-input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            {loading ? (
                <p>{t.loading}</p>
            ) : trips.length === 0 ? (
                <p>{t.noData}</p>
            ) : (
                <>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{t.colId}</th>
                                    <th>{t.colFrom}</th>
                                    <th>{t.colTo}</th>
                                    <th>{t.colDate}</th>
                                    <th>{t.colTime}</th>
                                    <th>{t.colSeats}</th>
                                    <th>{t.colAmount}</th>
                                    <th>{t.colRole}</th>
                                    <th>{t.colStatus}</th>
                                    <th>{t.colUser}</th>
                                    <th>{t.colBookings}</th>
                                    <th>{t.colActions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trips.map((tr) => (
                                    <tr key={tr.id}>
                                        <td>{tr.id}</td>
                                        <td title={tr.from_address}>{(tr.from_address || "—").slice(0, 25)}</td>
                                        <td title={tr.to_address}>{(tr.to_address || "—").slice(0, 25)}</td>
                                        <td>{tr.date}</td>
                                        <td>{tr.time}</td>
                                        <td>{tr.seats}</td>
                                        <td>{formatCurrency(tr.amount)}</td>
                                        <td>{tr.role || "—"}</td>
                                        <td><span className={`status-badge status-badge--${tr.status}`}>{tr.status}</span></td>
                                        <td>{tr.user ? `${tr.user.name || ""} ${tr.user.phone}` : "—"}</td>
                                        <td>{tr.bookings?.length || 0}</td>
                                        <td>
                                            <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(tr.id)}>
                                                {t.btnDelete}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="admin-pagination">
                        <button disabled={page <= 1} onClick={() => load(page - 1)}>←</button>
                        <span>{page} / {lastPage} ({total})</span>
                        <button disabled={page >= lastPage} onClick={() => load(page + 1)}>→</button>
                    </div>
                </>
            )}
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOOKINGS LIST SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

function BookingsListSection({ t, token, onAuthError }) {
    const [bookings, setBookings] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const load = async (p = page) => {
        setLoading(true);
        try {
            const res = await fetchAdminBookings({ page: p, search, status: statusFilter, token });
            setBookings(res.data || []);
            setPage(res.current_page || 1);
            setLastPage(res.last_page || 1);
            setTotal(res.total || 0);
        } catch (e) {
            if (e.status === 401) onAuthError();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(1); }, [search, statusFilter]);

    const handleDelete = async (id) => {
        if (!confirm(t.confirmDelete)) return;
        try {
            await adminDeleteBooking({ id, token });
            load();
        } catch (e) {
            if (e.status === 401) onAuthError();
            else alert(e.message);
        }
    };

    return (
        <section>
            <h2 className="admin-section-title">{t.bookingsTitle}</h2>
            <p className="admin-section-hint">{t.bookingsHint}</p>

            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <input
                    className="admin-input"
                    placeholder={t.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 200 }}
                />
                <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t.allStatuses}</option>
                    <option value="requested">Requested</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {loading ? (
                <p>{t.loading}</p>
            ) : bookings.length === 0 ? (
                <p>{t.noData}</p>
            ) : (
                <>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{t.colId}</th>
                                    <th>{t.colTrip}</th>
                                    <th>{t.colUser}</th>
                                    <th>{t.colRole}</th>
                                    <th>{t.colSeats}</th>
                                    <th>{t.colOfferedPrice}</th>
                                    <th>{t.colStatus}</th>
                                    <th>{t.colActions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => (
                                    <tr key={b.id}>
                                        <td>{b.id}</td>
                                        <td>{b.trip ? `#${b.trip.id} ${(b.trip.from_address || "").slice(0, 15)}→${(b.trip.to_address || "").slice(0, 15)}` : "—"}</td>
                                        <td>{b.user ? `${b.user.name || ""} ${b.user.phone}` : "—"}</td>
                                        <td>{b.role || "—"}</td>
                                        <td>{b.seats}</td>
                                        <td>{formatCurrency(b.offered_price)}</td>
                                        <td><span className={`status-badge status-badge--${b.status}`}>{b.status}</span></td>
                                        <td>
                                            <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(b.id)}>
                                                {t.btnDelete}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="admin-pagination">
                        <button disabled={page <= 1} onClick={() => load(page - 1)}>←</button>
                        <span>{page} / {lastPage} ({total})</span>
                        <button disabled={page >= lastPage} onClick={() => load(page + 1)}>→</button>
                    </div>
                </>
            )}
        </section>
    );
}

