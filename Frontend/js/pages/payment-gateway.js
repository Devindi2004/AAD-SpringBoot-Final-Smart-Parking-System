/**
 * ParkSmart — Payment Gateway
 * Depends on: api.config.js, auth.api.js, appointment.api.js, transaction.api.js
 */

const params = new URLSearchParams(window.location.search);
    const appointmentId = parseInt(params.get('appointmentId'));

    if (!appointmentId) {
        window.location.href = 'driver-dashboard.html';
    }

    // ── Load appointment summary ────────────────────────────────────────────
    (async () => {
        try {
            const a = await AppointmentAPI.getById(appointmentId);
            const start = a.startTime ? new Date(a.startTime) : null;
            const end   = a.endTime   ? new Date(a.endTime)   : null;
            const dateStr = start ? start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
            const timeStr = (start && end) ? start.toTimeString().slice(0,5) + ' – ' + end.toTimeString().slice(0,5) : '—';
            const durH = a.duration ? (a.duration / 60).toFixed(1) + ' hrs' : '—';

            document.getElementById('sum-location').textContent     = a.locationName || '—';
            document.getElementById('sum-booking-code').textContent = a.bookingCode  || '—';
            document.getElementById('sum-slot').textContent         = a.slotNumber   || '—';
            document.getElementById('sum-date').textContent         = dateStr;
            document.getElementById('sum-time').textContent         = timeStr;
            document.getElementById('sum-duration').textContent     = durH;
            document.getElementById('sum-vehicle').textContent      = [a.vehicleNumber, a.vehicleModel].filter(Boolean).join(' · ') || '—';
            document.getElementById('sum-amount').textContent       = a.totalAmount != null ? a.totalAmount.toFixed(2) : '0.00';
            document.getElementById('pay-btn-amount').textContent   = a.totalAmount != null ? a.totalAmount.toFixed(2) : '0.00';
        } catch (e) {
            showPayError('Unable to load booking details. Please go back and try again.');
        }
    })();

    // ── Card number formatter ───────────────────────────────────────────────
    document.getElementById('card-number').addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '').slice(0, 16);
        this.value = val.replace(/(.{4})/g, '$1 ').trim();
        const prefix = val.slice(0, 1);
        const icon = document.getElementById('card-icon');
        if (prefix === '4') icon.textContent = '💳';
        else if (prefix === '5') icon.textContent = '💳';
        else if (prefix === '3') icon.textContent = '💳';
        else icon.textContent = '💳';
    });

    document.getElementById('card-expiry').addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '').slice(0, 4);
        if (val.length >= 3) val = val.slice(0,2) + ' / ' + val.slice(2);
        this.value = val;
    });

    // ── Validation ──────────────────────────────────────────────────────────
    function validate() {
        let ok = true;
        const name   = document.getElementById('card-name').value.trim();
        const number = document.getElementById('card-number').value.replace(/\s/g, '');
        const expiry = document.getElementById('card-expiry').value.replace(/\s/g, '');
        const cvv    = document.getElementById('card-cvv').value.trim();

        setError('err-name',   !name,              'card-name');
        setError('err-number', number.length !== 16, 'card-number');
        setError('err-expiry', expiry.length < 4,   'card-expiry');
        setError('err-cvv',    cvv.length < 3,       'card-cvv');

        if (!name || number.length !== 16 || expiry.length < 4 || cvv.length < 3) ok = false;
        return ok;
    }

    function setError(errId, show, inputId) {
        document.getElementById(errId).style.display = show ? 'block' : 'none';
        document.getElementById(inputId).classList.toggle('error', show);
    }

    function showPayError(msg) {
        const el = document.getElementById('pay-error');
        el.textContent = '⚠ ' + msg;
        el.style.display = 'block';
    }

    // ── Submit payment ───────────────────────────────────────────────────────
    async function submitPayment() {
        document.getElementById('pay-error').style.display = 'none';
        if (!validate()) return;

        const btn = document.getElementById('pay-btn');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div>';

        try {
            const txn = await TransactionAPI.makePayment(appointmentId);
            showSuccess(txn);
        } catch (e) {
            btn.disabled = false;
            btn.innerHTML = `<span id="pay-btn-text">🔒 Pay <span id="pay-btn-amount">${document.getElementById('sum-amount').textContent}</span> LKR</span>`;
            showPayError(e.message || 'Payment failed. Please try again.');
        }
    }

    function showSuccess(txn) {
        document.getElementById('success-ref').textContent    = txn.bookingCode || '';
        document.getElementById('success-amount').textContent = txn.totalAmount.toFixed(2) + ' LKR';
        const overlay = document.getElementById('success-overlay');
        overlay.style.display = 'flex';
    }

    function returnToDashboard() {
        window.location.href = 'driver-dashboard.html?tab=bookings';
    }