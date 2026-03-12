package org.example.backend.service;

import org.example.backend.dto.TransactionDTO;

import java.util.List;

public interface TransactionService {

    TransactionDTO saveTransaction(TransactionDTO dto);

    List<TransactionDTO> getAllTransactions();

    TransactionDTO getTransactionById(Long id);

    void deleteTransaction(Long id);

}