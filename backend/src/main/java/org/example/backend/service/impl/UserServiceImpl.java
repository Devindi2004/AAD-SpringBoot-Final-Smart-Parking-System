package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.UserDTO;
import org.example.backend.entity.User;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.UserRepository;
import org.example.backend.service.UserService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public UserDTO saveUser(UserDTO dto) {

        User user = modelMapper.map(dto, User.class);
        User saved = userRepository.save(user);

        return modelMapper.map(saved, UserDTO.class);
    }

    @Override
    public List<UserDTO> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(user -> modelMapper.map(user, UserDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public UserDTO getUserById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return modelMapper.map(user, UserDTO.class);
    }

    @Override
    public void deleteUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        userRepository.delete(user);
    }
}