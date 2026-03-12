package org.example.backend.service;

import org.example.backend.dto.ParkingLocationDTO;

import java.util.List;

public interface ParkingLocationService {

    ParkingLocationDTO saveLocation(ParkingLocationDTO dto);

    List<ParkingLocationDTO> getAllLocations();

    List<ParkingLocationDTO> getLocationsByOwner(Long ownerId);

    ParkingLocationDTO getLocationById(Long id);

    ParkingLocationDTO updateLocation(Long id, ParkingLocationDTO dto);

    ParkingLocationDTO toggleActive(Long id);

    void deleteLocation(Long id);

}