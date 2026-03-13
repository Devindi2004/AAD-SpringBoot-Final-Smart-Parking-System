package org.example.backend.service;

import org.example.backend.dto.AppointmentDTO;

import java.util.List;

public interface AppointmentService {

    AppointmentDTO saveAppointment(AppointmentDTO appointmentDTO);

    List<AppointmentDTO> getAllAppointments();

    AppointmentDTO getAppointmentById(Long id);

    void deleteAppointment(Long id);

    List<AppointmentDTO> getAppointmentsByOwner(Long ownerId);

    List<AppointmentDTO> getAppointmentsByDriver(Long driverId);

    AppointmentDTO updateStatus(Long id, String status);

    List<AppointmentDTO> getActiveAppointmentsByLocation(Long locationId);

}