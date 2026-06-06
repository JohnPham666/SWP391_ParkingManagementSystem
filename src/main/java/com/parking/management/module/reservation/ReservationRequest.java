package com.parking.management.module.reservation;

import com.parking.management.module.user.User;
import com.parking.management.module.vehicle.Vehicle;
import com.parking.management.module.vehicle.VehicleType;
import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Data
public class ReservationRequest {
    /*
     * ReservationRequest dùng để nhận dữ liệu đặt chỗ từ client.
     * Client chỉ gửi các ID cần thiết như userId, vehicleId, vehicleTypeId.
     * Service sẽ dùng các ID này để tìm entity thật trong database.
     *
     * Không có reservationId vì ID được database tự động tạo khi lưu Reservation.
     * Không có slotId trong request vì hệ thống sẽ tự tìm slot AVAILABLE phù hợp
     * rồi hold slot đó cho user.
     */
    @NotNull(message = "User id is required")
    private User user;

    @NotNull(message = "Vehicle id is required")
    private Vehicle vehicle;

    @NotNull(message = "Vehicle type id is required")
    private VehicleType vehicleType;

    @NotNull(message = "Reservation start is required")
    private LocalDateTime reservationStart;

    @NotNull(message = "Reservation end is required")
    private LocalDateTime reservationEnd;

    @Size(max = 100, message = "Guest's name must not exceed 100 charaters")
    private String guestName;

}
