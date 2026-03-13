package org.example.backend.service;

import org.example.backend.dto.VehicleDTO;

import java.util.List;

public interface VehicleService {

    VehicleDTO saveVehicle(VehicleDTO dto);

    List<VehicleDTO> getAllVehicles();

    VehicleDTO getVehicleById(Long id);

    void deleteVehicle(Long id);

    List<VehicleDTO> getVehiclesByDriver(Long driverId);

}