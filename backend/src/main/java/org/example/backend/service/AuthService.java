package org.example.backend.service;

import org.example.backend.dto.AuthResponseDTO;
import org.example.backend.dto.LoginRequestDTO;

public interface AuthService {

    AuthResponseDTO login(LoginRequestDTO request);

}
