package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.TransactionDTO;
import org.example.backend.entity.Appointment;
import org.example.backend.entity.Transaction;
import org.example.backend.enums.PaymentStatus;
import org.example.backend.enums.TransactionStatus;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.AppointmentRepository;
import org.example.backend.repository.TransactionRepository;
import org.example.backend.service.TransactionService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private static final double COMMISSION_RATE = 0.15;

    private final TransactionRepository transactionRepository;
    private final AppointmentRepository appointmentRepository;
    private final ModelMapper modelMapper;

    @Override
    public TransactionDTO saveTransaction(TransactionDTO dto) {
        Transaction transaction = modelMapper.map(dto, Transaction.class);
        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        transaction.setAppointment(appointment);
        return toDTO(transactionRepository.save(transaction));
    }

    @Override
    public List<TransactionDTO> getAllTransactions() {
        return transactionRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TransactionDTO getTransactionById(Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        return toDTO(transaction);
    }

    @Override
    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }

    @Override
    @Transactional
    public TransactionDTO makePayment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (appointment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Payment has already been completed for this booking.");
        }

        double totalAmount  = appointment.getTotalAmount();
        double commission   = Math.round(totalAmount * COMMISSION_RATE * 100.0) / 100.0;
        double ownerEarning = Math.round((totalAmount - commission) * 100.0) / 100.0;

        Transaction transaction = new Transaction();
        transaction.setAppointment(appointment);
        transaction.setTotalAmount(totalAmount);
        transaction.setCommission(commission);
        transaction.setOwnerEarning(ownerEarning);
        transaction.setStatus(TransactionStatus.PAID);
        transaction.setPaymentDate(LocalDateTime.now());
        transactionRepository.save(transaction);

        appointment.setPaymentStatus(PaymentStatus.PAID);
        appointmentRepository.save(appointment);

        return toDTO(transaction);
    }

    @Override
    public TransactionDTO getByAppointmentId(Long appointmentId) {
        return transactionRepository.findByAppointment_Id(appointmentId)
                .map(this::toDTO)
                .orElse(null);
    }

    @Override
    public List<TransactionDTO> getByOwnerId(Long ownerId) {
        return transactionRepository.findByAppointment_Slot_Location_Owner_Id(ownerId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ── Helper: map Transaction to DTO with enriched display fields ────────────
    private TransactionDTO toDTO(Transaction t) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(t.getId());
        dto.setTotalAmount(t.getTotalAmount());
        dto.setCommission(t.getCommission());
        dto.setOwnerEarning(t.getOwnerEarning());
        dto.setStatus(t.getStatus() != null ? t.getStatus().name() : null);
        dto.setPaymentDate(t.getPaymentDate());

        if (t.getAppointment() != null) {
            Appointment a = t.getAppointment();
            dto.setAppointmentId(a.getId());
            dto.setBookingCode(a.getBookingCode());
            dto.setStartTime(a.getStartTime());
            dto.setEndTime(a.getEndTime());
            if (a.getDriver() != null) {
                dto.setDriverFirstName(a.getDriver().getFirstName());
                dto.setDriverLastName(a.getDriver().getLastName());
            }
            if (a.getSlot() != null) {
                dto.setSlotNumber(a.getSlot().getSlotNumber());
                if (a.getSlot().getLocation() != null) {
                    dto.setLocationName(a.getSlot().getLocation().getName());
                }
            }
        }
        return dto;
    }
}
