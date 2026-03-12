package org.example.backend.service;

import org.example.backend.dto.LoginRequestDTO;
import org.example.backend.dto.UserDTO;

public interface AuthService {

    UserDTO login(LoginRequestDTO request);

}
