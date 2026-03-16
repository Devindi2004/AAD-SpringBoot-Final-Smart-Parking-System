package org.example.backend.repository;

import org.example.backend.entity.Transaction;
import org.example.backend.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByAppointment(Appointment appointment);

    Optional<Transaction> findByAppointment_Id(Long appointmentId);

    List<Transaction> findByAppointment_Slot_Location_Owner_Id(Long ownerId);

}
