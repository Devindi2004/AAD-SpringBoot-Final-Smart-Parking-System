package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.UserDTO;
import org.example.backend.entity.OwnerVerification;
import org.example.backend.entity.User;
import org.example.backend.enums.UserRole;
import org.example.backend.enums.UserStatus;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.OwnerVerificationRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.service.UserService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final OwnerVerificationRepository ownerVerificationRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public UserDTO saveUser(UserDTO dto) {
        User user = modelMapper.map(dto, User.class);

        // Owners must wait for admin approval — force INACTIVE on registration
        if (user.getRole() == UserRole.OWNER) {
            user.setStatus(UserStatus.INACTIVE);
        } else if (user.getStatus() == null) {
            user.setStatus(UserStatus.ACTIVE);
        }

        User saved = userRepository.save(user);

        // Create a pending OwnerVerification record for new owner accounts
        if (saved.getRole() == UserRole.OWNER) {
            OwnerVerification verification = new OwnerVerification();
            verification.setOwner(saved);
            verification.setStatus("PENDING");
            verification.setAppliedDate(LocalDateTime.now());
            ownerVerificationRepository.save(verification);
        }

        UserDTO result = modelMapper.map(saved, UserDTO.class);
        result.setPassword(null);
        return result;
    }

    @Override
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> {
                    UserDTO dto = modelMapper.map(user, UserDTO.class);
                    dto.setPassword(null);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserDTO dto = modelMapper.map(user, UserDTO.class);
        dto.setPassword(null);
        return dto;
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        userRepository.delete(user);
    }

    @Override
    public UserDTO updateStatus(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setStatus(UserStatus.valueOf(status.toUpperCase()));
        User saved = userRepository.save(user);
        UserDTO dto = modelMapper.map(saved, UserDTO.class);
        dto.setPassword(null);
        return dto;
    }
}
