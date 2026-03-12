package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ParkingSlotDTO;
import org.example.backend.service.ParkingSlotService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/slots")
@RequiredArgsConstructor
@CrossOrigin
public class ParkingSlotController {

    private final ParkingSlotService slotService;

    @PostMapping
    public ParkingSlotDTO createSlot(@RequestBody ParkingSlotDTO dto) {
        return slotService.saveSlot(dto);
    }

    @GetMapping
    public List<ParkingSlotDTO> getAllSlots() {
        return slotService.getAllSlots();
    }

    @GetMapping("/location/{locationId}")
    public List<ParkingSlotDTO> getByLocation(@PathVariable Long locationId) {
        return slotService.getSlotsByLocation(locationId);
    }

    @GetMapping("/owner/{ownerId}")
    public List<ParkingSlotDTO> getByOwner(@PathVariable Long ownerId) {
        return slotService.getSlotsByOwner(ownerId);
    }

    @GetMapping("/{id}")
    public ParkingSlotDTO getSlot(@PathVariable Long id) {
        return slotService.getSlotById(id);
    }

    @PatchMapping("/{id}/status")
    public ParkingSlotDTO updateStatus(@PathVariable Long id, @RequestParam String status) {
        return slotService.updateSlotStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void deleteSlot(@PathVariable Long id) {
        slotService.deleteSlot(id);
    }
}