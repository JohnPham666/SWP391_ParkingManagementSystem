package com.parking.management.module.session;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VerifyCheckoutResponse {
    private String matchStatus; // MATCH, MISMATCH, MANUAL_VERIFICATION
    private String message;
    private SessionResponse sessionFromCard;
    private SessionResponse sessionFromPlate;
}
