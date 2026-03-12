package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "parking_locations")
public class ParkingLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String address;

    private double latitude;

    private double longitude;

    private int capacity;

    private double pricePerHour;

    private boolean active = true;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;
}
