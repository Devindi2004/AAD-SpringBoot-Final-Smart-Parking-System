package org.example.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AppointmentDTO {

    private Long id;
    private String bookingCode;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int duration;
    private double totalAmount;
    private double commission;
    private String status;
    private String paymentStatus;
    private LocalDateTime createdAt;
    private Long driverId;
    private Long slotId;
    private Long vehicleId;

    // Display fields — populated by the service, not required on create
    private String driverFirstName;
    private String driverLastName;
    private String vehicleNumber;
    private String vehicleModel;
    private String vehicleColor;
    private String vehicleType;
    private String slotNumber;
    private String locationName;
    private double pricePerHour;

}
