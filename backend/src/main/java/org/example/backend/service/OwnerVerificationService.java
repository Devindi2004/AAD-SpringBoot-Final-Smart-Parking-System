package org.example.backend.service;

import org.example.backend.dto.OwnerVerificationDTO;

import java.util.List;

public interface OwnerVerificationService {

    List<OwnerVerificationDTO> getAllVerifications();

    List<OwnerVerificationDTO> getPendingVerifications();

    OwnerVerificationDTO approve(Long id);

    OwnerVerificationDTO reject(Long id);
}
