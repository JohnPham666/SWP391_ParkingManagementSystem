package com.parking.management.module.report;

import com.parking.management.module.payment.PaymentRepository;
import com.parking.management.module.report.dto.OccupancyReportResponse;
import com.parking.management.module.report.dto.RevenueReportResponse;
import com.parking.management.module.report.dto.SessionSummaryResponse;
import com.parking.management.module.slot.ParkingSlotRepository;
import com.parking.management.module.slot.SlotStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.parking.management.module.report.dto.ParkingPredictionResponse;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final PaymentRepository paymentRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    @Override
    public RevenueReportResponse getTotalRevenueByDateRange(LocalDate from, LocalDate to) {
        var fromDateTime = from.atStartOfDay();
        var toDateTime = to.atTime(23, 59, 59);

        return new RevenueReportResponse(
                from,
                to,
                paymentRepository.getTotalRevenue(fromDateTime, toDateTime),
                paymentRepository.countPaidPayments(fromDateTime, toDateTime)
        );
    }

    @Override
    public OccupancyReportResponse getOccupancyRateByFloor(Integer floorId) {
        long totalSlots = parkingSlotRepository.count();
        long availableSlots = parkingSlotRepository.countByStatus(SlotStatus.AVAILABLE);
        long occupiedSlots = parkingSlotRepository.countByStatus(SlotStatus.OCCUPIED);
        long reservedSlots = parkingSlotRepository.countByStatus(SlotStatus.RESERVED);

        double occupancyRate = totalSlots == 0
                ? 0
                : ((double) (occupiedSlots + reservedSlots) / totalSlots) * 100;

        return new OccupancyReportResponse(
                (int) totalSlots,
                (int) availableSlots,
                (int) occupiedSlots,
                (int) reservedSlots,
                occupancyRate
        );
    }

    @Override
    public SessionSummaryResponse getSessionCountByDate(LocalDate date) {
        return new SessionSummaryResponse();
    }
    @Override
    public ParkingPredictionResponse generateParkingPrediction() {
        long totalSlots = parkingSlotRepository.count();
        long occupiedSlots = parkingSlotRepository.countByStatus(SlotStatus.OCCUPIED);
        long reservedSlots = parkingSlotRepository.countByStatus(SlotStatus.RESERVED);

        double currentOccupancyRate = totalSlots == 0
                ? 0
                : ((double) (occupiedSlots + reservedSlots) / totalSlots) * 100;

        int currentHour = java.time.LocalDateTime.now().getHour();

        double predictedOccupancyRate = currentOccupancyRate;

        if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
            predictedOccupancyRate = Math.min(100, currentOccupancyRate + 15);
        } else if (currentHour >= 11 && currentHour <= 14) {
            predictedOccupancyRate = Math.min(100, currentOccupancyRate + 8);
        } else {
            predictedOccupancyRate = Math.max(0, currentOccupancyRate - 5);
        }

        String level;
        if (predictedOccupancyRate >= 80) {
            level = "HIGH";
        } else if (predictedOccupancyRate >= 50) {
            level = "MEDIUM";
        } else {
            level = "LOW";
        }

        String message = switch (level) {
            case "HIGH" -> "Parking demand is expected to be high.";
            case "MEDIUM" -> "Parking demand is expected to be moderate.";
            default -> "Parking demand is expected to be low.";
        };

        return new ParkingPredictionResponse(
                currentOccupancyRate,
                predictedOccupancyRate,
                level,
                message,
                java.time.LocalDateTime.now()
        );
    }
}