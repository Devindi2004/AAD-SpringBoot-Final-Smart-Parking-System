package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.AppointmentDTO;
import org.example.backend.service.AppointmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@CrossOrigin
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public AppointmentDTO createAppointment(@RequestBody AppointmentDTO dto) {
        return appointmentService.saveAppointment(dto);
    }

    @GetMapping
    public List<AppointmentDTO> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/{id}")
    public AppointmentDTO getAppointment(@PathVariable Long id) {
        return appointmentService.getAppointmentById(id);
    }

    @GetMapping("/owner/{ownerId}")
    public List<AppointmentDTO> getByOwner(@PathVariable Long ownerId) {
        return appointmentService.getAppointmentsByOwner(ownerId);
    }

    @GetMapping("/driver/{driverId}")
    public List<AppointmentDTO> getByDriver(@PathVariable Long driverId) {
        return appointmentService.getAppointmentsByDriver(driverId);
    }

    @GetMapping("/location/{locationId}/active")
    public List<AppointmentDTO> getActiveByLocation(@PathVariable Long locationId) {
        return appointmentService.getActiveAppointmentsByLocation(locationId);
    }

    @PatchMapping("/{id}/status")
    public AppointmentDTO updateStatus(@PathVariable Long id, @RequestParam String status) {
        return appointmentService.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
    }
}