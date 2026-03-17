package org.example.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OwnerVerificationDTO {

    private Long id;
    private String document;
    private String status;
    private LocalDateTime appliedDate;

    // Owner info
    private Long ownerId;
    private String ownerFirstName;
    private String ownerLastName;
    private String ownerEmail;
    private String ownerPhone;
    private String userStatus;
}
