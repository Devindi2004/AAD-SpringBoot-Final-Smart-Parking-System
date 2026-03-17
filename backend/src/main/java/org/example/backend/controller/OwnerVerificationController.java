package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.OwnerVerificationDTO;
import org.example.backend.service.OwnerVerificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner-verifications")
@RequiredArgsConstructor
@CrossOrigin
public class OwnerVerificationController {

    private final OwnerVerificationService ownerVerificationService;

    @GetMapping
    public List<OwnerVerificationDTO> getAllVerifications() {
        return ownerVerificationService.getAllVerifications();
    }

    @GetMapping("/pending")
    public List<OwnerVerificationDTO> getPendingVerifications() {
        return ownerVerificationService.getPendingVerifications();
    }

    @PatchMapping("/{id}/approve")
    public OwnerVerificationDTO approve(@PathVariable Long id) {
        return ownerVerificationService.approve(id);
    }

    @PatchMapping("/{id}/reject")
    public OwnerVerificationDTO reject(@PathVariable Long id) {
        return ownerVerificationService.reject(id);
    }
}
