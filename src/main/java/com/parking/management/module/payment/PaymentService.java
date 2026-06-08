package com.parking.management.module.payment;

import com.parking.management.common.ResourceNotFoundException;
import com.parking.management.module.pricing.FeeCalculationResponse;
import com.parking.management.module.pricing.PricingService;
import com.parking.management.module.session.ParkingSession;
import com.parking.management.module.session.ParkingSessionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.Map;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final PricingService pricingService;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final VnPayService vnPayService;

    @Transactional
    public PaymentResponse create(PaymentRequest request) {
        ParkingSession session = parkingSessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parking session not found with id: " + request.getSessionId()
                ));

        paymentRepository.findBySession_SessionId(request.getSessionId())
                .ifPresent(existingPayment -> {
                    throw new IllegalArgumentException(
                            "This parking session already has a payment record"
                    );
                });

        if (session.getVehicle() == null) {
            throw new IllegalArgumentException("Parking session does not have vehicle information");
        }

        if (session.getVehicle().getVehicleType() == null) {
            throw new IllegalArgumentException("Vehicle does not have vehicle type information");
        }

        if (session.getEntryTime() == null) {
            throw new IllegalArgumentException("Parking session does not have entry time");
        }

        LocalDateTime exitTime = session.getExitTime();

        if (exitTime == null) {
            exitTime = LocalDateTime.now();
            session.setExitTime(exitTime);
        }

        Long vehicleTypeId = Long.valueOf(session.getVehicle().getVehicleType().getVehicleTypeId());

        FeeCalculationResponse feeResponse = pricingService.calculateFee(
                vehicleTypeId,
                session.getEntryTime(),
                exitTime
        );

        session.setFinalFee(feeResponse.getFinalFee());
        parkingSessionRepository.save(session);

        Payment payment = new Payment();
        payment.setSession(session);
        payment.setAmount(feeResponse.getFinalFee());
        payment.setPaymentMethod(request.getPaymentMethod().name());
        payment.setPaymentStatus(PaymentStatus.PENDING.name());
        payment.setPaidAt(null);

        Payment savedPayment = paymentRepository.save(payment);

        return mapEntityToResponse(savedPayment);
    }

    public PaymentResponse getById(Integer id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found with id: " + id
                ));

        return mapEntityToResponse(payment);
    }

    public List<PaymentResponse> getAll() {
        return paymentRepository.findAll()
                .stream()
                .map(this::mapEntityToResponse)
                .toList();
    }

    public PaymentResponse getBySessionId(Integer sessionId) {
        Payment payment = paymentRepository.findBySession_SessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found for session id: " + sessionId
                ));

        return mapEntityToResponse(payment);
    }

    @Transactional
    public PaymentResponse updateStatus(Integer id, PaymentStatusUpdateRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found with id: " + id
                ));

        payment.setPaymentStatus(request.getPaymentStatus().name());

        if (request.getPaymentStatus() == PaymentStatus.PAID) {
            payment.setPaidAt(LocalDateTime.now());
        }

        if (request.getPaymentStatus() == PaymentStatus.FAILED) {
            payment.setPaidAt(null);
        }

        Payment updatedPayment = paymentRepository.save(payment);

        return mapEntityToResponse(updatedPayment);
    }

    @Transactional
    public PaymentResponse confirmCashPayment(Integer id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found with id: " + id
                ));

        if (!PaymentMethod.CASH.name().equals(payment.getPaymentMethod())) {
            throw new IllegalArgumentException("Only CASH payment can be confirmed manually by staff");
        }

        if (PaymentStatus.PAID.name().equals(payment.getPaymentStatus())) {
            throw new IllegalArgumentException("This payment has already been paid");
        }

        if (PaymentStatus.FAILED.name().equals(payment.getPaymentStatus())) {
            throw new IllegalArgumentException("Failed payment cannot be confirmed");
        }

        payment.setPaymentStatus(PaymentStatus.PAID.name());
        payment.setPaidAt(LocalDateTime.now());

        Payment updatedPayment = paymentRepository.save(payment);

        return mapEntityToResponse(updatedPayment);
    }

    @Transactional
    public PaymentResponse simulateOnlinePaymentSuccess(Integer id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found with id: " + id
                ));

        if (PaymentMethod.CASH.name().equals(payment.getPaymentMethod())) {
            throw new IllegalArgumentException("CASH payment must be confirmed by staff");
        }

        if (PaymentStatus.PAID.name().equals(payment.getPaymentStatus())) {
            throw new IllegalArgumentException("This payment has already been paid");
        }

        payment.setPaymentStatus(PaymentStatus.PAID.name());
        payment.setPaidAt(LocalDateTime.now());

        Payment updatedPayment = paymentRepository.save(payment);

        return mapEntityToResponse(updatedPayment);
    }

    @Transactional
    public void delete(Integer id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found with id: " + id
                ));

        paymentRepository.delete(payment);
    }

    private PaymentResponse mapEntityToResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();

        response.setPaymentId(payment.getPaymentId());

        if (payment.getSession() != null) {
            response.setSessionId(payment.getSession().getSessionId());
        }

        response.setAmount(payment.getAmount());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setPaymentStatus(payment.getPaymentStatus());
        response.setPaidAt(payment.getPaidAt());

        addPaymentInstruction(response);

        return response;
    }

    private void addPaymentInstruction(PaymentResponse response) {
        if (response.getPaymentMethod() == null || response.getPaymentStatus() == null) {
            return;
        }

        if (!PaymentStatus.PENDING.name().equals(response.getPaymentStatus())) {
            response.setPaymentInstruction("Payment has already been processed");
            return;
        }

        if (PaymentMethod.CASH.name().equals(response.getPaymentMethod())) {
            response.setPaymentInstruction("Customer pays cash directly to parking staff. Staff must confirm payment manually.");
            return;
        }

        if (PaymentMethod.BANK_TRANSFER.name().equals(response.getPaymentMethod())) {
            response.setPaymentInstruction("Transfer to bank account: 123456789 - Parking Management System. Use payment ID as transfer content.");
            response.setQrContent("BANK_TRANSFER|PAYMENT_ID=" + response.getPaymentId()
                    + "|AMOUNT=" + response.getAmount()
                    + "|CONTENT=PAYMENT" + response.getPaymentId());
            response.setPaymentUrl("http://localhost:8080/mock-payment/bank-transfer/" + response.getPaymentId());
            return;
        }

        if (PaymentMethod.E_WALLET.name().equals(response.getPaymentMethod())) {
            response.setPaymentInstruction("Pay using mock e-wallet gateway. This is for demo purpose.");
            response.setQrContent("E_WALLET|PAYMENT_ID=" + response.getPaymentId()
                    + "|AMOUNT=" + response.getAmount());
            response.setPaymentUrl("http://localhost:8080/mock-payment/e-wallet/" + response.getPaymentId());
            return;
        }

        if (PaymentMethod.CREDIT_CARD.name().equals(response.getPaymentMethod())) {
            response.setPaymentInstruction("Pay using mock credit card gateway. This is for demo purpose.");
            response.setPaymentUrl("http://localhost:8080/mock-payment/card/" + response.getPaymentId());
        }
    }
    @Transactional
    public PaymentGatewayResponse createVnPayPaymentUrl(Integer paymentId, HttpServletRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found with id: " + paymentId
                ));

        if (!PaymentStatus.PENDING.name().equals(payment.getPaymentStatus())) {
            throw new IllegalArgumentException("Only PENDING payment can create VNPay payment URL");
        }

        if (PaymentMethod.CASH.name().equals(payment.getPaymentMethod())) {
            throw new IllegalArgumentException("CASH payment cannot create VNPay payment URL");
        }

        String transactionRef = "PAY" + payment.getPaymentId() + System.currentTimeMillis();

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setPayment(payment);
        transaction.setGateway(PaymentGateway.VNPAY.name());
        transaction.setTransactionRef(transactionRef);
        transaction.setAmount(payment.getAmount());
        transaction.setTransactionStatus(PaymentTransactionStatus.PENDING.name());

        String paymentUrl = vnPayService.buildPaymentUrl(payment, transactionRef, request);
        transaction.setPaymentUrl(paymentUrl);

        PaymentTransaction savedTransaction = paymentTransactionRepository.save(transaction);

        return mapTransactionToGatewayResponse(savedTransaction);
    }

    @Transactional
    public PaymentGatewayResponse handleVnPayReturn(Map<String, String> params) {
        boolean validSignature = vnPayService.isValidReturn(params);

        String transactionRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.get("vnp_TransactionNo");

        PaymentTransaction transaction = paymentTransactionRepository.findByTransactionRef(transactionRef)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment transaction not found with ref: " + transactionRef
                ));

        transaction.setResponseCode(responseCode);
        transaction.setResponseMessage("VNPay transaction no: " + transactionNo);

        if (!validSignature) {
            transaction.setTransactionStatus(PaymentTransactionStatus.FAILED.name());
            transaction.setResponseMessage("Invalid VNPay secure hash");
            PaymentTransaction savedTransaction = paymentTransactionRepository.save(transaction);
            return mapTransactionToGatewayResponse(savedTransaction);
        }

        Payment payment = transaction.getPayment();

        if ("00".equals(responseCode)) {
            transaction.setTransactionStatus(PaymentTransactionStatus.PAID.name());
            transaction.setPaidAt(LocalDateTime.now());

            payment.setPaymentStatus(PaymentStatus.PAID.name());
            payment.setPaidAt(LocalDateTime.now());

            paymentRepository.save(payment);
        } else {
            transaction.setTransactionStatus(PaymentTransactionStatus.FAILED.name());

            /*
             * Giữ PaymentStatus = PENDING để user có thể thanh toán lại.
             * Không đổi Payment sang FAILED ở đây.
             */
        }

        PaymentTransaction savedTransaction = paymentTransactionRepository.save(transaction);

        return mapTransactionToGatewayResponse(savedTransaction);
    }

    private PaymentGatewayResponse mapTransactionToGatewayResponse(PaymentTransaction transaction) {
        PaymentGatewayResponse response = new PaymentGatewayResponse();

        response.setTransactionId(transaction.getTransactionId());
        response.setTransactionRef(transaction.getTransactionRef());
        response.setAmount(transaction.getAmount());
        response.setGateway(transaction.getGateway());
        response.setTransactionStatus(transaction.getTransactionStatus());
        response.setResponseCode(transaction.getResponseCode());
        response.setResponseMessage(transaction.getResponseMessage());
        response.setPaymentUrl(transaction.getPaymentUrl());

        if (transaction.getPayment() != null) {
            response.setPaymentId(transaction.getPayment().getPaymentId());
            response.setPaymentStatus(transaction.getPayment().getPaymentStatus());
        }

        return response;
    }
}
