/**
 * ParkSmart — Admin Dashboard
 * Depends on: api.config.js, auth.api.js, user.api.js, owner-verification.api.js,
 *             appointment.api.js, transaction.api.js, vehicle.api.js, slot.api.js
 */

// ── View navigation ───────────────────────────────────────────────────────────
const viewTitles = {
    'admin-dashboard':    'Admin Dashboard',
    'admin-users':        'User Management',
    'admin-verify':       'Verify Owners',
    'admin-appointments': 'Appointments',
    'admin-commission':   'Commission',
    'admin-analytics':    'Analytics'
};

function showView(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    if (btn) {
        btn.closest('.nav-section').querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    const titleEl = document.getElementById('topbar-title');
    if (titleEl && viewTitles[id]) titleEl.textContent = viewTitles[id];

    // Load relevant data per section
    if (id === 'admin-dashboard')    renderDashboard();
    if (id === 'admin-users')        renderUsersTable();
    if (id === 'admin-verify')       renderVerifyTable();
    if (id === 'admin-appointments') renderAppointmentsTable();
    if (id === 'admin-commission')   renderCommissionSection();
    if (id === 'admin-analytics')    renderAnalytics();
}

// ── Session init ──────────────────────────────────────────────────────────────
(function () {
    const user = getCurrentUser();
    if (!user) { window.location.href = '/index.html'; return; }
    const initials = ((user.firstName || '')[0] || '') + ((user.lastName || '')[0] || '');
    document.getElementById('sidebar-avatar').textContent = initials.toUpperCase() || '?';
    document.getElementById('sidebar-name').textContent = (user.firstName || '') + ' ' + (user.lastName || '');
    const roleLabels = { DRIVER: 'Driver', OWNER: 'Parking Owner', ADMIN: 'System Administrator' };
    document.getElementById('sidebar-role').textContent = roleLabels[user.role] || user.role;

    const topbarSub = document.querySelector('.topbar-subtitle');
    if (topbarSub) topbarSub.textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
})();

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val) {
    return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(val) {
    const n = Number(val || 0);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'k';
    return n.toFixed(0);
}
function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}
function fmtDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' · ' + d.toTimeString().slice(0, 5);
}

// ── Global data cache ─────────────────────────────────────────────────────────
let _users = [], _appointments = [], _transactions = [], _vehicles = [], _slots = [], _verifications = [];

