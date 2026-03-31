package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.AuthResponseDTO;
import org.example.backend.dto.LoginRequestDTO;
import org.example.backend.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody LoginRequestDTO request) {
        return authService.login(request);
    }

}
