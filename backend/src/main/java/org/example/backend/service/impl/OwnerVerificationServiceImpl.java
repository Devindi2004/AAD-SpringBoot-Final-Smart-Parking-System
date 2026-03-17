package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.OwnerVerificationDTO;
import org.example.backend.entity.OwnerVerification;
import org.example.backend.entity.User;
import org.example.backend.enums.UserStatus;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.OwnerVerificationRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.service.OwnerVerificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OwnerVerificationServiceImpl implements OwnerVerificationService {

    private final OwnerVerificationRepository ownerVerificationRepository;
    private final UserRepository userRepository;

    @Override
    public List<OwnerVerificationDTO> getAllVerifications() {
        return ownerVerificationRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<OwnerVerificationDTO> getPendingVerifications() {
        return ownerVerificationRepository.findByStatus("PENDING")
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OwnerVerificationDTO approve(Long id) {
        OwnerVerification v = ownerVerificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Verification request not found"));
        v.setStatus("VERIFIED");
        User owner = v.getOwner();
        owner.setStatus(UserStatus.ACTIVE);
        userRepository.save(owner);
        return toDTO(ownerVerificationRepository.save(v));
    }

    @Override
    @Transactional
    public OwnerVerificationDTO reject(Long id) {
        OwnerVerification v = ownerVerificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Verification request not found"));
        v.setStatus("REJECTED");
        return toDTO(ownerVerificationRepository.save(v));
    }

    private OwnerVerificationDTO toDTO(OwnerVerification v) {
        OwnerVerificationDTO dto = new OwnerVerificationDTO();
        dto.setId(v.getId());
        dto.setDocument(v.getDocument());
        dto.setStatus(v.getStatus());
        dto.setAppliedDate(v.getAppliedDate());
        if (v.getOwner() != null) {
            User o = v.getOwner();
            dto.setOwnerId(o.getId());
            dto.setOwnerFirstName(o.getFirstName());
            dto.setOwnerLastName(o.getLastName());
            dto.setOwnerEmail(o.getEmail());
            dto.setOwnerPhone(o.getPhone());
            dto.setUserStatus(o.getStatus() != null ? o.getStatus().name() : null);
        }
        return dto;
    }
}
