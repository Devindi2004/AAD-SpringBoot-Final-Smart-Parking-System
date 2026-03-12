package org.example.backend.service;

import org.example.backend.dto.AppointmentDTO;

import java.util.List;

public interface AppointmentService {

    AppointmentDTO saveAppointment(AppointmentDTO appointmentDTO);

    List<AppointmentDTO> getAllAppointments();

    AppointmentDTO getAppointmentById(Long id);

    void deleteAppointment(Long id);

}