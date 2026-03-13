package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.VehicleDTO;
import org.example.backend.service.VehicleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@CrossOrigin
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    public VehicleDTO createVehicle(@RequestBody VehicleDTO dto) {
        return vehicleService.saveVehicle(dto);
    }

    @GetMapping
    public List<VehicleDTO> getAllVehicles() {
        return vehicleService.getAllVehicles();
    }

    @GetMapping("/{id}")
    public VehicleDTO getVehicle(@PathVariable Long id) {
        return vehicleService.getVehicleById(id);
    }

    @GetMapping("/driver/{driverId}")
    public List<VehicleDTO> getVehiclesByDriver(@PathVariable Long driverId) {
        return vehicleService.getVehiclesByDriver(driverId);
    }

    @DeleteMapping("/{id}")
    public void deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
    }
}