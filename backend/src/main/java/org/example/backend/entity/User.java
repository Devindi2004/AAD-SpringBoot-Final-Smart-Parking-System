package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.example.backend.enums.UserRole;
import org.example.backend.enums.UserStatus;

@Entity
@Data
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;

    private String lastName;

    private String email;

    private String phone;

    private String password;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    private UserStatus status;
}