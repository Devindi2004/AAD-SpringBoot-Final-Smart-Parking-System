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

    @DeleteMapping("/{id}")
    public void deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
    }
}