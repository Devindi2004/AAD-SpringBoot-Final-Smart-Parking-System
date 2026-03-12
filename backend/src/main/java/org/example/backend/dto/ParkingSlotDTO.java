package org.example.backend.dto;

import lombok.Data;

@Data
public class ParkingSlotDTO {

    private Long id;
    private String slotNumber;
    private String status;
    private String vehicleType;
    private Long locationId;
    private String locationName;

}