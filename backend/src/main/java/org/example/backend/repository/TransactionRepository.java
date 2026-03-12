package org.example.backend.repository;

import org.example.backend.entity.Transaction;
import org.example.backend.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByAppointment(Appointment appointment);

}