const VEHICLE_API = "http://localhost:8080/api/vehicles";

// Save Vehicle
function addVehicle() {
    const vehicleData = {
        vehicleNumber: $('#vNumber').val(),
        vehicleType: $('#vType').val(),
        model: $('#vModel').val(),
        color: $('#vColor').val()
    };

    $.ajax({
        url: VEHICLE_API,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(vehicleData),
        success: function (res) {
            alert("Vehicle added!");
            loadMyVehicles();
        }
    });
}

// Load Vehicles
function loadMyVehicles() {
    $.get(VEHICLE_API, function (data) {
        // UI එක update කිරීමේ logic එක මෙහි ලියන්න
    });
}
