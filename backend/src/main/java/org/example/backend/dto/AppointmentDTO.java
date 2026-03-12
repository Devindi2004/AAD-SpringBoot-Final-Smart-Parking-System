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
    private Long driverId;
    private Long slotId;
    private Long vehicleId;

}