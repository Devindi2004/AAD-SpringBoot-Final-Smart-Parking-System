// 1. Download QR Code as Image
function downloadQRCode() {
    const qrElement = document.querySelector('.qr-wrapper');

    html2canvas(qrElement).then(canvas => {
        const link = document.createElement('a');
        link.download = 'ParkSmart-QR.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

// 2. Share QR Code
function shareQRCode() {
    const choice = prompt("How would you like to share? \n1. Email \n2. WhatsApp");

    if (choice === "1") {
        const email = prompt("Enter recipient email:");
        if (email) {
            const subject = "My ParkSmart Booking QR";
            const body = "Hi, please find my booking details and QR code for ParkSmart.";
            window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
    }
    else if (choice === "2") {
        const phone = prompt("Enter WhatsApp number (with country code, e.g., 94712345678):");
        if (phone) {
            const message = "Hi, this is my ParkSmart Booking QR code.";
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        }
    }
}