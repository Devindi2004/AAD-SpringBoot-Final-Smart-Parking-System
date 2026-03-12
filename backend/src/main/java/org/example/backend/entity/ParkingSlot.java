package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.example.backend.enums.SlotStatus;
import org.example.backend.enums.VehicleType;

@Entity
@Data
@Table(name = "parking_slots")
public class ParkingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String slotNumber;

    @Enumerated(EnumType.STRING)
    private SlotStatus status;

    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    @ManyToOne
    @JoinColumn(name = "location_id")
    private ParkingLocation location;
}
