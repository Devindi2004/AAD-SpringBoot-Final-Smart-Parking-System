package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.example.backend.enums.TransactionStatus;

import java.time.LocalDateTime;

@Entity
@Data
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double totalAmount;

    private double commission;

    private double ownerEarning;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status;

    private LocalDateTime paymentDate;

    @OneToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;
}