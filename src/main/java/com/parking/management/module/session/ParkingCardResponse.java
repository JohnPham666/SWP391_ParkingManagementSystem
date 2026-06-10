package com.parking.management.module.session;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ParkingCardResponse {
    private String cardId;
    private String status;
    private LocalDateTime issuedAt;
}