async function loadAllData() {
    try {
        [_users, _appointments, _transactions, _vehicles, _slots, _verifications] = await Promise.all([
            UserAPI.getAll(),
            AppointmentAPI.getAllAppointments ? AppointmentAPI.getAllAppointments() : apiFetch('/api/appointments'),
            TransactionAPI.getAll(),
            VehicleAPI.getAllVehicles ? VehicleAPI.getAllVehicles() : apiFetch('/api/vehicles'),
            SlotAPI.getAllSlots ? SlotAPI.getAllSlots() : apiFetch('/api/slots'),
            OwnerVerificationAPI.getAll(),
        ]);
    } catch (e) {
        console.error('Failed to load admin data', e);
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────
loadAllData().then(() => {
    renderDashboard();
    updatePendingBadge();
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function renderDashboard() {
    if (!_users.length && !_appointments.length) return;

    const drivers = _users.filter(u => u.role === 'DRIVER');
    const owners  = _users.filter(u => u.role === 'OWNER');
    const pendingOwners = _verifications.filter(v => v.status === 'PENDING');

    document.getElementById('dash-total-users').textContent = _users.length.toLocaleString();
    document.getElementById('dash-users-detail').innerHTML =
        `<span class="up">${drivers.length}</span> drivers · ${owners.length} owners`;

    document.getElementById('dash-total-owners').textContent = owners.length.toLocaleString();
    document.getElementById('dash-owners-detail').textContent =
        pendingOwners.length > 0 ? `${pendingOwners.length} pending verification` : 'All verified';

    document.getElementById('dash-total-appts').textContent = _appointments.length.toLocaleString();
    const activeAppts = _appointments.filter(a => a.status === 'ACTIVE').length;
    document.getElementById('dash-appts-detail').textContent = `${activeAppts} currently active`;

    const now = new Date();
    const monthCommission = _transactions
        .filter(t => t.paymentDate && new Date(t.paymentDate).getMonth() === now.getMonth()
                    && new Date(t.paymentDate).getFullYear() === now.getFullYear())
        .reduce((s, t) => s + (t.commission || 0), 0);
    document.getElementById('dash-commission').textContent = fmt(monthCommission);
    document.getElementById('dash-commission-detail').textContent = 'LKR this month';

    renderDonut('veh-donut', 'veh-legend', countByKey(_vehicles, 'type'), {
        CAR: 'var(--accent)', BIKE: 'var(--accent3)', VAN: 'var(--accent2)',
        TRUCK: 'var(--warning)', THREE_WHEELER: 'var(--danger)',
    });

    renderDonut('status-donut', 'status-legend', countByKey(_appointments, 'status'), {
        COMPLETED: 'var(--accent)', ACTIVE: 'var(--accent2)', PENDING: 'var(--warning)',
        REJECTED: 'var(--danger)', CANCELLED: '#666',
    });

    const recentTx = _transactions.slice().sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate)).slice(0, 5);
    document.getElementById('recent-activity-list').innerHTML = recentTx.length === 0
        ? '<div style="color:var(--text-muted);font-size:13px;">No transactions yet.</div>'
        : recentTx.map(t => `
            <div class="notification">
                <div class="notif-dot" style="background:var(--accent)"></div>
                <div>
                    <div class="notif-title">Payment Received — ${t.bookingCode || '#' + t.id}</div>
                    <div class="notif-msg">${t.driverFirstName || ''} ${t.driverLastName || ''} · ${t.locationName || '—'} · Slot ${t.slotNumber || '—'} · Commission: ${fmt(t.commission)} LKR</div>
                    <div class="notif-time">${fmtDate(t.paymentDate)}</div>
                </div>
            </div>`).join('');
}

// ── USERS TABLE ───────────────────────────────────────────────────────────────
function renderUsersTable() {
    const filter = document.getElementById('users-role-filter').value;
    const filtered = filter ? _users.filter(u => u.role === filter) : _users;

    document.getElementById('users-count-label').textContent =
        `${filtered.length} ${filter ? filter.toLowerCase() + 's' : 'total registered users'}`;

    const roleBadge = { DRIVER: 'slot-open', OWNER: 'slot-partial', ADMIN: 'slot-full' };
    const tbody = document.getElementById('users-table-body');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No users found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(u => {
        const isActive = u.status === 'ACTIVE';
        return `<tr>
            <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--accent)">#${u.id}</td>
            <td>${u.firstName || ''} ${u.lastName || ''}</td>
            <td style="font-size:12px;color:var(--text-muted)">${u.email || '—'}</td>
            <td style="font-size:12px;color:var(--text-muted)">${u.phone || '—'}</td>
            <td><span class="slot-badge ${roleBadge[u.role] || ''}">${u.role || '—'}</span></td>
            <td><span class="verify-badge ${isActive ? 'verify-verified' : 'verify-pending'}">${isActive ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div style="display:flex;gap:4px;">
                    ${isActive
                        ? `<button class="btn btn-danger btn-sm" onclick="toggleUserStatus(${u.id},'INACTIVE')">Suspend</button>`
                        : `<button class="btn btn-primary btn-sm" onclick="toggleUserStatus(${u.id},'ACTIVE')">Activate</button>`}
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ── CONFIRM MODAL ─────────────────────────────────────────────────────────────
function showConfirm(title, message, onConfirm, { okLabel = 'Confirm', okClass = 'btn-danger', iconBg = 'rgba(255,71,87,0.15)', icon = '⚠️' } = {}) {
    const modal  = document.getElementById('confirm-modal');
    const okBtn  = document.getElementById('confirm-ok-btn');
    const cancel = document.getElementById('confirm-cancel-btn');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent   = message;
    document.getElementById('confirm-icon').textContent  = icon;
    document.getElementById('confirm-icon').style.background = iconBg;
    okBtn.textContent = okLabel;
    okBtn.className   = `btn ${okClass}`;
    modal.classList.add('open');
    const close = () => modal.classList.remove('open');
    const confirmHandler = () => { close(); onConfirm(); };
    okBtn.addEventListener('click', confirmHandler, { once: true });
    cancel.addEventListener('click', close, { once: true });
}

function toggleUserStatus(id, newStatus) {
    const user = _users.find(u => u.id === id);
    const name = user ? `${user.firstName} ${user.lastName}` : `User #${id}`;
    const isSuspend = newStatus === 'INACTIVE';
    showConfirm(
        isSuspend ? 'Suspend User' : 'Activate User',
        isSuspend
            ? `Are you sure you want to suspend ${name}? They will not be able to log in.`
            : `Are you sure you want to activate ${name}? They will regain access to the system.`,
        async () => {
            try {
                const updated = await UserAPI.updateStatus(id, newStatus);
                const idx = _users.findIndex(u => u.id === id);
                if (idx !== -1) _users[idx] = updated;
                renderUsersTable();
            } catch (e) {
                alert('Failed to update user status: ' + (e.message || 'Unknown error'));
            }
        },
        {
            okLabel: isSuspend ? 'Suspend' : 'Activate',
            okClass: isSuspend ? 'btn-danger' : 'btn-primary',
            iconBg:  isSuspend ? 'rgba(255,71,87,0.15)' : 'rgba(0,229,160,0.15)',
            icon:    isSuspend ? '🚫' : '✅',
        }
    );
}

function exportUsersCSV() {
    const filter = document.getElementById('users-role-filter').value;
    const rows = filter ? _users.filter(u => u.role === filter) : _users;
    const header = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Status'];
    const lines  = rows.map(u => [u.id, u.firstName, u.lastName, u.email, u.phone, u.role, u.status].join(','));
    const csv    = [header.join(','), ...lines].join('\n');
    const blob   = new Blob([csv], { type: 'text/csv' });
    const a      = document.createElement('a');
    a.href       = URL.createObjectURL(blob);
    a.download   = `ParkSmart_Users_${filter || 'All'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

// ── VERIFY OWNERS TABLE ───────────────────────────────────────────────────────
function renderVerifyTable() {
    const tbody = document.getElementById('verify-table-body');
    if (_verifications.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No verification requests found.</td></tr>`;
        document.getElementById('verify-count-label').textContent = 'No verification requests';
        return;
    }
    const pending = _verifications.filter(v => v.status === 'PENDING').length;
    document.getElementById('verify-count-label').textContent =
        `${_verifications.length} total · ${pending} pending`;

    tbody.innerHTML = _verifications
        .slice().sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
        .map(v => {
            const statusMap  = { PENDING: 'verify-pending', VERIFIED: 'verify-verified', REJECTED: 'verify-rejected' };
            const statusIcon = { PENDING: '⏳', VERIFIED: '✓', REJECTED: '✕' };
            const actions = v.status === 'PENDING'
                ? `<button class="btn btn-primary btn-sm" onclick="verifyOwner(${v.id},'approve')">✓ Verify</button>
                   <button class="btn btn-danger btn-sm"  onclick="verifyOwner(${v.id},'reject')">✕ Reject</button>`
                : `<span style="font-size:12px;color:var(--text-muted);">${v.status}</span>`;
            return `<tr>
                <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--accent)">#${v.ownerId || '—'}</td>
                <td>${v.ownerFirstName || ''} ${v.ownerLastName || ''}</td>
                <td style="font-size:12px;color:var(--text-muted)">${v.ownerEmail || '—'}</td>
                <td style="font-size:12px;color:var(--text-muted)">${v.ownerPhone || '—'}</td>
                <td style="font-size:12px;">${fmtDate(v.appliedDate)}</td>
                <td><span class="verify-badge ${statusMap[v.status] || ''}">${statusIcon[v.status] || ''} ${v.status || '—'}</span></td>
                <td><div style="display:flex;gap:4px;">${actions}</div></td>
            </tr>`;
        }).join('');
}

function verifyOwner(id, action) {
    const v = _verifications.find(v => v.id === id);
    const name = v ? `${v.ownerFirstName} ${v.ownerLastName}` : `Owner #${id}`;
    const isApprove = action === 'approve';
    showConfirm(
        isApprove ? 'Approve Owner' : 'Reject Owner',
        isApprove
            ? `Approve ${name} as a verified parking owner? Their account will be activated.`
            : `Reject the verification request from ${name}? They will not be able to list parking locations.`,
        async () => {
            try {
                const updated = isApprove
                    ? await OwnerVerificationAPI.approve(id)
                    : await OwnerVerificationAPI.reject(id);
                const idx = _verifications.findIndex(v => v.id === id);
                if (idx !== -1) _verifications[idx] = updated;
                if (updated.ownerId) {
                    const ui = _users.findIndex(u => u.id === updated.ownerId);
                    if (ui !== -1) _users[ui].status = updated.userStatus;
                }
                renderVerifyTable();
                updatePendingBadge();
            } catch (e) {
                alert('Action failed: ' + (e.message || 'Unknown error'));
            }
        },
        {
            okLabel: isApprove ? 'Approve' : 'Reject',
            okClass: isApprove ? 'btn-primary' : 'btn-danger',
            iconBg:  isApprove ? 'rgba(0,229,160,0.15)' : 'rgba(255,71,87,0.15)',
            icon:    isApprove ? '✅' : '❌',
        }
    );
}

function updatePendingBadge() {
    const badge = document.querySelector('[onclick*="admin-verify"] .badge');
    if (!badge) return;
    const pending = _verifications.filter(v => v.status === 'PENDING').length;
    badge.textContent = pending;
    badge.style.display = pending > 0 ? '' : 'none';
}

// ── APPOINTMENTS TABLE ────────────────────────────────────────────────────────
function renderAppointmentsTable() {
    const tbody = document.getElementById('appts-table-body');
    document.getElementById('appts-total-label').textContent = `${_appointments.length} total`;

    if (_appointments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">No appointments found.</td></tr>`;
        return;
    }

    const statusClass = { PENDING:'status-pending', ACTIVE:'status-active', COMPLETED:'status-completed', REJECTED:'status-rejected', CANCELLED:'status-rejected' };
    const sorted = _appointments.slice().sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));

    tbody.innerHTML = sorted.map(a => {
        const start = a.startTime ? new Date(a.startTime) : null;
        const end   = a.endTime   ? new Date(a.endTime)   : null;
        const dtStr = (start && end)
            ? start.toLocaleDateString('en-US',{month:'short',day:'2-digit'}) + ' · ' + start.toTimeString().slice(0,5) + '–' + end.toTimeString().slice(0,5)
            : '—';
        const payPill = a.paymentStatus === 'PAID'
            ? `<span class="status-pill status-active" style="font-size:11px;">✓ Paid</span>`
            : `<span class="status-pill status-pending" style="font-size:11px;">Unpaid</span>`;
        return `<tr>
            <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--accent)">${a.bookingCode || '#' + a.id}</td>
            <td style="font-size:13px;">${a.driverFirstName || ''} ${a.driverLastName || ''}</td>
            <td style="font-size:12px;">${a.locationName || '—'} · ${a.slotNumber || '—'}</td>
            <td style="font-size:12px;">${a.vehicleNumber || '—'}${a.vehicleType ? ' (' + a.vehicleType + ')' : ''}</td>
            <td style="font-size:12px;">${dtStr}</td>
            <td class="tx-amount-positive" style="font-family:'DM Mono',monospace;">${a.totalAmount != null ? fmt(a.totalAmount) + ' LKR' : '—'}</td>
            <td>${payPill}</td>
            <td><span class="status-pill ${statusClass[a.status] || ''}">${a.status || '—'}</span></td>
        </tr>`;
    }).join('');
}

// ── COMMISSION SECTION ────────────────────────────────────────────────────────
function renderCommissionSection() {
    const gross      = _transactions.reduce((s,t) => s + (t.totalAmount||0), 0);
    const commEarned = _transactions.reduce((s,t) => s + (t.commission||0), 0);

    document.getElementById('comm-total-tx').textContent = _transactions.length.toLocaleString();
    document.getElementById('comm-gross').textContent    = fmt(gross);
    document.getElementById('comm-earned').textContent   = fmt(commEarned);

    const tbody = document.getElementById('commission-table-body');
    if (_transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">No transactions yet.</td></tr>`;
        return;
    }
    const sorted = _transactions.slice().sort((a,b) => new Date(b.paymentDate||0) - new Date(a.paymentDate||0));
    tbody.innerHTML = sorted.map(t => `<tr>
        <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--accent)">${t.bookingCode || '#' + t.id}</td>
        <td style="font-size:13px;">${t.driverFirstName || ''} ${t.driverLastName || ''}</td>
        <td style="font-size:13px;">${t.ownerFirstName || ''} ${t.ownerLastName || ''}</td>
        <td style="font-size:12px;">${t.vehicleType || '—'}</td>
        <td style="font-size:12px;">${fmtDate(t.paymentDate)}</td>
        <td class="tx-amount-positive" style="font-family:'DM Mono',monospace;">${fmt(t.totalAmount)} LKR</td>
        <td style="font-family:'DM Mono',monospace;color:var(--accent);font-weight:700;">${fmt(t.commission)} LKR</td>
        <td style="font-family:'DM Mono',monospace;color:var(--text-muted);">${fmt(t.ownerEarning)} LKR</td>
    </tr>`).join('');
}

// ── ANALYTICS SECTION ─────────────────────────────────────────────────────────
function renderAnalytics() {
    const completed = _appointments.filter(a => a.status === 'COMPLETED' && a.duration > 0);
    const avgMin = completed.length ? completed.reduce((s,a) => s + a.duration, 0) / completed.length : 0;
    document.getElementById('an-avg-duration').textContent = avgMin > 0 ? (avgMin / 60).toFixed(1) + 'h' : '—';

    const hourCounts = {};
    _appointments.forEach(a => {
        if (!a.startTime) return;
        const h = new Date(a.startTime).getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const peakH = Object.entries(hourCounts).sort((a,b) => b[1]-a[1])[0];
    document.getElementById('an-peak-hour').textContent  = peakH ? peakH[0].toString().padStart(2,'0') + ':00' : '—';
    document.getElementById('an-peak-detail').textContent = peakH ? `${peakH[1]} bookings at this hour` : 'No data';

    const activeApptSlots = new Set(_appointments.filter(a => a.status === 'ACTIVE').map(a => a.slotId).filter(Boolean));
    const totalSlots = _slots.length;
    const util = totalSlots > 0 ? Math.round((activeApptSlots.size / totalSlots) * 100) : 0;
    document.getElementById('an-slot-util').textContent = util + '%';

    const totalRev = _transactions.reduce((s,t) => s + (t.totalAmount||0), 0);
    document.getElementById('an-total-rev').textContent = fmt(totalRev);

    const locRevMap = {};
    _transactions.forEach(t => {
        const loc = t.locationName || 'Unknown';
        locRevMap[loc] = (locRevMap[loc] || 0) + (t.totalAmount || 0);
    });
    const locEntries = Object.entries(locRevMap).sort((a,b) => b[1]-a[1]);
    const maxLocRev  = locEntries[0]?.[1] || 1;
    const barColors  = ['var(--accent)', 'var(--accent3)', 'var(--accent2)', 'var(--danger)', 'var(--warning)'];
    document.getElementById('revenue-by-location').innerHTML = locEntries.length === 0
        ? '<div style="color:var(--text-muted);font-size:12px;">No transaction data yet.</div>'
        : locEntries.map(([name, rev], i) => `
            <div>
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                    <span>${name}</span>
                    <span style="color:${barColors[i % barColors.length]};font-family:'DM Mono',monospace;">${fmt(rev)} LKR</span>
                </div>
                <div style="height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:${Math.round((rev/maxLocRev)*100)}%;background:${barColors[i % barColors.length]};border-radius:3px;"></div>
                </div>
            </div>`).join('');

    const drivers = _users.filter(u => u.role === 'DRIVER').length;
    const owners  = _users.filter(u => u.role === 'OWNER').length;
    document.getElementById('entity-summary').innerHTML = [
        { icon:'👤', label:'Total Drivers',        val: drivers,              color:'var(--accent)'  },
        { icon:'🏢', label:'Parking Owners',       val: owners,               color:'var(--accent3)' },
        { icon:'🚗', label:'Registered Vehicles',  val: _vehicles.length,     color:'var(--accent2)' },
        { icon:'🅿', label:'Parking Slots',        val: _slots.length,        color:'var(--warning)' },
        { icon:'📋', label:'Total Appointments',   val: _appointments.length, color:'var(--danger)'  },
        { icon:'💳', label:'Paid Transactions',    val: _transactions.length, color:'var(--accent)'  },
    ].map(row => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--surface2);border-radius:10px;">
            <div style="display:flex;align-items:center;gap:8px;"><span>${row.icon}</span><span style="font-size:13px;">${row.label}</span></div>
            <span style="font-family:'DM Mono',monospace;color:${row.color};font-weight:700;">${row.val.toLocaleString()}</span>
        </div>`).join('');
}

// ── DONUT CHART ───────────────────────────────────────────────────────────────
function countByKey(arr, key) {
    const m = {};
    arr.forEach(item => {
        const k = item[key] || 'UNKNOWN';
        m[k] = (m[k] || 0) + 1;
    });
    return m;
}

function renderDonut(svgId, legendId, counts, colorMap) {
    const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    const total   = entries.reduce((s,[,v]) => s + v, 0);
    if (total === 0) return;

    const r = 30, circ = 2 * Math.PI * r;
    let offset = 0;
    const segments = entries.map(([k, v]) => {
        const pct  = v / total;
        const dash = pct * circ;
        const seg  = { k, v, pct, dash, offset };
        offset += dash;
        return seg;
    });

    const svgEl = document.getElementById(svgId);
    const extra = segments.map(s =>
        `<circle cx="40" cy="40" r="${r}" fill="none" stroke="${colorMap[s.k] || '#555'}" stroke-width="12"
            stroke-dasharray="${s.dash.toFixed(2)} ${circ.toFixed(2)}"
            stroke-dashoffset="${(-s.offset).toFixed(2)}"
            stroke-linecap="butt" transform="rotate(-90 40 40)"/>`
    ).join('');
    svgEl.innerHTML = `<circle cx="40" cy="40" r="30" fill="none" stroke="#1a2035" stroke-width="12"/>` + extra;

    document.getElementById(legendId).innerHTML = segments.map(s =>
        `<div class="legend-row">
            <div class="legend-color-label">
                <div class="color-swatch" style="background:${colorMap[s.k] || '#555'}"></div>
                ${s.k}
            </div>
            <div class="legend-pct">${Math.round(s.pct * 100)}%</div>
        </div>`
    ).join('');
}
