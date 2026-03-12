package org.example.backend.dto;

import lombok.Data;

@Data
public class ParkingLocationDTO {

    private Long id;
    private String name;
    private String address;
    private double latitude;
    private double longitude;
    private int capacity;
    private double pricePerHour;
    private boolean active;
    private int availableSlots;
    private Long ownerId;

}
