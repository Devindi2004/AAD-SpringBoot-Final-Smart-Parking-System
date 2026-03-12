package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ParkingLocationDTO;
import org.example.backend.entity.ParkingLocation;
import org.example.backend.entity.User;
import org.example.backend.enums.SlotStatus;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.ParkingLocationRepository;
import org.example.backend.repository.ParkingSlotRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.service.ParkingLocationService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingLocationServiceImpl implements ParkingLocationService {

    private final ParkingLocationRepository locationRepository;
    private final ParkingSlotRepository slotRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public ParkingLocationDTO saveLocation(ParkingLocationDTO dto) {

        User owner = userRepository.findById(dto.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));

        ParkingLocation location = modelMapper.map(dto, ParkingLocation.class);
        location.setOwner(owner);
        location.setActive(true);

        ParkingLocation saved = locationRepository.save(location);
        return toDTO(saved);
    }

    @Override
    public List<ParkingLocationDTO> getAllLocations() {
        return locationRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ParkingLocationDTO> getLocationsByOwner(Long ownerId) {
        return locationRepository.findByOwnerId(ownerId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ParkingLocationDTO getLocationById(Long id) {
        ParkingLocation location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));
        return toDTO(location);
    }

    @Override
    public ParkingLocationDTO updateLocation(Long id, ParkingLocationDTO dto) {
        ParkingLocation location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));
        location.setName(dto.getName());
        location.setAddress(dto.getAddress());
        location.setLatitude(dto.getLatitude());
        location.setLongitude(dto.getLongitude());
        location.setCapacity(dto.getCapacity());
        location.setPricePerHour(dto.getPricePerHour());
        return toDTO(locationRepository.save(location));
    }

    @Override
    public ParkingLocationDTO toggleActive(Long id) {
        ParkingLocation location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));
        location.setActive(!location.isActive());
        return toDTO(locationRepository.save(location));
    }

    @Override
    public void deleteLocation(Long id) {
        long slotCount = slotRepository.countByLocationId(id);
        if (slotCount > 0) {
            throw new IllegalStateException(
                "Cannot delete: this location has " + slotCount + " slot(s) assigned. Remove all slots first."
            );
        }
        locationRepository.deleteById(id);
    }

    private ParkingLocationDTO toDTO(ParkingLocation location) {
        ParkingLocationDTO dto = modelMapper.map(location, ParkingLocationDTO.class);
        dto.setOwnerId(location.getOwner().getId());
        long available = slotRepository.countByLocationIdAndStatus(location.getId(), SlotStatus.AVAILABLE);
        dto.setAvailableSlots((int) available);
        return dto;
    }
}
