package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.TransactionDTO;
import org.example.backend.entity.Appointment;
import org.example.backend.entity.Transaction;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.AppointmentRepository;
import org.example.backend.repository.TransactionRepository;
import org.example.backend.service.TransactionService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final AppointmentRepository appointmentRepository;
    private final ModelMapper modelMapper;

    @Override
    public TransactionDTO saveTransaction(TransactionDTO dto) {

        Transaction transaction = modelMapper.map(dto, Transaction.class);

        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        transaction.setAppointment(appointment);

        Transaction saved = transactionRepository.save(transaction);

        return modelMapper.map(saved, TransactionDTO.class);
    }

    @Override
    public List<TransactionDTO> getAllTransactions() {

        return transactionRepository.findAll()
                .stream()
                .map(t -> modelMapper.map(t, TransactionDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public TransactionDTO getTransactionById(Long id) {

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        return modelMapper.map(transaction, TransactionDTO.class);
    }

    @Override
    public void deleteTransaction(Long id) {

        transactionRepository.deleteById(id);
    }
}