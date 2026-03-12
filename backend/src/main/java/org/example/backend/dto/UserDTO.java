package org.example.backend.dto;

import lombok.Data;

@Data
public class UserDTO {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String password;
    private String role;
    private String status;
}