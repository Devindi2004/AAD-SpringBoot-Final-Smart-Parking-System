package org.example.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class OwnerVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String document;

    private String status; // PENDING, VERIFIED, REJECTED

    private LocalDateTime appliedDate;

    @OneToOne
    private User owner;
}