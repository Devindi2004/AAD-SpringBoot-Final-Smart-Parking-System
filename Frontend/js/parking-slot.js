const SLOT_API = "http://localhost:8080/api/slots";

function saveParkingSlot() {
    const slotData = {
        locationName: $('#locName').val(),
        latitude: $('#lat').val(),
        longitude: $('#lng').val(),
        capacity: $('#capacity').val(),
        ratePerHour: $('#rate').val()
    };

    $.ajax({
        url: SLOT_API,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(slotData),
        success: function (res) {
            alert("Slot created successfully!");
        }
    });
}