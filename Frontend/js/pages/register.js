/**
 * ParkSmart — Registration Page
 * Depends on: api.config.js, user.api.js
 */

// --- Read role from URL ---
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') || 'DRIVER';
    const isDriver = role === 'DRIVER';
    const isOwner  = role === 'OWNER';

    // --- Configure UI based on role ---
    function setupPage() {
        const accentColor = isDriver ? 'var(--accent)' : 'var(--warning)';

        // Left panel
        document.getElementById('leftRoleTag').className = 'role-tag ' + (isDriver ? 'driver' : 'owner');
        document.getElementById('leftRoleTag').textContent = isDriver ? '🚗  Driver Account' : '🏢  Parking Owner Account';

        document.getElementById('leftHeroTitle').innerHTML = isDriver
            ? 'Start Your <span class="hl-green">Smart Parking</span> Journey'
            : 'List Your Parking,<br><span class="hl-orange">Grow Your Earnings</span>';

        document.getElementById('leftHeroSub').textContent = isDriver
            ? 'Create your driver account to find and book parking slots near you, manage your vehicles, and check in with QR codes.'
            : 'Create your owner account to list your parking spaces, manage booking requests, and track your daily earnings in real time.';

        document.getElementById('stepLabel').textContent = isDriver
            ? 'Complete your driver profile'
            : 'Complete your owner profile';

        // Benefits
        const benefits = isDriver ? [
            { icon: '📍', cls: 'green',  title: 'Live Map View',     desc: 'See available parking spots near you in real time.' },
            { icon: '📅', cls: 'orange', title: 'Advance Booking',   desc: 'Reserve slots before you even leave home.' },
            { icon: '📱', cls: 'purple', title: 'QR Check-in',       desc: 'Quick and seamless QR code based entry.' },
            { icon: '🚗', cls: 'red',    title: 'Multi-Vehicle',     desc: 'Manage all your vehicles from one account.' },
        ] : [
            { icon: '💰', cls: 'orange', title: 'Earn Daily',        desc: 'Generate income from your idle parking space.' },
            { icon: '📋', cls: 'green',  title: 'Slot Management',   desc: 'Full control over your available slots and pricing.' },
            { icon: '✅', cls: 'purple', title: 'Approve Requests',  desc: 'Accept or reject booking requests instantly.' },
            { icon: '📊', cls: 'red',    title: 'Earnings Analytics',desc: 'View daily, weekly, and monthly revenue breakdowns.' },
        ];

        document.getElementById('benefitList').innerHTML = benefits.map(b => `
            <div class="benefit-item">
                <div class="benefit-icon ${b.cls}">${b.icon}</div>
                <div class="benefit-text">
                    <div class="b-title">${b.title}</div>
                    <div class="b-desc">${b.desc}</div>
                </div>
            </div>
        `).join('');

        // Right panel
        document.getElementById('formRoleTag').className = 'form-role-tag ' + (isDriver ? 'driver' : 'owner');
        document.getElementById('formRoleTag').textContent = isDriver ? '🚗  Driver Account' : '🏢  Owner Account';

        document.getElementById('formTitle').textContent = isDriver
            ? 'Create Driver Account'
            : 'Create Owner Account';

        document.getElementById('submitBtn').className = 'btn-register ' + (isDriver ? 'driver' : 'owner');

        // Owner inputs use orange focus
        if (isOwner) {
            document.querySelectorAll('.form-control').forEach(el => {
                el.addEventListener('focus', () => el.style.borderColor = 'rgba(255,176,32,0.4)');
                el.addEventListener('blur',  () => el.style.borderColor = '');
            });
        }

        // Update page title
        document.title = `ParkSmart — ${isDriver ? 'Driver' : 'Owner'} Registration`;
    }

    setupPage();

    // --- Password helpers ---
    function togglePass(id, btn) {
        const input = document.getElementById(id);
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.textContent = input.type === 'password' ? '👁' : '🙈';
    }

    function checkStrength() {
        const val = document.getElementById('regPassword').value;
        const bars  = [document.getElementById('sb1'), document.getElementById('sb2'),
                       document.getElementById('sb3'), document.getElementById('sb4')];
        const label = document.getElementById('strengthLabel');

        let score = 0;
        if (val.length >= 8)            score++;
        if (/[A-Z]/.test(val))          score++;
        if (/[0-9]/.test(val))          score++;
        if (/[^A-Za-z0-9]/.test(val))   score++;

        const colors = ['#ff4757', '#ffb020', '#00e5a0', '#00e5a0'];
        const labels = ['Too short', 'Weak', 'Good', 'Strong'];

        bars.forEach((b, i) => {
            b.style.background = i < score ? colors[score - 1] : '';
        });

        label.textContent = val.length === 0 ? 'Enter a password' : labels[score - 1] || 'Too short';
        label.style.color = val.length === 0 ? 'var(--text-dim)' : colors[score - 1] || '#ff4757';
    }

    // --- Form validation & submit ---
    async function handleRegister() {
        const errorMsg  = document.getElementById('errorMsg');
        const errorText = document.getElementById('errorText');

        const firstName = document.getElementById('firstName').value.trim();
        const lastName  = document.getElementById('lastName').value.trim();
        const email     = document.getElementById('regEmail').value.trim();
        const phone     = document.getElementById('regPhone').value.trim();
        const password  = document.getElementById('regPassword').value;
        const confirm   = document.getElementById('regConfirm').value;
        const terms     = document.getElementById('termsCheck').checked;

        if (!firstName || !lastName) {
            showError('Please enter your full name.'); return;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('Please enter a valid email address.'); return;
        }
        if (!phone) {
            showError('Please enter your phone number.'); return;
        }
        if (password.length < 8) {
            showError('Password must be at least 8 characters.'); return;
        }
        if (password !== confirm) {
            showError('Passwords do not match.'); return;
        }
        if (!terms) {
            showError('Please accept the Terms of Service to continue.'); return;
        }

        errorMsg.classList.remove('show');

        const payload = {
            firstName,
            lastName,
            email,
            phone,
            password,
            role,
            status: 'ACTIVE',
        };

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account…';

        try {
            await UserAPI.register(payload);
            // Success — redirect to login with a flag so we can show a welcome message
            window.location.href = `../index.html?registered=true`;
        } catch (err) {
            showError(err.message || 'Registration failed. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Account &nbsp;→';
        }
    }

    function showError(msg) {
        document.getElementById('errorText').textContent = msg;
        document.getElementById('errorMsg').classList.add('show');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }