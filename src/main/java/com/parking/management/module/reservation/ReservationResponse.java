package com.parking.management.module.reservation;

import com.parking.management.module.slot.ParkingSlot;
import com.parking.management.module.user.User;
import com.parking.management.module.vehicle.Vehicle;
import com.parking.management.module.vehicle.VehicleType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReservationResponse {
    // Reservation id
    private Integer reservationId;

    // User id
    private Integer userId;

    // Vehicle id
    private Integer vehicleId;

    // Vehicle type id
    private Integer vehicleTypeId;

    // Slot id
    private Integer slotId;

    // Slot code
    private String slotCode;

    // Reservation start
    private LocalDateTime reservationStart;

    // Reservation end
    private LocalDateTime reservationEnd;

    // Reservation status
    private String status;

    // Created At
    private LocalDateTime createdAt;

    // Guest name
    private String guestName;
}
