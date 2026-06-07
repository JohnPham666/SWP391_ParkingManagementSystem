package com.parking.management.module.reservation;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReservationResponse {

    private Integer reservationId;
    private Integer userId;
    private String userFullName;
    private Integer vehicleId;
    private String licensePlate;
    private Integer vehicleTypeId;
    private String vehicleTypeName;
    private Integer slotId;
    private String slotCode;
    private LocalDateTime reservationStart;
    private LocalDateTime reservationEnd;
    private String status;
    private LocalDateTime createdAt;
    private String guestName;

    public static ReservationResponse fromEntity(Reservation reservation) {
        return new ReservationResponse(
                reservation.getReservationId(),
                reservation.getUser() != null ? reservation.getUser().getUserId() : null,
                reservation.getUser() != null ? reservation.getUser().getFullName() : null,
                reservation.getVehicle() != null ? reservation.getVehicle().getVehicleId() : null,
                reservation.getVehicle() != null ? reservation.getVehicle().getLicensePlate() : null,
                reservation.getVehicleType() != null ? reservation.getVehicleType().getVehicleTypeId() : null,
                reservation.getVehicleType() != null ? reservation.getVehicleType().getTypeName() : null,
                reservation.getSlot() != null ? reservation.getSlot().getSlotId() : null,
                reservation.getSlot() != null ? reservation.getSlot().getSlotCode() : null,
                reservation.getReservationStart(),
                reservation.getReservationEnd(),
                reservation.getStatus(),
                reservation.getCreatedAt(),
                reservation.getGuestName()
        );
    }
}
