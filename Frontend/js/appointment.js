const APPOINTMENT_API = "http://localhost:8080/api/appointments";

function createBooking() {
    const bookingData = {
        vehicleId: $('#selectedVehicle').val(),
        slotId: $('#selectedSlot').val(),
        startTime: $('#startTime').val(),
        endTime: $('#endTime').val(),
        totalAmount: $('#price-total').text().replace(" LKR", "")
    };

    $.ajax({
        url: APPOINTMENT_API,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(bookingData),
        success: function (res) {
            alert("Booking request sent!");
        }
    });
}