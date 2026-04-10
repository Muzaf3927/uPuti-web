const API_BASE = "https://api.uputi.net/api";
//const API_BASE = "http://127.0.1:8000/api";

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.token
                ? { Authorization: `Bearer ${options.token}` }
                : {}),
        },
        ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const message = data.message || "Произошла ошибка. Попробуйте позже.";
        const error = new Error(message);
        error.status = res.status;
        throw error;
    }

    return data;
}

export async function adminRegister({ phone, password, secret }) {
    return request("/admin/register", {
        method: "POST",
        body: JSON.stringify({ phone, password, secret }),
    });
}

export async function adminLogin({ phone, password }) {
    return request("/admin/login", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
    });
}

export async function adminLogout(token) {
    if (!token) return;
    return request("/admin/logout", {
        method: "POST",
        token,
    });
}

export async function adminUpdateBalance({ phone, amount, action, token }) {
    return request("/admin/balance", {
        method: "POST",
        token,
        body: JSON.stringify({ phone, amount, action }),
    });
}

export async function adminUpdateUserRole({ phone, role, token }) {
    return request("/admin/role", {
        method: "POST",
        token,
        body: JSON.stringify({ phone, role }),
    });
}

export async function adminSendToAll({ message, role, token }) {
    return request("/admin/send-to-all", {
        method: "POST",
        token,
        body: JSON.stringify(role ? { message, role } : { message }),
    });
}

export async function adminSendToUser({ phone, message, token }) {
    return request("/admin/send-to-user", {
        method: "POST",
        token,
        body: JSON.stringify({ phone, message }),
    });
}

export async function fetchAdminCommissionStats({ from, to, token }) {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const qs = params.toString();
    return request(`/admin/commissions/stats${qs ? `?${qs}` : ""}`, {
        method: "GET",
        token,
    });
}

export async function fetchAdminCommissions({ page = 1, from, to, token }) {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const qs = params.toString();
    return request(`/admin/commissions${qs ? `?${qs}` : ""}`, {
        method: "GET",
        token,
    });
}

export async function adminAutoCompleteTrips({ token }) {
    return request("/admin/trips/auto-complete", {
        method: "POST",
        token,
    });
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function fetchAdminUsers({ page = 1, search, role, token }) {
    const params = new URLSearchParams();
    params.append("page", String(page));
    if (search) params.append("search", search);
    if (role) params.append("role", role);
    return request(`/admin/users?${params}`, { method: "GET", token });
}

export async function fetchAdminUser({ id, token }) {
    return request(`/admin/users/${id}`, { method: "GET", token });
}

export async function adminUpdateUser({ id, data, token }) {
    return request(`/admin/users/${id}`, {
        method: "PUT",
        token,
        body: JSON.stringify(data),
    });
}

export async function adminUpdateUserCar({ userId, data, token }) {
    return request(`/admin/users/${userId}/car`, {
        method: "PUT",
        token,
        body: JSON.stringify(data),
    });
}

export async function adminDeleteUserCar({ userId, token }) {
    return request(`/admin/users/${userId}/car`, {
        method: "DELETE",
        token,
    });
}

// ── Trips ────────────────────────────────────────────────────────────────────

export async function fetchAdminTrips({ page = 1, search, status, role, from, to, token }) {
    const params = new URLSearchParams();
    params.append("page", String(page));
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (role) params.append("role", role);
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    return request(`/admin/trips?${params}`, { method: "GET", token });
}

export async function adminCreatePassengerTrip({ data, token }) {
    return request("/admin/trips", {
        method: "POST",
        token,
        body: JSON.stringify(data),
    });
}

export async function fetchAdminTrip({ id, token }) {
    return request(`/admin/trips/${id}`, { method: "GET", token });
}

export async function adminDeleteTrip({ id, token }) {
    return request(`/admin/trips/${id}`, { method: "DELETE", token });
}

// ── Bookings ─────────────────────────────────────────────────────────────────

export async function fetchAdminBookings({ page = 1, search, status, token }) {
    const params = new URLSearchParams();
    params.append("page", String(page));
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    return request(`/admin/bookings?${params}`, { method: "GET", token });
}

export async function adminDeleteBooking({ id, token }) {
    return request(`/admin/bookings/${id}`, { method: "DELETE", token });
}

export function saveAdminToken(token) {
    localStorage.setItem("uputi_admin_token", token);
}

export function getAdminToken() {
    return localStorage.getItem("uputi_admin_token") || null;
}

export function clearAdminToken() {
    localStorage.removeItem("uputi_admin_token");
}

