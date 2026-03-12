package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.LoginRequestDTO;
import org.example.backend.dto.UserDTO;
import org.example.backend.entity.User;
import org.example.backend.exception.InvalidCredentialsException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.UserRepository;
import org.example.backend.service.AuthService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public UserDTO login(LoginRequestDTO request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email address"));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new InvalidCredentialsException("Incorrect password. Please try again");
        }

        UserDTO dto = modelMapper.map(user, UserDTO.class);
        dto.setPassword(null);
        return dto;
    }

}
