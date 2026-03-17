/**
 * ParkSmart — Driver Dashboard
 * Depends on: api.config.js, auth.api.js, location.api.js, slot.api.js, vehicle.api.js, appointment.api.js, transaction.api.js
 */

(function () {
        const user = getCurrentUser();
        if (!user) { window.location.href = '/index.html'; return; }
        const initials = ((user.firstName || '')[0] || '') + ((user.lastName || '')[0] || '');
        document.getElementById('sidebar-avatar').textContent = initials.toUpperCase() || '?';
        document.getElementById('sidebar-name').textContent = (user.firstName || '') + ' ' + (user.lastName || '');
        const roleLabels = { DRIVER: 'Driver', OWNER: 'Parking Owner', ADMIN: 'System Administrator' };
        document.getElementById('sidebar-role').textContent = roleLabels[user.role] || user.role;
    })();

    document.getElementById('topbar-date').textContent =
        new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' });

    // Redirect back to bookings tab if coming from payment gateway
    (function () {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tab') === 'bookings') {
            const bookingsBtn = document.querySelector('[onclick*="driver-bookings"]');
            if (bookingsBtn) bookingsBtn.click();
        }
    })();

    // ── Dark map style ─────────────────────────────────────────────────────────
    const DARK_MAP_STYLES = [
        { elementType: 'geometry',            stylers: [{ color: '#1c2230' }] },
        { elementType: 'labels.text.stroke',  stylers: [{ color: '#1c2230' }] },
        { elementType: 'labels.text.fill',    stylers: [{ color: '#8b949e' }] },
        { featureType: 'road',       elementType: 'geometry',        stylers: [{ color: '#212840' }] },
        { featureType: 'road',       elementType: 'geometry.stroke', stylers: [{ color: '#161b22' }] },
        { featureType: 'road',       elementType: 'labels.text.fill',stylers: [{ color: '#6e7681' }] },
        { featureType: 'water',      elementType: 'geometry',        stylers: [{ color: '#0d1117' }] },
        { featureType: 'poi',        elementType: 'geometry',        stylers: [{ color: '#1c2230' }] },
        { featureType: 'poi',        elementType: 'labels',          stylers: [{ visibility: 'off' }] },
        { featureType: 'transit',    elementType: 'geometry',        stylers: [{ color: '#1c2230' }] },
        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#212840' }] },
    ];

    // ── Map state ──────────────────────────────────────────────────────────────
    let nearbyMap = null, fullMap = null;
    let allLocations = [], selectedLocation = null;

    // ── Theme toggle ───────────────────────────────────────────────────────────
    (function () {
        const btn = document.getElementById('theme-toggle-btn');
        function applyTheme(light) {
            document.body.classList.toggle('light', light);
            btn.textContent = light ? '🌙' : '☀️';
            btn.title = light ? 'Switch to night mode' : 'Switch to day mode';
            const styles = light ? [] : DARK_MAP_STYLES;
            if (nearbyMap) nearbyMap.setOptions({ styles });
            if (fullMap)   fullMap.setOptions({ styles });
        }
        applyTheme(localStorage.getItem('theme') === 'light');
        btn.addEventListener('click', function () {
            const isLight = !document.body.classList.contains('light');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            applyTheme(isLight);
        });
    })();


    // ── Google Maps loader ─────────────────────────────────────────────────────
    window.initDriverMap = function () { /* stub — maps init lazily */ };
    (function () {
        const s = document.createElement('script');
        s.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&callback=initDriverMap&loading=async`;
        s.async = true; s.defer = true;
        document.head.appendChild(s);
    })();

    let userPosition = null;   // saved for lazy fullMap init

    function mapStyles() {
        return document.body.classList.contains('light') ? [] : DARK_MAP_STYLES;
    }

    function baseMapOptions(center) {
        return {
            center: center || { lat: 6.9271, lng: 79.8612 }, zoom: 13, styles: mapStyles(),
            mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        };
    }

    let userDotNearby = null, userDotFull = null;
    let userCircleNearby = null, userCircleFull = null;

    function placeUserDot(map, position, accuracy) {
        const icon = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4', fillOpacity: 1,
            strokeColor: '#ffffff', strokeWeight: 3, scale: 10,
        };
        const marker = new google.maps.Marker({ position, map, title: 'Your Location', icon, zIndex: 999 });
        const circle = new google.maps.Circle({
            map, center: position,
            radius: accuracy || 50,
            fillColor: '#4285F4', fillOpacity: 0.12,
            strokeColor: '#4285F4', strokeOpacity: 0.4, strokeWeight: 1,
        });
        return { marker, circle };
    }

    function addLocateMeButton(map) {
        const btn = document.createElement('button');
        btn.title = 'My Location';
        btn.style.cssText = `
            margin:10px;background:#fff;border:none;border-radius:4px;
            width:40px;height:40px;cursor:pointer;font-size:20px;
            box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;
            align-items:center;justify-content:center;`;
        btn.innerHTML = '📍';
        btn.addEventListener('click', function () { locateUser(map); });
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(btn);
    }

    function locateUser(targetMap) {
        if (!navigator.geolocation) {
            showDriverToast('Geolocation is not supported by your browser.', 'error'); return;
        }
        navigator.geolocation.getCurrentPosition(
            function (pos) {
                userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                const accuracy = pos.coords.accuracy;

                // Nearby map dot
                if (userDotNearby) { userDotNearby.marker.setMap(null); userCircleNearby.setMap(null); }
                const nd = placeUserDot(nearbyMap, userPosition, accuracy);
                userDotNearby = nd; userCircleNearby = nd.circle;

                // Full map dot (if already created)
                if (fullMap) {
                    if (userDotFull) { userDotFull.marker.setMap(null); userCircleFull.setMap(null); }
                    const fd = placeUserDot(fullMap, userPosition, accuracy);
                    userDotFull = fd; userCircleFull = fd.circle;
                    if (targetMap === fullMap) { fullMap.setCenter(userPosition); fullMap.setZoom(15); }
                }

                nearbyMap.setCenter(userPosition);
                if (targetMap === nearbyMap) nearbyMap.setZoom(15);
            },
            function (err) {
                const msg = err.code === 1
                    ? 'Location access denied. Please allow location in browser settings.'
                    : 'Unable to retrieve your location.';
                showDriverToast(msg, 'error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    // ── Init nearby map when Maps API loads ────────────────────────────────────
    window.initDriverMap = function () {
        nearbyMap = new google.maps.Map(document.getElementById('nearby-map'), baseMapOptions());
        addLocateMeButton(nearbyMap);
        locateUser(nearbyMap);
        loadLocationsOnMap();
    };

    // ── Init fullMap lazily when Find Parking view is shown ────────────────────
    const _origShowView = showView;
    window.showView = function (id, btn) {
        _origShowView(id, btn);
        if (id === 'driver-map') {
            setTimeout(function () {
                if (!nearbyMap) return;   // Maps API not loaded yet — nothing to do
                if (!fullMap) {
                    fullMap = new google.maps.Map(
                        document.getElementById('full-map'),
                        baseMapOptions(userPosition || undefined)
                    );
                    addLocateMeButton(fullMap);
                    // Place user dot if we already have location
                    if (userPosition) {
                        const fd = placeUserDot(fullMap, userPosition);
                        userDotFull = fd; userCircleFull = fd.circle;
                        fullMap.setCenter(userPosition);
                    }
                    // Place all location markers on fullMap
                    allLocations.forEach(function (loc) {
                        if (!loc.latitude || !loc.longitude) return;
                        const m = new google.maps.Marker({
                            position: { lat: loc.latitude, lng: loc.longitude }, map: fullMap,
                            title: loc.name, icon: makeMarkerIcon(getMarkerColor(loc.availableSlots || 0)),
                        });
                        m.addListener('click', function () { selectLocation(loc); });
                    });
                } else {
                    google.maps.event.trigger(fullMap, 'resize');
                }
            }, 80);
        }
        if (id === 'driver-dashboard') {
            loadDriverDashboard();
            if (nearbyMap) setTimeout(function () { google.maps.event.trigger(nearbyMap, 'resize'); }, 80);
        }
        if (id === 'driver-map' && selectedLocation) {
            // Re-fetch slot availability whenever the map view is shown (picks up owner accept/reject)
            setTimeout(function () { selectLocation(selectedLocation); }, 120);
        }
        if (id === 'driver-bookings') {
            loadBookings();
        }
    };

    // ── Load & place location markers ─────────────────────────────────────────
    async function loadLocationsOnMap() {
        try {
            const locs = await LocationAPI.getAll();
            allLocations = locs.filter(l => l.active);
            allLocations.forEach(placeLocationMarker);
        } catch (e) { console.error('Could not load locations', e); }
    }

    function getMarkerColor(availableSlots) {
        if (availableSlots === 0) return '#ff4757';
        if (availableSlots <= 2) return '#ffb020';
        return '#00e5a0';
    }

    function makeMarkerIcon(color) {
        return {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: color, fillOpacity: 1,
            strokeColor: '#ffffff', strokeWeight: 1.5,
            scale: 2, anchor: new google.maps.Point(12, 22),
        };
    }

    function placeLocationMarker(loc) {
        if (!loc.latitude || !loc.longitude) return;
        const icon = makeMarkerIcon(getMarkerColor(loc.availableSlots || 0));
        const pos  = { lat: loc.latitude, lng: loc.longitude };

        // Nearby map marker — navigates to Find Parking and selects this location
        const nMarker = new google.maps.Marker({ position: pos, map: nearbyMap, title: loc.name, icon });
        nMarker.addListener('click', function () {
            showView('driver-map', null);
            setTimeout(function () { selectLocation(loc); }, 400);
        });
    }

    // ── Slot appointments map (slotId → active appointments[]) ───────────────
    let slotAppointmentsMap = {};
    let currentSlotAppointments = [];   // active bookings for the slot currently in modal

    // ── Location click → populate slot panel ──────────────────────────────────
    async function selectLocation(loc) {
        selectedLocation = loc;
        fullMap.panTo({ lat: loc.latitude, lng: loc.longitude });
        fullMap.setZoom(15);

        const panel = document.getElementById('location-detail-panel');
        panel.innerHTML = `
            <div class="card-header">
                <span>📍</span><span class="card-title" style="flex:1;">${loc.name}</span>
            </div>
            <div class="card-body" style="flex:1;overflow-y:auto;padding:16px;">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">${loc.address}</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
                    <span style="background:rgba(255,176,32,0.1);color:var(--warning);border-radius:8px;padding:4px 10px;font-size:12px;font-weight:600;">
                        ${loc.pricePerHour} LKR / h
                    </span>
                </div>
                <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;">Slots</div>
                <div id="slot-list"><div style="text-align:center;padding:24px;color:var(--text-muted);">Loading slots…</div></div>
            </div>`;

        try {
            // Fetch slots and active bookings in parallel
            const [slots, activeAppts] = await Promise.all([
                SlotAPI.getByLocation(loc.id),
                AppointmentAPI.getActiveByLocation(loc.id).catch(() => []),
            ]);

            // Build slotId → appointments map
            slotAppointmentsMap = {};
            activeAppts.forEach(a => {
                if (!slotAppointmentsMap[a.slotId]) slotAppointmentsMap[a.slotId] = [];
                slotAppointmentsMap[a.slotId].push(a);
            });

            // Show all non-inactive slots — occupancy is time-based, not a DB flag
            const available = slots.filter(s => s.status !== 'INACTIVE');
            const slotList  = document.getElementById('slot-list');
            if (!slotList) return;

            if (available.length === 0) {
                slotList.innerHTML = `<div style="text-align:center;padding:24px;color:var(--danger);">No active slots at this location.</div>`;
                return;
            }

            const vehicleIcons = { CAR:'🚗', BIKE:'🏍', VAN:'🚐', TRUCK:'🚛', THREE_WHEELER:'🛺' };
            const now = new Date();

            slotList.innerHTML = available.map(slot => {
                const appts      = slotAppointmentsMap[slot.id] || [];
                const nowOccupied = appts.some(a => new Date(a.startTime) <= now && new Date(a.endTime) >= now);

                // Booked time chips (future + ongoing)
                const chips = appts.map(a => {
                    const s = new Date(a.startTime);
                    const e = new Date(a.endTime);
                    const dateStr = s.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                    const timeStr = s.toTimeString().slice(0,5) + '–' + e.toTimeString().slice(0,5);
                    return `<span style="display:inline-block;background:rgba(255,71,87,0.12);color:var(--danger);
                                border-radius:6px;padding:2px 8px;font-size:10px;font-weight:600;margin:2px 2px 0 0;">
                                📅 ${dateStr} · ${timeStr}
                            </span>`;
                }).join('');

                return `
                <div class="slot-item" style="flex-direction:column;align-items:stretch;gap:6px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <div>
                            <div style="font-family:'DM Mono',monospace;font-weight:700;font-size:15px;color:var(--accent);">${slot.slotNumber}</div>
                            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${vehicleIcons[slot.vehicleType] || '🚘'} ${slot.vehicleType || '—'}</div>
                        </div>
                        <div style="text-align:right;">
                            ${nowOccupied ? '<div style="font-size:10px;font-weight:700;color:var(--danger);margin-bottom:4px;">● Occupied Now</div>' : '<div style="font-size:10px;font-weight:700;color:var(--accent);margin-bottom:4px;">● Available Now</div>'}
                            <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">${loc.pricePerHour} LKR/h</div>
                            <button class="btn btn-primary btn-sm" onclick="openBookingModal(${slot.id},'${slot.slotNumber}',${loc.pricePerHour})">
                                Request Slot
                            </button>
                        </div>
                    </div>
                    ${appts.length > 0 ? `<div style="padding-top:4px;border-top:1px solid var(--border);">
                        <div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;">BOOKED TIMES:</div>
                        <div>${chips}</div>
                    </div>` : ''}
                </div>`;
            }).join('');
        } catch (e) {
            const sl = document.getElementById('slot-list');
            if (sl) sl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--danger);">${e.message}</div>`;
        }
    }

    // ── Booking modal ──────────────────────────────────────────────────────────
    async function openBookingModal(slotId, slotNumber, pricePerHour) {
        currentSlotAppointments = slotAppointmentsMap[slotId] || [];

        document.getElementById('modal-slot-number').textContent   = slotNumber;
        document.getElementById('modal-location-name').textContent = selectedLocation ? selectedLocation.name : '';
        document.getElementById('modal-price-rate').textContent    = pricePerHour + ' LKR/h';
        document.getElementById('modal-rate-display').textContent  = pricePerHour + ' LKR/h';
        document.getElementById('booking-slot-id').value           = slotId;
        document.getElementById('booking-price-rate').value        = pricePerHour;
        document.getElementById('booking-date').value              = new Date().toISOString().split('T')[0];
        document.getElementById('booking-error').style.display     = 'none';
        document.getElementById('modal-date-hint').style.display   = 'none';

        // Show existing booked times for this slot in the modal
        const scheduleEl = document.getElementById('modal-slot-schedule');
        if (scheduleEl) {
            if (currentSlotAppointments.length > 0) {
                const lines = currentSlotAppointments.map(a => {
                    const s = new Date(a.startTime);
                    const e = new Date(a.endTime);
                    const dateStr = s.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                    return `${dateStr} · ${s.toTimeString().slice(0,5)}–${e.toTimeString().slice(0,5)}`;
                }).join('<br>');
                scheduleEl.innerHTML = `<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Already booked:</div>
                    <div style="font-size:11px;color:var(--danger);font-weight:600;">${lines}</div>`;
                scheduleEl.style.display = 'block';
            } else {
                scheduleEl.style.display = 'none';
            }
        }

        // Populate vehicle selector
        const vehicleSel = document.getElementById('booking-vehicle-id');
        vehicleSel.innerHTML = '<option value="">Loading…</option>';
        try {
            const user     = getCurrentUser();
            const vehicles = await VehicleAPI.getByDriver(user.id);
            driverVehicles = vehicles || [];
            if (vehicles.length === 0) {
                vehicleSel.innerHTML = '<option value="">No vehicles registered — add one first</option>';
            } else {
                vehicleSel.innerHTML = '<option value="">Select your vehicle…</option>' +
                    vehicles.map(v => `<option value="${v.id}">${v.vehicleNumber} — ${v.model} (${v.color || ''})</option>`).join('');
            }
        } catch (e) {
            vehicleSel.innerHTML = '<option value="">Failed to load vehicles</option>';
        }

        calcBookingPrice();
        document.getElementById('booking-modal').classList.add('open');
    }

    function closeBookingModal() {
        document.getElementById('booking-modal').classList.remove('open');
    }

    // Returns sorted bookings on the given date (yyyy-mm-dd) for the current slot
    function bookingsOnDate(date) {
        if (!date || !currentSlotAppointments.length) return [];
        return currentSlotAppointments
            .filter(a => new Date(a.startTime).toISOString().slice(0, 10) === date)
            .slice()
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }

    // Computes free time windows for a date given sorted booked ranges
    function freeWindows(sorted) {
        const windows = [];
        let cursor = '00:00';
        sorted.forEach(a => {
            const bs = new Date(a.startTime).toTimeString().slice(0, 5);
            const be = new Date(a.endTime).toTimeString().slice(0, 5);
            if (cursor < bs) windows.push(cursor + '–' + bs);
            if (be > cursor) cursor = be;
        });
        if (cursor < '23:59') windows.push(cursor + '–23:59');
        return windows;
    }

    function calcBookingPrice() {
        const start  = document.getElementById('booking-start').value;
        const end    = document.getElementById('booking-end').value;
        const date   = document.getElementById('booking-date').value;
        const rate   = parseFloat(document.getElementById('booking-price-rate').value) || 0;
        const errEl  = document.getElementById('booking-error');
        const hintEl = document.getElementById('modal-date-hint');

        // ── Date-specific availability hint ──────────────────────────────────
        const dateBookings = bookingsOnDate(date);
        if (hintEl) {
            if (dateBookings.length > 0) {
                const blocked  = dateBookings.map(a =>
                    new Date(a.startTime).toTimeString().slice(0,5) + '–' + new Date(a.endTime).toTimeString().slice(0,5)
                ).join(', ');
                const free     = freeWindows(dateBookings);
                const freeStr  = free.length ? free.join(', ') : 'None';
                hintEl.innerHTML = `
                    <div style="display:flex;gap:16px;flex-wrap:wrap;">
                        <div>
                            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">⛔ Blocked</div>
                            <div style="font-size:12px;color:var(--danger);font-weight:700;">${blocked}</div>
                        </div>
                        <div>
                            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">✅ Available</div>
                            <div style="font-size:12px;color:var(--accent);font-weight:700;">${freeStr}</div>
                        </div>
                    </div>`;
                hintEl.style.display = 'block';
            } else {
                hintEl.style.display = 'none';
            }
        }

        // ── Price / conflict calculation ──────────────────────────────────────
        if (!start || !end) {
            document.getElementById('modal-price-total').textContent = '—';
            document.getElementById('modal-duration').textContent    = '—';
            return;
        }
        const mins = (end.split(':')[0] * 60 + +end.split(':')[1]) - (start.split(':')[0] * 60 + +start.split(':')[1]);
        if (mins <= 0) {
            document.getElementById('modal-price-total').textContent = '—';
            document.getElementById('modal-duration').textContent    = '—';
            errEl.style.display = 'none';
            return;
        }

        // Overlap check
        if (date && currentSlotAppointments.length > 0) {
            const newStart = new Date(`${date}T${start}:00`);
            const newEnd   = new Date(`${date}T${end}:00`);
            const conflict = currentSlotAppointments.find(a => {
                return newStart < new Date(a.endTime) && newEnd > new Date(a.startTime);
            });
            if (conflict) {
                const cs = new Date(conflict.startTime).toTimeString().slice(0,5);
                const ce = new Date(conflict.endTime).toTimeString().slice(0,5);
                errEl.textContent = `Time conflict: slot is already booked ${cs}–${ce}. Select an available window above.`;
                errEl.style.display = 'block';
                document.getElementById('modal-price-total').textContent = '—';
                document.getElementById('modal-duration').textContent    = '—';
                return;
            }
        }
        errEl.style.display = 'none';

        const hours = mins / 60;
        document.getElementById('modal-duration').textContent    = hours.toFixed(1) + ' h';
        document.getElementById('modal-price-total').textContent = Math.round(hours * rate) + ' LKR';
    }

    async function submitBooking() {
        const user      = getCurrentUser();
        const slotId    = parseInt(document.getElementById('booking-slot-id').value);
        const vehicleId = parseInt(document.getElementById('booking-vehicle-id').value);
        const date      = document.getElementById('booking-date').value;
        const start     = document.getElementById('booking-start').value;
        const end       = document.getElementById('booking-end').value;
        const rate      = parseFloat(document.getElementById('booking-price-rate').value) || 0;
        const errEl     = document.getElementById('booking-error');

        if (!vehicleId) {
            errEl.textContent = 'Please select a vehicle.';
            errEl.style.display = 'block'; return;
        }
        if (!date || !start || !end) {
            errEl.textContent = 'Please fill in all fields.';
            errEl.style.display = 'block'; return;
        }
        const mins = (end.split(':')[0] * 60 + +end.split(':')[1]) - (start.split(':')[0] * 60 + +start.split(':')[1]);
        if (mins <= 0) {
            errEl.textContent = 'End time must be after start time.';
            errEl.style.display = 'block'; return;
        }

        // Final client-side conflict guard before sending to server
        if (currentSlotAppointments.length > 0) {
            const newStart = new Date(`${date}T${start}:00`);
            const newEnd   = new Date(`${date}T${end}:00`);
            const conflict = currentSlotAppointments.find(a =>
                newStart < new Date(a.endTime) && newEnd > new Date(a.startTime)
            );
            if (conflict) {
                const cs = new Date(conflict.startTime).toTimeString().slice(0,5);
                const ce = new Date(conflict.endTime).toTimeString().slice(0,5);
                errEl.textContent = `Cannot submit: slot is already booked ${cs}–${ce}.`;
                errEl.style.display = 'block'; return;
            }
        }
        errEl.style.display = 'none';

        const hours       = mins / 60;
        const totalAmount = Math.round(hours * rate);
        const vehicle     = driverVehicles.find(v => v.id === vehicleId);
        const vehicleLabel = vehicle ? `${vehicle.vehicleNumber} (${VEHICLE_LABELS[vehicle.type] || vehicle.type})` : 'selected vehicle';
        const slotLabel   = document.getElementById('modal-slot-number')?.textContent || `Slot #${slotId}`;
        const summary     = `Vehicle: ${vehicleLabel}\nDate: ${date}  ·  ${start} – ${end}\nSlot: ${slotLabel}\nEstimated total: ${totalAmount} LKR`;

        showConfirm(
            'Confirm Booking',
            summary,
            async () => {
                try {
                    await AppointmentAPI.create({
                        driverId:    user.id,
                        slotId,
                        vehicleId,
                        startTime:   `${date}T${start}:00`,
                        endTime:     `${date}T${end}:00`,
                        duration:    mins,
                        totalAmount,
                    });
                    closeBookingModal();
                    showDriverToast('Booking request submitted successfully!');
                    if (selectedLocation) selectLocation(selectedLocation);
                } catch (e) {
                    errEl.textContent = e.message || 'Failed to submit booking.';
                    errEl.style.display = 'block';
                }
            },
            { okLabel: 'Submit Booking', okClass: 'btn-primary', icon: '🅿', iconBg: 'rgba(0,229,160,0.15)' }
        );
    }

    function showDriverToast(msg, type = 'success') {
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;
            border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.4);
            background:${type === 'success' ? 'var(--accent)' : 'var(--danger)'};
            color:${type === 'success' ? '#000' : '#fff'};`;
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    // Close modal on backdrop click
    document.getElementById('booking-modal').addEventListener('click', function (e) {
        if (e.target === this) closeBookingModal();
    });

    // ── Vehicle management ────────────────────────────────────────────────────
    const VEHICLE_ICONS  = { CAR: '🚗', BIKE: '🏍', VAN: '🚐', TRUCK: '🚛', THREE_WHEELER: '🛺' };
    const VEHICLE_LABELS = { CAR: 'Car', BIKE: 'Bike', VAN: 'Van', TRUCK: 'Truck', THREE_WHEELER: 'Three-Wheeler' };
    let driverVehicles = [];  // cached for duplicate-number check

    function toggleAddVehicleForm() {
        const form = document.getElementById('add-vehicle-form');
        const isHidden = form.style.display === 'none';
        form.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            // Reset form fields and errors when opening
            document.getElementById('veh-number').value = '';
            document.getElementById('veh-type').value   = '';
            document.getElementById('veh-model').value  = '';
            document.getElementById('veh-color').value  = '';
            document.getElementById('veh-year').value   = '';
            document.getElementById('veh-error').style.display = 'none';
            const btn = document.getElementById('veh-submit-btn');
            btn.disabled = false;
            btn.textContent = '+ Add Vehicle';
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    async function submitVehicle() {
        const user   = getCurrentUser();
        const number = document.getElementById('veh-number').value.trim();
        const type   = document.getElementById('veh-type').value;
        const model  = document.getElementById('veh-model').value.trim();
        const color  = document.getElementById('veh-color').value.trim();
        const year   = parseInt(document.getElementById('veh-year').value);
        const errEl  = document.getElementById('veh-error');

        if (!number || !type || !model) {
            errEl.textContent = 'Vehicle Number, Type, and Model are required.';
            errEl.style.display = 'block';
            return;
        }

        // Duplicate vehicle number check
        const duplicate = driverVehicles.find(v => v.vehicleNumber.toLowerCase() === number.toLowerCase());
        if (duplicate) {
            errEl.textContent = `Vehicle number "${number}" is already registered. Each vehicle must have a unique number.`;
            errEl.style.display = 'block';
            return;
        }

        errEl.style.display = 'none';

        const btn = document.getElementById('veh-submit-btn');
        btn.disabled = true;
        btn.textContent = 'Saving…';

        try {
            await VehicleAPI.create({
                vehicleNumber: number,
                type,
                model,
                color,
                year: isNaN(year) ? 0 : year,
                driverId: user.id,
            });
            document.getElementById('add-vehicle-form').style.display = 'none';
            showDriverToast('Vehicle added successfully!');
            loadVehicles();
        } catch (e) {
            errEl.textContent = e.message || 'Failed to add vehicle. Please try again.';
            errEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = '+ Add Vehicle';
        }
    }

    function deleteVehicle(id) {
        const v = driverVehicles.find(v => v.id === id);
        const label = v ? `${v.vehicleNumber} (${VEHICLE_LABELS[v.type] || v.type})` : 'this vehicle';
        showConfirm(
            'Remove Vehicle',
            `Remove ${label} from your account? This cannot be undone.`,
            async () => {
                try {
                    await VehicleAPI.delete(id);
                    showDriverToast('Vehicle removed.');
                    loadVehicles();
                } catch (e) {
                    showDriverToast(e.message || 'Failed to delete vehicle.', 'error');
                }
            },
            { okLabel: 'Remove', okClass: 'btn-danger', icon: '🗑️', iconBg: 'rgba(255,71,87,0.15)' }
        );
    }

    // ── Bookings tab ──────────────────────────────────────────────────────────
    let _allBookings = [];
    let _activeBookingFilter = 'ALL';

    async function loadBookings() {
        const user  = getCurrentUser();
        const tbody = document.getElementById('bookings-tbody');
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted);">Loading…</td></tr>';

        try {
            _allBookings = await AppointmentAPI.getByDriver(user.id);

            // Update nav badge with PENDING count
            const pendingCount = _allBookings.filter(a => a.status === 'PENDING').length;
            const badge = document.getElementById('bookings-badge');
            if (badge) {
                badge.textContent = pendingCount;
                badge.style.display = pendingCount > 0 ? '' : 'none';
            }

            renderBookingsTable(_activeBookingFilter);
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--danger);">Failed to load bookings: ${e.message || 'Unknown error'}</td></tr>`;
        }
    }

    function filterBookings(btn) {
        document.querySelectorAll('#bookings-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _activeBookingFilter = btn.dataset.filter;
        renderBookingsTable(_activeBookingFilter);
    }

    function renderBookingsTable(filter) {
        const tbody = document.getElementById('bookings-tbody');
        const rows  = filter === 'ALL' ? _allBookings : _allBookings.filter(a => a.status === filter);

        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted);">No bookings found.</td></tr>`;
            return;
        }

        const statusClass = { PENDING: 'status-pending', ACTIVE: 'status-active', COMPLETED: 'status-completed', REJECTED: 'status-rejected', CANCELLED: 'status-rejected' };
        const statusLabel = { PENDING: 'Pending', ACTIVE: 'Active', COMPLETED: 'Completed', REJECTED: 'Rejected', CANCELLED: 'Cancelled' };

        tbody.innerHTML = rows.map(a => {
            const start  = a.startTime ? new Date(a.startTime) : null;
            const end    = a.endTime   ? new Date(a.endTime)   : null;
            const dateStr = start ? start.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : '—';
            const timeStr = (start && end)
                ? start.toTimeString().slice(0,5) + '–' + end.toTimeString().slice(0,5)
                : '—';
            const durH = a.duration ? (a.duration / 60).toFixed(1) + 'h' : '—';
            const loc  = [a.locationName, a.slotNumber].filter(Boolean).join(' · ') || '—';
            const pill = `<span class="status-pill ${statusClass[a.status] || ''}">${statusLabel[a.status] || a.status}</span>`;

            const isPaid = a.paymentStatus === 'PAID';
            const paymentCell = isPaid
                ? `<span class="status-pill status-active" style="font-size:11px;">✓ Paid</span>`
                : (a.status === 'ACTIVE'
                    ? `<span class="status-pill status-pending" style="font-size:11px;">Pending</span>`
                    : `<span style="font-size:11px;color:var(--text-muted)">—</span>`);

            let action = '';
            if (a.status === 'PENDING') {
                action = `<button class="btn btn-danger btn-sm" onclick="cancelBooking(${a.id})">Cancel</button>`;
            } else if (a.status === 'ACTIVE') {
                if (!isPaid) {
                    action = `<button class="btn btn-primary btn-sm" onclick="goToPayment(${a.id})">Make Payment</button>`;
                } else {
                    action = `<button class="btn btn-ghost btn-sm" onclick="openQRModal(${a.id}, '${a.bookingCode || ''}', '${a.locationName || ''}', '${a.slotNumber || ''}', '${a.vehicleNumber || ''}', '${dateStr}', '${timeStr}')">View QR</button>`;
                }
            } else if (a.status === 'COMPLETED') {
                action = `<button class="btn btn-ghost btn-sm">Receipt</button>`;
            }

            return `<tr>
                <td><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--accent)">${a.bookingCode || '—'}</span></td>
                <td>${loc}</td>
                <td>${a.vehicleNumber || '—'}</td>
                <td style="font-size:12px;">${dateStr} · ${timeStr}</td>
                <td>${durH}</td>
                <td style="font-family:'DM Mono',monospace;">${a.totalAmount != null ? a.totalAmount + ' LKR' : '—'}</td>
                <td>${pill}</td>
                <td>${paymentCell}</td>
                <td>${action}</td>
            </tr>`;
        }).join('');
    }

    async function cancelBooking(id) {
        if (!confirm('Cancel this booking request?')) return;
        try {
            await AppointmentAPI.updateStatus(id, 'CANCELLED');
            showDriverToast('Booking cancelled.');
            loadBookings();
        } catch (e) {
            showDriverToast(e.message || 'Failed to cancel booking.', 'error');
        }
    }

    function goToPayment(appointmentId) {
        window.location.href = `payment-gateway.html?appointmentId=${appointmentId}`;
    }

    async function loadVehicles() {
        const user    = getCurrentUser();
        const grid    = document.getElementById('vehicle-grid');
        const addCard = document.getElementById('add-vehicle-card');

        // Remove previously rendered vehicle cards (keep the dashed add card)
        [...grid.querySelectorAll('.vehicle-card:not(#add-vehicle-card)')].forEach(el => el.remove());

        try {
            const vehicles = await VehicleAPI.getByDriver(user.id);
            driverVehicles = vehicles || [];

            // Update dashboard stat card
            const countEl  = document.getElementById('dash-vehicle-count');
            const detailEl = document.getElementById('dash-vehicle-detail');
            if (countEl) countEl.textContent = vehicles.length;
            if (detailEl) {
                const typeCounts = {};
                vehicles.forEach(v => { typeCounts[v.type] = (typeCounts[v.type] || 0) + 1; });
                detailEl.textContent = Object.entries(typeCounts)
                    .map(([t, n]) => `${n} ${VEHICLE_LABELS[t] || t}`)
                    .join(', ') || 'No vehicles yet';
            }

            vehicles.forEach(v => {
                const card = document.createElement('div');
                card.className = 'vehicle-card';
                card.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div class="vehicle-type-icon">${VEHICLE_ICONS[v.type] || '🚘'}</div>
                        <span class="status-pill status-active" style="font-size:10px;padding:3px 8px;">${VEHICLE_LABELS[v.type] || v.type}</span>
                    </div>
                    <div class="vehicle-number">${v.vehicleNumber}</div>
                    <div style="font-size:13px;font-weight:600;margin:4px 0;">${v.model}</div>
                    <div class="vehicle-detail">${v.color ? v.color + ' · ' : ''}${v.year || '—'}</div>
                    <div style="display:flex;gap:6px;margin-top:12px;">
                        <button class="btn btn-danger btn-sm" style="flex:1" onclick="deleteVehicle(${v.id})">Delete</button>
                    </div>`;
                grid.insertBefore(card, addCard);
            });
        } catch (e) {
            console.error('Could not load vehicles', e);
            showDriverToast('Failed to load vehicles: ' + (e.message || 'Unknown error'), 'error');
        }
    }

    // ── QR Code Modal ─────────────────────────────────────────────────────────
    function openQRModal(appointmentId, bookingCode, locationName, slotNumber, vehicleNumber, dateStr, timeStr) {
        const overlay = document.getElementById('qr-modal-overlay');
        overlay.style.display = 'flex';

        document.getElementById('qr-booking-code').textContent = bookingCode;
        document.getElementById('qr-booking-detail').innerHTML =
            `📍 ${locationName} · Slot ${slotNumber}<br>🚗 ${vehicleNumber}<br>📅 ${dateStr} · ${timeStr}`;

        // Clear previous QR
        const container = document.getElementById('qr-canvas-container');
        container.innerHTML = '';

        const qr = new QRCode(container, {
            text: String(appointmentId),
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H,
        });

        // Wire download button after QR renders
        document.getElementById('qr-download-btn').onclick = function () {
            setTimeout(() => {
                const img = container.querySelector('img');
                const canvas = container.querySelector('canvas');
                const src = (img && img.src) || (canvas && canvas.toDataURL('image/png'));
                if (!src) return;
                const a = document.createElement('a');
                a.href = src;
                a.download = `ParkSmart-${bookingCode}.png`;
                a.click();
            }, 100);
        };
    }

    function closeQRModal() {
        document.getElementById('qr-modal-overlay').style.display = 'none';
    }

    // ── Driver Dashboard Stats ────────────────────────────────────────────────
    function driverFmt(val) {
        return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    const STATUS_CLASS = { PENDING: 'status-pending', ACTIVE: 'status-active', COMPLETED: 'status-completed', REJECTED: 'status-rejected', CANCELLED: 'status-rejected' };
    const STATUS_LABEL = { PENDING: 'Pending', ACTIVE: 'Active', COMPLETED: 'Completed', REJECTED: 'Rejected', CANCELLED: 'Cancelled' };
    const STATUS_COLOR = { ACTIVE: 'rgba(0,229,160,0.1)', PENDING: 'rgba(255,176,32,0.1)', COMPLETED: 'rgba(108,99,255,0.1)', REJECTED: 'rgba(255,71,87,0.1)', CANCELLED: 'rgba(255,71,87,0.1)' };

    async function loadDriverDashboard() {
        const user = getCurrentUser();
        if (!user) return;

        let appointments = [];
        try {
            appointments = await AppointmentAPI.getByDriver(user.id);
        } catch (e) {
            console.error('Failed to load driver appointments', e);
        }

        // ── Active Bookings tile ──────────────────────────────────────────────
        const activeAppts = appointments.filter(a => a.status === 'ACTIVE');
        document.getElementById('dash-active-bookings').textContent = activeAppts.length;
        document.getElementById('dash-active-detail').textContent   =
            activeAppts.length === 0 ? 'No active bookings' : 'currently active';

        // ── Total Hours Parked tile (COMPLETED only) ──────────────────────────
        const totalMinutes = appointments
            .filter(a => a.status === 'COMPLETED')
            .reduce((s, a) => s + (a.duration || 0), 0);
        const totalHours = (totalMinutes / 60).toFixed(1);
        document.getElementById('dash-hours-parked').textContent = totalHours + 'h';
        document.getElementById('dash-hours-detail').textContent =
            totalMinutes === 0 ? 'No completed bookings yet' : 'from completed bookings';

        // ── Amount Spent this month (PAID appointments) ───────────────────────
        const now = new Date();
        const monthlySpent = appointments
            .filter(a => {
                if (a.paymentStatus !== 'PAID' || !a.startTime) return false;
                const d = new Date(a.startTime);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })
            .reduce((s, a) => s + (a.totalAmount || 0), 0);
        document.getElementById('dash-amount-spent').textContent = driverFmt(monthlySpent);
        document.getElementById('dash-amount-detail').textContent = 'LKR this month';

        // ── Active Booking card (most recently created ACTIVE) ────────────────
        const cardBody = document.getElementById('active-booking-card-body');
        if (activeAppts.length === 0) {
            cardBody.innerHTML = `
                <div style="text-align:center;padding:28px 16px;color:var(--text-muted);">
                    <div style="font-size:36px;margin-bottom:10px;">🅿</div>
                    <div style="font-size:13px;">No active bookings right now.</div>
                    <button class="btn btn-primary btn-sm" style="margin-top:14px;"
                        onclick="document.querySelector('[onclick*=driver-map]').click()">Find Parking →</button>
                </div>`;
        } else {
            const a = activeAppts.sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt))[0];
            const start   = a.startTime ? new Date(a.startTime) : null;
            const end     = a.endTime   ? new Date(a.endTime)   : null;
            const timeStr = (start && end) ? start.toTimeString().slice(0,5) + ' – ' + end.toTimeString().slice(0,5) : '—';
            const veh     = [a.vehicleNumber, a.vehicleColor, a.vehicleModel].filter(Boolean).join(' · ') || '—';

            cardBody.innerHTML = `
                <div class="qr-card">
                    <div id="dash-active-qr" style="width:160px;height:160px;margin:0 auto 12px;border-radius:10px;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;"></div>
                    <div class="qr-id">BOOKING #${a.bookingCode || '—'}</div>
                    <div class="qr-booking">Slot ${a.slotNumber || '—'}, ${a.locationName || '—'}</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">${timeStr} · ${veh}</div>
                    <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                        <span class="status-pill status-active">● Active</span>
                        ${a.paymentStatus === 'PAID'
                            ? `<span class="status-pill status-active" style="font-size:11px;">✓ Paid</span>`
                            : `<button class="btn btn-primary btn-sm" onclick="goToPayment(${a.id})">Make Payment</button>`}
                    </div>
                </div>`;

            // Generate real QR
            setTimeout(() => {
                const qrContainer = document.getElementById('dash-active-qr');
                if (qrContainer && typeof QRCode !== 'undefined') {
                    new QRCode(qrContainer, {
                        text: String(a.id),
                        width: 160, height: 160,
                        colorDark: '#000000', colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.M,
                    });
                }
            }, 100);
        }

        // ── Recent Bookings list (last 3 by createdAt) ────────────────────────
        const listEl = document.getElementById('recent-bookings-list');
        if (appointments.length === 0) {
            listEl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);">No bookings yet.</div>`;
            return;
        }

        const recent = appointments
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        listEl.innerHTML = recent.map((a, idx) => {
            const start   = a.startTime ? new Date(a.startTime) : null;
            const end     = a.endTime   ? new Date(a.endTime)   : null;
            const dateStr = start ? start.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';
            const timeStr = (start && end) ? start.toTimeString().slice(0,5) + '–' + end.toTimeString().slice(0,5) : '—';
            const durH    = a.duration ? (a.duration / 60).toFixed(1) + 'h' : '—';
            const isLast  = idx === recent.length - 1;
            return `
                <div style="display:flex;align-items:center;gap:14px;padding:10px 0;${isLast ? '' : 'border-bottom:1px solid var(--border);'}">
                    <div style="width:36px;height:36px;background:${STATUS_COLOR[a.status] || 'rgba(255,255,255,0.05)'};border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">🅿</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${a.locationName || '—'} · Slot ${a.slotNumber || '—'}
                        </div>
                        <div style="font-size:11px;color:var(--text-muted);">${dateStr} · ${timeStr} · ${a.vehicleNumber || '—'} · ${durH}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;font-family:'DM Mono',monospace">${a.totalAmount != null ? driverFmt(a.totalAmount) + ' LKR' : '—'}</div>
                        <span class="status-pill ${STATUS_CLASS[a.status] || ''}">${STATUS_LABEL[a.status] || a.status}</span>
                    </div>
                </div>`;
        }).join('');
    }

    // Load dashboard on startup
    loadDriverDashboard();

    // ── Confirm Modal ─────────────────────────────────────────────────────────
    function showConfirm(title, message, onConfirm, { okLabel = 'Confirm', okClass = 'btn-danger', iconBg = 'rgba(255,71,87,0.15)', icon = '⚠️' } = {}) {
        const modal  = document.getElementById('driver-confirm-modal');
        const okBtn  = document.getElementById('driver-confirm-ok-btn');
        const cancel = document.getElementById('driver-confirm-cancel-btn');
        document.getElementById('driver-confirm-title').textContent = title;
        document.getElementById('driver-confirm-msg').textContent   = message;
        document.getElementById('driver-confirm-icon').textContent  = icon;
        document.getElementById('driver-confirm-icon').style.background = iconBg;
        okBtn.textContent = okLabel;
        okBtn.className   = `btn ${okClass}`;
        modal.classList.add('open');
        const close = () => modal.classList.remove('open');
        const handleOk       = () => { close(); onConfirm(); };
        const handleCancel   = () => close();
        const handleBackdrop = (e) => { if (e.target === modal) close(); };
        okBtn.addEventListener('click', handleOk, { once: true });
        cancel.addEventListener('click', handleCancel, { once: true });
        modal.addEventListener('click', handleBackdrop, { once: true });
    }