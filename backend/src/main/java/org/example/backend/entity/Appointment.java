package org.example.backend.entity;

import jakarta.persistence.*;
import jdk.jfr.Timespan;
import lombok.Data;
import org.example.backend.enums.AppointmentStatus;
import org.example.backend.enums.PaymentStatus;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String bookingCode;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private int duration;

    private double totalAmount;

    private double commission;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;

    @ManyToOne
    @JoinColumn(name = "slot_id")
    private ParkingSlot slot;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;
}