package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.VehicleDTO;
import org.example.backend.entity.User;
import org.example.backend.entity.Vehicle;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.UserRepository;
import org.example.backend.repository.VehicleRepository;
import org.example.backend.service.VehicleService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public VehicleDTO saveVehicle(VehicleDTO dto) {

        Vehicle vehicle = modelMapper.map(dto, Vehicle.class);

        User driver = userRepository.findById(dto.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        vehicle.setDriver(driver);

        Vehicle saved = vehicleRepository.save(vehicle);

        return modelMapper.map(saved, VehicleDTO.class);
    }

    @Override
    public List<VehicleDTO> getAllVehicles() {

        return vehicleRepository.findAll()
                .stream()
                .map(v -> modelMapper.map(v, VehicleDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public VehicleDTO getVehicleById(Long id) {

        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        return modelMapper.map(vehicle, VehicleDTO.class);
    }

    @Override
    public void deleteVehicle(Long id) {

        vehicleRepository.deleteById(id);
    }
}