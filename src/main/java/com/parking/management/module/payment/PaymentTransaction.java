package com.parking.management.module.payment;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "PaymentTransactions")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TransactionID")
    private Integer transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PaymentID", nullable = false)
    private Payment payment;

    @Column(name = "Gateway", nullable = false, length = 50)
    private String gateway;

    @Column(name = "TransactionRef", nullable = false, length = 100)
    private String transactionRef;

    @Column(name = "Amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "TransactionStatus", nullable = false, length = 20)
    private String transactionStatus;

    @Column(name = "ResponseCode", length = 20)
    private String responseCode;

    @Column(name = "ResponseMessage", length = 255)
    private String responseMessage;

    @Column(name = "PaymentUrl", length = 1000)
    private String paymentUrl;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "PaidAt")
    private LocalDateTime paidAt;
}