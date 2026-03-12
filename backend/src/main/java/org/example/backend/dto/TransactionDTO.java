package org.example.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TransactionDTO {

    private Long id;
    private double totalAmount;
    private double commission;
    private double ownerEarning;
    private String status;
    private LocalDateTime paymentDate;
    private Long appointmentId;

}