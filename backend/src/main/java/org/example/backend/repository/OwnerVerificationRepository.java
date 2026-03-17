package org.example.backend.repository;

import org.example.backend.entity.OwnerVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OwnerVerificationRepository extends JpaRepository<OwnerVerification, Long> {

    Optional<OwnerVerification> findByOwner_Id(Long ownerId);

    List<OwnerVerification> findByStatus(String status);
}
