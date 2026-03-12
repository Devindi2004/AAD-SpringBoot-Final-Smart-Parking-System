package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.example.backend.enums.VehicleType;

@Entity
@Data
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String vehicleNumber;

    @Enumerated(EnumType.STRING)
    private VehicleType type;

    private String model;

    private String color;

    private int year;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;
}