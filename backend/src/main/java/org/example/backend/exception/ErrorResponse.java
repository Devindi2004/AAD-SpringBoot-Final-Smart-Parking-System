package org.example.backend.exception;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ErrorResponse {

    private String message;
    private int status;
    private LocalDateTime timestamp;

}