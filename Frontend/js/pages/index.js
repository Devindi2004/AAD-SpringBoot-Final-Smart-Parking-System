/**
 * ParkSmart — Login / Index Page
 * Depends on: api.config.js, auth.api.js
 */

function togglePass(id, btn) {
        const input = document.getElementById(id);
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.textContent = input.type === 'password' ? '👁' : '🙈';
    }

    function openRoleModal() {
        document.getElementById('roleModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeRoleModal() {
        document.getElementById('roleModal').classList.remove('active');
        document.body.style.overflow = '';
    }

    function closeOnOverlay(e) {
        if (e.target === document.getElementById('roleModal')) closeRoleModal();
    }

    function goToRegister(role) {
        window.location.href = `pages/register.html?role=${role}`;
    }

    async function handleLogin() {
        const email     = document.getElementById('loginEmail').value.trim();
        const password  = document.getElementById('loginPassword').value;
        const errorMsg  = document.getElementById('errorMsg');
        const errorText = document.getElementById('errorText');
        const btn       = document.querySelector('.btn-login');

        if (!email || !password) {
            errorText.textContent = 'Please enter your email and password.';
            errorMsg.classList.add('show');
            return;
        }
        errorMsg.classList.remove('show');

        btn.disabled = true;
        btn.textContent = 'Signing in…';

        try {
            const user = await AuthAPI.login({ email, password });
            redirectToDashboard(user);
        } catch (err) {
            errorText.textContent = err.message || 'Login failed. Please try again.';
            errorMsg.classList.add('show');
            btn.disabled = false;
            btn.innerHTML = 'Sign In &nbsp;→';
        }
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeRoleModal();
    });

    // Show success toast if redirected after registration
    (function checkRegistered() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') !== 'true') return;

        const toast = document.createElement('div');
        toast.style.cssText = `
            position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
            background:#161b22; border:1px solid rgba(0,229,160,0.3);
            color:#e6edf3; padding:12px 22px; border-radius:12px;
            font-size:13px; font-weight:600; z-index:999;
            display:flex; align-items:center; gap:10px;
            box-shadow:0 8px 32px rgba(0,0,0,0.4);
            animation: fadeInUp 0.3s ease;
        `;
        toast.innerHTML = '<span style="color:#00e5a0;font-size:16px">✓</span> Account created! Sign in to continue.';
        document.body.appendChild(toast);

        // Clean URL without reload
        window.history.replaceState({}, '', window.location.pathname);

        setTimeout(() => toast.remove(), 4000);
    })();