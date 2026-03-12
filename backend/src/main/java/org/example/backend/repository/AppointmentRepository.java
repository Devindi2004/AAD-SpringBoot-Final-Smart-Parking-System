package org.example.backend.repository;

import org.example.backend.entity.Appointment;
import org.example.backend.entity.User;
import org.example.backend.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDriver(User driver);

    List<Appointment> findByStatus(AppointmentStatus status);

}