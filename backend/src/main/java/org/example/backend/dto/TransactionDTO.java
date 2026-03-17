package org.example.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TransactionDTO {

    private Long id;
    private double totalAmount;
    private double commission;
    private double ownerEarning;
    private String status;
    private LocalDateTime paymentDate;
    private Long appointmentId;

    // Display fields — populated by the service
    private String bookingCode;
    private String driverFirstName;
    private String driverLastName;
    private String ownerFirstName;
    private String ownerLastName;
    private String vehicleNumber;
    private String vehicleType;
    private String slotNumber;
    private String locationName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

}
