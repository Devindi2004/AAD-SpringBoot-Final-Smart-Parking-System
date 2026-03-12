package org.example.backend.service;

import org.example.backend.dto.UserDTO;

import java.util.List;

public interface UserService {

    UserDTO saveUser(UserDTO dto);

    List<UserDTO> getAllUsers();

    UserDTO getUserById(Long id);

    void deleteUser(Long id);

}