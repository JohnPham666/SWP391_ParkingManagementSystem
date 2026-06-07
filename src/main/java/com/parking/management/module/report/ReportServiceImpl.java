package com.parking.management.module.report;

import com.parking.management.module.payment.PaymentRepository;
import com.parking.management.module.report.dto.OccupancyReportResponse;
import com.parking.management.module.report.dto.RevenueReportResponse;
import com.parking.management.module.report.dto.SessionSummaryResponse;
import com.parking.management.module.slot.ParkingSlotRepository;
import com.parking.management.module.slot.SlotStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
}