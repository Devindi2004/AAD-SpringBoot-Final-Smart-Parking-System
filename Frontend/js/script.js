const VEHICLE_URL = "http://localhost:8080/api/vehicles";

// --- VEHICLE ACTIONS ---

function addNewVehicle() {
    const data = {
        vehicleNumber: $('#v_number').val(),
        vehicleType: $('#v_type').val(),
        model: $('#v_model').val(),
        color: $('#v_color').val()
    };

    if(!data.vehicleNumber || !data.model) {
        alert("Please fill in the required fields!");
        return;
    }

    $.ajax({
        url: VEHICLE_URL,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function(response) {
            alert("Vehicle Added Successfully!");
            $('#v_number, #v_model, #v_color').val('');
        },
        error: function(err) {
            alert("Error saving vehicle. Please check backend connection.");
        }
    });
}

// --- QR ACTIONS ---

// Download QR as Image
function downloadQR() {
    const element = document.getElementById('qr-capture-area');
    html2canvas(element).then(canvas => {
        const link = document.createElement('a');
        link.download = 'ParkSmart-Booking-QR.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

// Share Options (Email / WhatsApp)
function openShareOptions() {
    const shareChoice = prompt("Choose Share Method:\n1. Email\n2. WhatsApp\n(Enter 1 or 2)");

    const bookingID = document.getElementById('display-bid').textContent;
    const message = `ParkSmart Booking Details - ID: ${bookingID}. Check my QR code for arrival.`;

    if (shareChoice === "1") {
        const email = prompt("Enter Recipient Email Address:");
        if (email) {
            window.location.href = `mailto:${email}?subject=ParkSmart Booking QR&body=${encodeURIComponent(message)}`;
        }
    } else if (shareChoice === "2") {
        const phone = prompt("Enter WhatsApp Number (with country code, e.g., 94712345678):");
        if (phone) {
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        }
    } else {
        alert("Invalid selection!");
    }
}

// Existing showView function (Keep this as is)
function showView(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');

    if (btn) {
        const parent = btn.closest('.nav-section') || btn.closest('aside');
        if (parent) parent.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        btn.classList.add('active');
    }

    const titles = {
        'driver-dashboard': 'Driver Dashboard',
        'driver-vehicles': 'My Vehicles',
        'driver-qr': 'My QR Code'
        // Add other titles here...
    };
    const titleEl = document.getElementById('topbar-title');
    if (titleEl && titles[id]) titleEl.textContent = titles[id];
}