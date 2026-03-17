package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class OwnerVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String document;

    private String status; // PENDING, VERIFIED, REJECTED

    private LocalDateTime appliedDate;

    @OneToOne
    @JoinColumn(name = "owner_id")
    private User owner;
}