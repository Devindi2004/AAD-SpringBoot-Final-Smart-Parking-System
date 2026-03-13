package org.example.backend.repository;

import org.example.backend.entity.Appointment;
import org.example.backend.entity.User;
import org.example.backend.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDriver(User driver);

    List<Appointment> findByStatus(AppointmentStatus status);

    List<Appointment> findBySlot_Location_OwnerId(Long ownerId);

    List<Appointment> findBySlot_Location_OwnerIdAndStatus(Long ownerId, AppointmentStatus status);

    List<Appointment> findByDriver_Id(Long driverId);

    List<Appointment> findBySlot_IdAndStatus(Long slotId, AppointmentStatus status);

    List<Appointment> findBySlot_Location_IdAndStatus(Long locationId, AppointmentStatus status);

}