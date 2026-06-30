package com.parking.management.module.payment;

import com.parking.management.common.ResourceNotFoundException;
import com.parking.management.module.pricing.FeeCalculationResponse;
import com.parking.management.module.pricing.PricingService;
import com.parking.management.module.reservation.Reservation;
import com.parking.management.module.reservation.ReservationRepository;
import com.parking.management.module.slot.ParkingSlot;
import com.parking.management.module.slot.ParkingSlotRepository;
import com.parking.management.module.slot.SlotStatus;
import com.parking.management.module.session.ParkingSession;
import com.parking.management.module.session.ParkingSessionRepository;
import com.parking.management.module.session.SessionStatus;
import com.parking.management.module.session.SessionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.Map;
import java.time.LocalDateTime;
import java.util.List;

import com.parking.management.security.SecurityUtils;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final ReservationRepository reservationRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final PricingService pricingService;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final VnPayService vnPayService;
    private final SecurityUtils securityUtils;

    @org.springframework.beans.factory.annotation.Value("${app.backend-url:http://localhost:8080}")
    private String backendUrl;

    // SessionService được inject để dùng chung logic hoàn tất session + giải phóng slot.
    // Tránh duplicate code giữa PaymentService và SessionService.
    private final SessionService sessionService;

    @Transactional
    public PaymentResponse create(PaymentRequest request) {
        if (request.getSessionId() != null) {
            return createForSession(request);
        } else if (request.getReservationId() != null) {
            return createForReservation(request);
        } else {
            throw new IllegalArgumentException("Must provide either sessionId or reservationId");
        }
    }

    private PaymentResponse createForSession(PaymentRequest request) {
        ParkingSession session = parkingSessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking session not found with id: " + request.getSessionId()));

        if (session.getVehicle() != null && session.getVehicle().getUser() != null) {
            securityUtils.checkDataOwnership(session.getVehicle().getUser().getUserId());
        }

        if ("COMPLETED".equals(session.getStatus())) {
            throw new IllegalArgumentException("This parking session is already COMPLETED and cannot be checked out again.");
        }

        paymentRepository.findFirstBySession_SessionIdOrderByPaymentIdDesc(request.getSessionId())
                .ifPresent(existingPayment -> {
                    if (PaymentStatus.PAID.name().equals(existingPayment.getPaymentStatus())) {
                        throw new IllegalArgumentException("This parking session is already PAID.");
                    }
                    if (PaymentStatus.PENDING.name().equals(existingPayment.getPaymentStatus())) {
                        throw new IllegalArgumentException(
                                "This parking session already has a PENDING payment record (Payment ID: "
                                        + existingPayment.getPaymentId() + ")"
                        );
                    }
                });

        if (session.getVehicle() == null || session.getVehicle().getVehicleType() == null || session.getEntryTime() == null) {
            throw new IllegalArgumentException("Invalid parking session data");
        }

        BigDecimal amountToPay;
        if (SessionStatus.UNPAID.name().equals(session.getStatus()) && session.getFinalFee() != null) {
            amountToPay = session.getFinalFee();
        } else {
            LocalDateTime exitTime = session.getExitTime() == null ? LocalDateTime.now() : session.getExitTime();
            session.setExitTime(exitTime);

            FeeCalculationResponse feeResponse = pricingService.calculateFee(
                    Long.valueOf(session.getVehicle().getVehicleType().getVehicleTypeId()),
                    session.getEntryTime(), exitTime);

            amountToPay = feeResponse.getFinalFee();
            session.setFinalFee(amountToPay);
            parkingSessionRepository.save(session);
        }

        Payment payment = new Payment();
        payment.setSession(session);
        payment.setAmount(amountToPay);
        payment.setPaymentMethod(request.getPaymentMethod().name());
        payment.setPaymentStatus(PaymentStatus.PENDING.name());
        return mapEntityToResponse(paymentRepository.save(payment));
    }

    private PaymentResponse createForReservation(PaymentRequest request) {
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + request.getReservationId()));

        if (reservation.getUser() != null) {
            securityUtils.checkDataOwnership(reservation.getUser().getUserId());
        }

        if (!"PENDING".equals(reservation.getStatus()) && !"UNPAID".equals(reservation.getStatus())) {
            throw new IllegalArgumentException("Reservation is not in a valid pending state");
        }

        if (PaymentMethod.CASH.equals(request.getPaymentMethod())) {
            throw new IllegalArgumentException("Bắt buộc thanh toán Online khi đặt chỗ trước.");
        }

        java.util.Optional<Payment> existingPaymentOpt = paymentRepository.findFirstByReservation_ReservationIdOrderByPaymentIdDesc(reservation.getReservationId());
        if (existingPaymentOpt.isPresent()) {
            Payment existingPayment = existingPaymentOpt.get();
            if ("PAID".equals(existingPayment.getPaymentStatus())) {
                throw new IllegalArgumentException("Reservation is already PAID");
            }
            if ("PENDING".equals(existingPayment.getPaymentStatus())) {
                return mapEntityToResponse(existingPayment);
            }
        }

        FeeCalculationResponse feeResponse;
        try {
            feeResponse = pricingService.calculateFee(
                    Long.valueOf(reservation.getVehicleType().getVehicleTypeId()),
                    reservation.getReservationStart(), reservation.getReservationEnd());
        } catch (Exception e) {
            throw new IllegalArgumentException("Chưa có chính sách giá phù hợp để tính phí đặt chỗ.");
        }

        Payment payment = new Payment();
        payment.setReservation(reservation);
        payment.setAmount(feeResponse.getFinalFee());
        payment.setPaymentMethod(request.getPaymentMethod().name());
        payment.setPaymentStatus(PaymentStatus.PENDING.name());
        return mapEntityToResponse(paymentRepository.save(payment));
    }

    public PaymentResponse getById(Integer id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found with id: " + id
                ));

        checkPaymentOwnership(payment);

        return mapEntityToResponse(payment);
    }

    public List<PaymentResponse> getAll() {
        return paymentRepository.findAll()
                .stream()
                .map(this::mapEntityToResponse)
                .toList();
    }

    public com.parking.management.common.PageResponse<PaymentResponse> getPage(int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("paymentId").descending());
        org.springframework.data.domain.Page<Payment> paymentPage = paymentRepository.findAll(pageable);
        
        org.springframework.data.domain.Page<PaymentResponse> dtoPage = paymentPage.map(this::mapEntityToResponse);
        return new com.parking.management.common.PageResponse<>(dtoPage);
    }

    public PaymentResponse getBySessionId(Integer sessionId) {
        Payment payment = paymentRepository.findFirstBySession_SessionIdOrderByPaymentIdDesc(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found for session id: " + sessionId
                ));

        checkPaymentOwnership(payment);

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
            
            // Dùng helper method từ SessionService để đồng bộ trạng thái Session và nhả Card/Slot
            if (payment.getSession() != null) {
                ParkingSession session = payment.getSession();
                if ("PARKING".equals(session.getStatus()) || SessionStatus.UNPAID.name().equals(session.getStatus())) {
                    sessionService.completeSession(session.getSessionId());
                }
            }
            
            // Cập nhật trạng thái Reservation nếu có
            if (payment.getReservation() != null) {
                Reservation reservation = payment.getReservation();
                reservation.setStatus("CONFIRMED");
                reservationRepository.save(reservation);
                
                ParkingSlot slot = reservation.getSlot();
                if (slot.getStatus() == SlotStatus.AVAILABLE) {
                    slot.setStatus(SlotStatus.RESERVED);
                    parkingSlotRepository.save(slot);
                }
            }
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

        if (PaymentStatus.PAID.name().equals(payment.getPaymentStatus())) {
            throw new IllegalArgumentException("This payment has already been paid");
        }

        if (PaymentStatus.FAILED.name().equals(payment.getPaymentStatus())) {
            throw new IllegalArgumentException("Failed payment cannot be confirmed");
        }

        payment.setPaymentMethod(PaymentMethod.CASH.name());
        payment.setPaymentStatus(PaymentStatus.PAID.name());
        payment.setPaidAt(LocalDateTime.now());

        if (payment.getReservation() != null) {
            Reservation reservation = payment.getReservation();
            reservation.setStatus("CONFIRMED");
            reservationRepository.save(reservation);
            
            ParkingSlot slot = reservation.getSlot();
            if (slot.getStatus() == SlotStatus.AVAILABLE) {
                slot.setStatus(SlotStatus.RESERVED);
                parkingSlotRepository.save(slot);
            }
        }
        
        // Dùng helper method từ SessionService (tránh duplicate code)
        if (payment.getSession() != null) {
            ParkingSession session = payment.getSession();
            if ("PARKING".equals(session.getStatus()) || SessionStatus.UNPAID.name().equals(session.getStatus())) {
                sessionService.completeSession(session.getSessionId());
            }
        }

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
            if (payment.getSession().getVehicle() != null) {
                response.setLicensePlate(payment.getSession().getVehicle().getLicensePlate());
                if (payment.getSession().getVehicle().getOwnerName() != null) {
                    response.setCustomerName(payment.getSession().getVehicle().getOwnerName());
                    response.setCustomerPhone(payment.getSession().getVehicle().getOwnerPhone());
                } else if (payment.getSession().getVehicle().getUser() != null) {
                    response.setCustomerName(payment.getSession().getVehicle().getUser().getFullName());
                    response.setCustomerPhone(payment.getSession().getVehicle().getUser().getPhoneNumber());
                }
            }
        }
        if (payment.getReservation() != null) {
            response.setReservationId(payment.getReservation().getReservationId());
            if (payment.getReservation().getVehicle() != null && payment.getReservation().getVehicle().getLicensePlate() != null) {
                response.setLicensePlate(payment.getReservation().getVehicle().getLicensePlate());
            }
            if (payment.getReservation().getUser() != null) {
                response.setCustomerName(payment.getReservation().getUser().getFullName());
                response.setCustomerPhone(payment.getReservation().getUser().getPhoneNumber());
            }
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
            response.setPaymentUrl(backendUrl + "/mock-payment/bank-transfer/" + response.getPaymentId());
            return;
        }

        if (PaymentMethod.E_WALLET.name().equals(response.getPaymentMethod())) {
            response.setPaymentInstruction("Pay using mock e-wallet gateway. This is for demo purpose.");
            response.setQrContent("E_WALLET|PAYMENT_ID=" + response.getPaymentId()
                    + "|AMOUNT=" + response.getAmount());
            response.setPaymentUrl(backendUrl + "/mock-payment/e-wallet/" + response.getPaymentId());
            return;
        }

        if (PaymentMethod.CREDIT_CARD.name().equals(response.getPaymentMethod())) {
            response.setPaymentInstruction("Pay using mock credit card gateway. This is for demo purpose.");
            response.setPaymentUrl(backendUrl + "/mock-payment/card/" + response.getPaymentId());
        }
    }
    @Transactional
    public PaymentGatewayResponse createVnPayPaymentUrl(Integer paymentId, HttpServletRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found with id: " + paymentId
                ));

        checkPaymentOwnership(payment);

        if (!PaymentStatus.PENDING.name().equals(payment.getPaymentStatus())) {
            throw new IllegalArgumentException("Only PENDING payment can create VNPay payment URL");
        }

        // Auto convert to BANK_TRANSFER method if user selected VNPay checkout flow
        if (PaymentMethod.CASH.name().equals(payment.getPaymentMethod())) {
            payment.setPaymentMethod(PaymentMethod.BANK_TRANSFER.name());
            paymentRepository.save(payment);
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

            // Check if it's a reservation payment
            if (payment.getReservation() != null) {
                Reservation reservation = payment.getReservation();
                reservation.setStatus("CONFIRMED");
                reservationRepository.save(reservation);

                ParkingSlot slot = reservation.getSlot();
                if (slot.getStatus() == SlotStatus.AVAILABLE) {
                    slot.setStatus(SlotStatus.RESERVED);
                    parkingSlotRepository.save(slot);
                } else {
                    // Cố gắng tìm slot khác nếu slot cũ đã bị lấy (Quick Booking)
                    ParkingSlot newSlot = parkingSlotRepository
                            .findFirstAvailableSlot(
                                    reservation.getVehicleType().getVehicleTypeId()
                            ).orElse(null);
                    
                    if (newSlot != null) {
                        newSlot.setStatus(SlotStatus.RESERVED);
                        parkingSlotRepository.save(newSlot);
                        reservation.setSlot(newSlot);
                        reservationRepository.save(reservation);
                    } else {
                        /*
                         * TRƯỜNG HỢP ĐẶC BIỆT:
                         * Thanh toán VNPay thành công, nhưng không còn chỗ trống nào.
                         *
                         * Xử lý:
                         * 1. Hủy reservation (vì không có slot cho khách)
                         * 2. Đánh dấu payment = REFUND_PENDING để Staff/Admin hoàn tiền thủ công
                         * 3. Ghi log CRITICAL để theo dõi
                         */
                        reservation.setStatus("CANCELLED");
                        reservationRepository.save(reservation);

                        payment.setPaymentStatus(PaymentStatus.REFUND_PENDING.name());

                        log.error("CRITICAL: VNPay payment succeeded but NO SLOTS available. "
                                + "Reservation ID: {} → CANCELLED. "
                                + "Payment ID: {} → REFUND_PENDING. "
                                + "Staff/Admin cần hoàn tiền thủ công cho khách.",
                                reservation.getReservationId(), payment.getPaymentId());
                    }
                }
                log.info("Đặt chỗ xử lý xong cho Reservation ID: {}", reservation.getReservationId());
            }

            // Dùng helper method từ SessionService (tránh duplicate code)
            if (payment.getSession() != null) {
                ParkingSession session = payment.getSession();
                if ("PARKING".equals(session.getStatus()) || SessionStatus.UNPAID.name().equals(session.getStatus())) {
                    sessionService.completeSession(session.getSessionId());
                }
            }

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

    private void checkPaymentOwnership(Payment payment) {
        if (payment.getSession() != null && payment.getSession().getVehicle() != null && payment.getSession().getVehicle().getUser() != null) {
            securityUtils.checkDataOwnership(payment.getSession().getVehicle().getUser().getUserId());
        } else if (payment.getReservation() != null && payment.getReservation().getUser() != null) {
            securityUtils.checkDataOwnership(payment.getReservation().getUser().getUserId());
        }
    }
}
