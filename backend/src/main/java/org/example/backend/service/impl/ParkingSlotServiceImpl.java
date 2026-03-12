package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ParkingSlotDTO;
import org.example.backend.entity.ParkingLocation;
import org.example.backend.entity.ParkingSlot;
import org.example.backend.enums.SlotStatus;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.ParkingLocationRepository;
import org.example.backend.repository.ParkingSlotRepository;
import org.example.backend.service.ParkingSlotService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingSlotServiceImpl implements ParkingSlotService {

    private final ParkingSlotRepository slotRepository;
    private final ParkingLocationRepository locationRepository;
    private final ModelMapper modelMapper;

    @Override
    public ParkingSlotDTO saveSlot(ParkingSlotDTO dto) {

        ParkingLocation location = locationRepository.findById(dto.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));

        ParkingSlot slot = modelMapper.map(dto, ParkingSlot.class);
        slot.setLocation(location);

        ParkingSlot saved = slotRepository.save(slot);
        return toDTO(saved);
    }

    @Override
    public List<ParkingSlotDTO> getAllSlots() {
        return slotRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ParkingSlotDTO> getSlotsByLocation(Long locationId) {
        return slotRepository.findByLocationId(locationId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ParkingSlotDTO> getSlotsByOwner(Long ownerId) {
        return slotRepository.findByLocation_OwnerId(ownerId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ParkingSlotDTO getSlotById(Long id) {
        ParkingSlot slot = slotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        return toDTO(slot);
    }

    @Override
    public ParkingSlotDTO updateSlotStatus(Long id, String status) {
        ParkingSlot slot = slotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        slot.setStatus(SlotStatus.valueOf(status));
        return toDTO(slotRepository.save(slot));
    }

    @Override
    public void deleteSlot(Long id) {
        slotRepository.deleteById(id);
    }

    private ParkingSlotDTO toDTO(ParkingSlot slot) {
        ParkingSlotDTO dto = new ParkingSlotDTO();
        dto.setId(slot.getId());
        dto.setSlotNumber(slot.getSlotNumber());
        dto.setStatus(slot.getStatus() != null ? slot.getStatus().name() : null);
        dto.setVehicleType(slot.getVehicleType() != null ? slot.getVehicleType().name() : null);
        dto.setLocationId(slot.getLocation() != null ? slot.getLocation().getId() : null);
        dto.setLocationName(slot.getLocation() != null ? slot.getLocation().getName() : null);
        return dto;
    }
}