package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.AppointmentDTO;
import org.example.backend.entity.Appointment;
import org.example.backend.entity.ParkingSlot;
import org.example.backend.entity.User;
import org.example.backend.entity.Vehicle;
import org.example.backend.enums.AppointmentStatus;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.AppointmentRepository;
import org.example.backend.repository.ParkingSlotRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.repository.VehicleRepository;
import org.example.backend.service.AppointmentService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
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

        User driver = userRepository.findById(dto.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        ParkingSlot slot = slotRepository.findById(dto.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        // Block booking if an ACTIVE appointment already covers the requested time window
        List<Appointment> activeForSlot = appointmentRepository.findBySlot_IdAndStatus(slot.getId(), AppointmentStatus.ACTIVE);
        boolean hasConflict = activeForSlot.stream().anyMatch(a ->
                dto.getStartTime().isBefore(a.getEndTime()) &&
                dto.getEndTime().isAfter(a.getStartTime()));
        if (hasConflict) {
            throw new IllegalStateException("This slot is already booked for the selected time period. Please choose a different time.");
        }

        Appointment appointment = new Appointment();
        appointment.setDriver(driver);
        appointment.setSlot(slot);
        appointment.setVehicle(vehicle);
        appointment.setStartTime(dto.getStartTime());
        appointment.setEndTime(dto.getEndTime());
        appointment.setDuration(dto.getDuration());
        appointment.setTotalAmount(dto.getTotalAmount());
        appointment.setCommission(Math.round(dto.getTotalAmount() * 0.20 * 100.0) / 100.0);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setBookingCode("PS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        return toDTO(appointmentRepository.save(appointment));
    }

    @Override
    public List<AppointmentDTO> getAllAppointments() {
        return appointmentRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public AppointmentDTO getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        return toDTO(appointment);
    }

    @Override
    public void deleteAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        appointmentRepository.delete(appointment);
    }

    @Override
    public List<AppointmentDTO> getAppointmentsByOwner(Long ownerId) {
        return appointmentRepository.findBySlot_Location_OwnerId(ownerId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDTO> getAppointmentsByDriver(Long driverId) {
        return appointmentRepository.findByDriver_Id(driverId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentDTO updateStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        AppointmentStatus newStatus = AppointmentStatus.valueOf(status.toUpperCase());

        // When accepting, ensure no other ACTIVE appointment already covers this slot's time window
        if (newStatus == AppointmentStatus.ACTIVE) {
            ParkingSlot slot = appointment.getSlot();
            if (slot != null) {
                List<Appointment> activeConflicts = appointmentRepository.findBySlot_IdAndStatus(slot.getId(), AppointmentStatus.ACTIVE);
                boolean hasConflict = activeConflicts.stream()
                        .filter(a -> !a.getId().equals(id))
                        .anyMatch(a ->
                                appointment.getStartTime().isBefore(a.getEndTime()) &&
                                appointment.getEndTime().isAfter(a.getStartTime()));
                if (hasConflict) {
                    throw new IllegalStateException("Cannot accept: this slot is already booked for an overlapping time period.");
                }
            }
        }

        appointment.setStatus(newStatus);
        return toDTO(appointmentRepository.save(appointment));
    }

    @Override
    public List<AppointmentDTO> getActiveAppointmentsByLocation(Long locationId) {
        return appointmentRepository.findBySlot_Location_IdAndStatus(locationId, AppointmentStatus.ACTIVE)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ── Helper: map Appointment to DTO with all display fields ────────────────
    private AppointmentDTO toDTO(Appointment a) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setId(a.getId());
        dto.setBookingCode(a.getBookingCode());
        dto.setStartTime(a.getStartTime());
        dto.setEndTime(a.getEndTime());
        dto.setDuration(a.getDuration());
        dto.setTotalAmount(a.getTotalAmount());
        dto.setCommission(a.getCommission());
        dto.setStatus(a.getStatus() != null ? a.getStatus().name() : null);
        dto.setCreatedAt(a.getCreatedAt());

        if (a.getDriver() != null) {
            dto.setDriverId(a.getDriver().getId());
            dto.setDriverFirstName(a.getDriver().getFirstName());
            dto.setDriverLastName(a.getDriver().getLastName());
        }
        if (a.getSlot() != null) {
            dto.setSlotId(a.getSlot().getId());
            dto.setSlotNumber(a.getSlot().getSlotNumber());
            if (a.getSlot().getLocation() != null) {
                dto.setLocationName(a.getSlot().getLocation().getName());
                dto.setPricePerHour(a.getSlot().getLocation().getPricePerHour());
            }
        }
        if (a.getVehicle() != null) {
            dto.setVehicleId(a.getVehicle().getId());
            dto.setVehicleNumber(a.getVehicle().getVehicleNumber());
            dto.setVehicleModel(a.getVehicle().getModel());
            dto.setVehicleColor(a.getVehicle().getColor());
            dto.setVehicleType(a.getVehicle().getType() != null ? a.getVehicle().getType().name() : null);
        }
        return dto;
    }
}
