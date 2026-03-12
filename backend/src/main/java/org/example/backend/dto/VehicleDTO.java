package org.example.backend.dto;

import lombok.Data;

@Data
public class VehicleDTO {

    private Long id;
    private String vehicleNumber;
    private String type;
    private String model;
    private String color;
    private int year;
    private Long driverId;

}