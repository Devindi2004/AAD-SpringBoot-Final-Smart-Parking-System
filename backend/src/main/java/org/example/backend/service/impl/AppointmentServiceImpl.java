package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.AppointmentDTO;
import org.example.backend.entity.Appointment;
import org.example.backend.entity.ParkingSlot;
import org.example.backend.entity.User;
import org.example.backend.entity.Vehicle;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.AppointmentRepository;
import org.example.backend.repository.ParkingSlotRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.repository.VehicleRepository;
import org.example.backend.service.AppointmentService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final ParkingSlotRepository slotRepository;
    private final VehicleRepository vehicleRepository;
    private final ModelMapper modelMapper;

    @Override
    public AppointmentDTO saveAppointment(AppointmentDTO dto) {

        Appointment appointment = modelMapper.map(dto, Appointment.class);

        User driver = userRepository.findById(dto.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        ParkingSlot slot = slotRepository.findById(dto.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        appointment.setDriver(driver);
        appointment.setSlot(slot);
        appointment.setVehicle(vehicle);

        Appointment saved = appointmentRepository.save(appointment);

        return modelMapper.map(saved, AppointmentDTO.class);
    }

    @Override
    public List<AppointmentDTO> getAllAppointments() {

        return appointmentRepository.findAll()
                .stream()
                .map(a -> modelMapper.map(a, AppointmentDTO.class))
                .collect(Collectors.toList());

    }

    @Override
    public AppointmentDTO getAppointmentById(Long id) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        return modelMapper.map(appointment, AppointmentDTO.class);

    }

    @Override
    public void deleteAppointment(Long id) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        appointmentRepository.delete(appointment);
    }
}