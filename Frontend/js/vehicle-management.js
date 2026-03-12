const VEHICLE_API = "http://localhost:8080/api/vehicles";

function addNewVehicle() {
    // Form එකෙන් දත්ත ලබා ගැනීම
    const vehicleData = {
        vehicleNumber: $('#vNumberInput').val(), // HTML input ID එකට අනුව වෙනස් කරන්න
        vehicleType: $('#vTypeSelect').val(),
        model: $('#vModelInput').val(),
        color: $('#vColorInput').val()
    };

    if (!vehicleData.vehicleNumber || !vehicleData.model) {
        alert("Please fill required fields.");
        return;
    }

    $.ajax({
        url: VEHICLE_API,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(vehicleData),
        success: function (res) {
            alert("Vehicle " + res.vehicleNumber + " added successfully!");
            // Dashboard එක refresh කිරීමට හෝ ලැයිස්තුවට එකතු කිරීමට මෙතැන ලියන්න
        },
        error: function (err) {
            alert("Error adding vehicle. Please try again.");
        }
    });
}