package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.TransactionDTO;
import org.example.backend.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public TransactionDTO createTransaction(@RequestBody TransactionDTO dto) {
        return transactionService.saveTransaction(dto);
    }

    @GetMapping
    public List<TransactionDTO> getAllTransactions() {
        return transactionService.getAllTransactions();
    }

    @GetMapping("/{id}")
    public TransactionDTO getTransaction(@PathVariable Long id) {
        return transactionService.getTransactionById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
    }

    @PostMapping("/pay/{appointmentId}")
    public TransactionDTO makePayment(@PathVariable Long appointmentId) {
        return transactionService.makePayment(appointmentId);
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<TransactionDTO> getByAppointmentId(@PathVariable Long appointmentId) {
        TransactionDTO dto = transactionService.getByAppointmentId(appointmentId);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @GetMapping("/owner/{ownerId}")
    public List<TransactionDTO> getByOwner(@PathVariable Long ownerId) {
        return transactionService.getByOwnerId(ownerId);
    }
}
