package org.example.backend.service;

import org.example.backend.dto.ParkingSlotDTO;

import java.util.List;

public interface ParkingSlotService {

    ParkingSlotDTO saveSlot(ParkingSlotDTO dto);

    List<ParkingSlotDTO> getAllSlots();

    List<ParkingSlotDTO> getSlotsByLocation(Long locationId);

    List<ParkingSlotDTO> getSlotsByOwner(Long ownerId);

    ParkingSlotDTO getSlotById(Long id);

    ParkingSlotDTO updateSlotStatus(Long id, String status);

    void deleteSlot(Long id);

}