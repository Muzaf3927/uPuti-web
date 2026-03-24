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

export function saveAdminToken(token) {
    localStorage.setItem("uputi_admin_token", token);
}

export function getAdminToken() {
    return localStorage.getItem("uputi_admin_token") || null;
}

export function clearAdminToken() {
    localStorage.removeItem("uputi_admin_token");
}

