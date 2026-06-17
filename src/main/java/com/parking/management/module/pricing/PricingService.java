package com.parking.management.module.pricing;

import com.parking.management.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PricingService {
    private final PricingPolicyRepository repository;


    //C : CREATE
    public PricingResponse createNewPricingPolicy(PricingRequest request){
        PricingPolicy newPolicy = new PricingPolicy();
        //Convert/Map to entity
        mapRequestToEntity(request,newPolicy);

        //Save to database
        PricingPolicy savedPolicy = repository.save(newPolicy);

        //Convert/map to response and return to Front end/ swagger
        return entityMapToResponse(savedPolicy);
    }

    //R : READ

    //Get pricing policy by pricing policy id
    public PricingResponse getPricingPolicyById(Long pricingPolicyId){
        PricingPolicy pricingPolicy = repository.findById(pricingPolicyId)
                /* repository.findById() trả về Optional vì dữ liệu có thể tồn tại hoặc không tồn tại.
                 * Nếu không tìm thấy chính sách giá, hệ thống sẽ ném ra ResourceNotFoundException.
                 * .orElseThrow() nghĩa là:
                 * - Nếu tìm thấy dữ liệu thì lấy PricingPolicy ra.
                 * - Nếu không tìm thấy dữ liệu thì ném ra exception.
                 *
                 * () -> new ResourceNotFoundException(...)
                 * là lambda expression.
                 * Dấu () nghĩa là hàm này không nhận tham số nào.
                 * Dấu -> nghĩa là khi hàm này được gọi thì thực hiện phần bên phải.
                 * Ở đây, khi không tìm thấy dữ liệu, Java mới tạo ResourceNotFoundException.
                 */
                .orElseThrow(() -> new ResourceNotFoundException("Pricing policy not found with id: " + pricingPolicyId));
        //map entity to response and return to front end/ swagger
        return entityMapToResponse(pricingPolicy);
    }

    //Get all pricing policy
    public List<PricingResponse> getAllPricingPolicy(){
        //Get all pricing policy from database, vì findALl() trả về List<PricingPolicy>
        // chứ ko phải Optional nên ko xài .orElseThrown như .findById
        List<PricingPolicy> pricingPolicies = repository.findAll();

        //Tạo ra 1 list Pricing response rỗng để map tất cả pricing policy vào
        List<PricingResponse> pricingResponses = new ArrayList<>();

        //For each
        for(PricingPolicy pricingPolicy : pricingPolicies){
            //Convert/ Map thành response sau đó add vào response list
            pricingResponses.add(entityMapToResponse(pricingPolicy));
        }
        return pricingResponses;
    }

    //Get pricing policy by vehicle type id
    public List<PricingResponse> getPricingPolicyByVehicleTypeId(Long vehicleTypeId){
        /*
         * Lấy danh sách PricingPolicy theo VehicleTypeID.
         * Hàm này trả về List<PricingPolicy>, không phải Optional.
         *
         * Nếu tìm thấy dữ liệu, list sẽ có các pricing policy.
         * Nếu không tìm thấy dữ liệu, list sẽ là list rỗng [].
         * Vì vậy không cần dùng .orElseThrow() như findById().
         */
        List<PricingPolicy> pricingPolicies = repository.findByVehicleTypeId(vehicleTypeId);
        //Tạo ra 1 list Pricing response rỗng để map tất cả pricing policy vào
        List<PricingResponse> pricingResponses = new ArrayList<>();
        //For each
        for(PricingPolicy pricingPolicy : pricingPolicies){
            //Convert/ Map thành response sau đó add vào response list
            pricingResponses.add(entityMapToResponse(pricingPolicy));
        }
        return pricingResponses;
    }

    //U : UPDATE
    public PricingResponse updatePricingPolicy(Long pricingPolicyId, PricingRequest updateRequest){
        //Tìm xem id đó có tồn tại hay ko
        PricingPolicy pricingPolicy = repository.findById(pricingPolicyId)
                .orElseThrow(()->new ResourceNotFoundException("Pricing policy not found with id: " + pricingPolicyId));

        //nếu tìm thấy thì mapping request thành entity
        // (cũng có thể hiểu là chuyển data từ request vào pricing policy có id tương ứng mà user tìm
        mapRequestToEntity(updateRequest,pricingPolicy);

        //Save updated pricing policy vào database
        PricingPolicy updatedPricingPolicy = repository.save(pricingPolicy);

        //Convert/map to response and return to Front end/ swagger
        return entityMapToResponse(updatedPricingPolicy);
    }

    //D: DELETE
    public void deletePricingPolicyById(Long pricingPolicyId){
        //Tìm xem id đó có tồn tại hay ko
        PricingPolicy pricingPolicy = repository.findById(pricingPolicyId)
                .orElseThrow(()->new ResourceNotFoundException("Pricing policy not found with id: " + pricingPolicyId));

        //Delete
        repository.delete(pricingPolicy);
    }

    //================================================================================================================
    // PHASE 2: THUẬT TOÁN TÍNH PHÍ GỬI XE (FEE CALCULATION)
    //================================================================================================================

    /**
     * Tính phí gửi xe — không có overtime (walk-in hoặc không có reservation).
     *
     * FinalFee = BasePrice + HourlyFee (capped by MaxDailyRate/ngày)
     */
    public FeeCalculationResponse calculateFee(Long vehicleTypeId,
                                               LocalDateTime entryTime,
                                               LocalDateTime exitTime) {
        return calculateFee(vehicleTypeId, entryTime, exitTime, null);
    }

    /**
     * Tính phí gửi xe — có hỗ trợ overtime.
     *
     * FinalFee = BasePrice
     *          + HourlyFee từ entryTime đến normalEnd (capped by MaxDailyRate/ngày)
     *          + OvertimeFee nếu exitTime > overtimeStart
     *
     * @param overtimeStart Thời điểm bắt đầu tính overtime (thường là ReservationEnd).
     *                      NULL nếu không có reservation.
     */
    public FeeCalculationResponse calculateFee(Long vehicleTypeId,
                                               LocalDateTime entryTime,
                                               LocalDateTime exitTime,
                                               LocalDateTime overtimeStart) {
        // --- Validation ---
        if (exitTime.isBefore(entryTime)) {
            throw new IllegalArgumentException("Exit time must be after entry time.");
        }

        // --- Lấy pricing policy đang hiệu lực ---
        PricingPolicy policy = repository.findActivePolicyByVehicleTypeId(
                vehicleTypeId, LocalDateTime.now())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active pricing policy found for vehicle type id: " + vehicleTypeId));

        LocalTime rushStart = policy.getRushHourStart();
        LocalTime rushEnd   = policy.getRushHourEnd();

        // ============================================================
        // 1. BASE PRICE — phí vào cổng, thu 1 lần khi xe vào
        // ============================================================
        BigDecimal baseFee = (policy.getBasePrice() != null)
                ? policy.getBasePrice()
                : BigDecimal.ZERO;

        // ============================================================
        // 2. HOURLY FEE — tính từ entryTime đến normalEnd
        //    normalEnd = overtimeStart nếu có, ngược lại = exitTime
        // ============================================================
        boolean hasOvertime = overtimeStart != null && exitTime.isAfter(overtimeStart);
        LocalDateTime normalEnd = hasOvertime ? overtimeStart : exitTime;

        long totalMinutes = java.time.Duration.between(entryTime, normalEnd).toMinutes();
        long totalHours   = (totalMinutes <= 0) ? 0 : (long) Math.ceil(totalMinutes / 60.0);

        long rushHours    = 0;
        long offPeakHours = 0;

        LocalDateTime currentHour = entryTime;
        for (int i = 0; i < totalHours; i++) {
            LocalTime timeOfDay = currentHour.toLocalTime();
            if (isRushHour(timeOfDay, rushStart, rushEnd)) {
                rushHours++;
            } else {
                offPeakHours++;
            }
            currentHour = currentHour.plusHours(1);
        }

        BigDecimal rushHourFee = policy.getRushHourPrice().multiply(BigDecimal.valueOf(rushHours));
        BigDecimal offPeakFee  = policy.getOffPeakPrice().multiply(BigDecimal.valueOf(offPeakHours));
        BigDecimal totalFeeBeforeCap = rushHourFee.add(offPeakFee);

        // --- Áp MaxDailyRate cap theo từng ngày ---
        BigDecimal cappedHourlyFee = applyDailyCap(totalFeeBeforeCap, totalHours, policy, entryTime, rushStart, rushEnd);

        // ============================================================
        // 3. OVERTIME FEE — tính cho khoảng thời gian xe ở quá giờ
        //    Áp dụng khi xe ra sau overtimeStart (ví dụ: sau ReservationEnd)
        // ============================================================
        long overtimeHours = 0;
        BigDecimal overtimeFee = BigDecimal.ZERO;

        if (hasOvertime && policy.getOvertimeFeePerHour() != null
                && policy.getOvertimeFeePerHour().compareTo(BigDecimal.ZERO) > 0) {
            long overtimeMinutes = java.time.Duration.between(overtimeStart, exitTime).toMinutes();
            overtimeHours = (long) Math.ceil(overtimeMinutes / 60.0);
            overtimeFee = policy.getOvertimeFeePerHour().multiply(BigDecimal.valueOf(overtimeHours));
        }

        // ============================================================
        // 4. FINAL FEE = BasePrice + CappedHourlyFee + OvertimeFee
        // ============================================================
        BigDecimal finalFee = baseFee.add(cappedHourlyFee).add(overtimeFee);

        // --- Build response ---
        FeeCalculationResponse response = new FeeCalculationResponse();
        response.setPolicyName(policy.getPolicyName());
        response.setBaseFee(baseFee);
        response.setTotalHours(totalHours);
        response.setRushHours(rushHours);
        response.setOffPeakHours(offPeakHours);
        response.setRushHourFee(rushHourFee);
        response.setOffPeakFee(offPeakFee);
        response.setTotalFeeBeforeCap(totalFeeBeforeCap);
        response.setCappedHourlyFee(cappedHourlyFee);
        response.setOvertimeHours(overtimeHours);
        response.setOvertimeFee(overtimeFee);
        response.setFinalFee(finalFee);

        return response;
    }

    /**
     * Áp MaxDailyRate cap theo từng ngày.
     *
     * Logic:
     * - Mỗi block 24 giờ bị cap bởi MaxDailyRate.
     * - Phần giờ lẻ (< 24h) của ngày cuối tính riêng, cũng bị cap nếu vượt MaxDailyRate.
     *
     * Ví dụ: gửi 30 giờ, MaxDailyRate = 50.000đ
     *   - Ngày 1 (24h): tính rush/offpeak ra 80.000đ → cap thành 50.000đ
     *   - 6h còn lại: tính rush/offpeak ra 30.000đ → không cần cap
     *   - cappedHourlyFee = 50.000 + 30.000 = 80.000đ
     */
    private BigDecimal applyDailyCap(BigDecimal totalFeeBeforeCap,
                                     long totalHours,
                                     PricingPolicy policy,
                                     LocalDateTime entryTime,
                                     LocalTime rushStart,
                                     LocalTime rushEnd) {
        if (policy.getMaxDailyRate() == null
                || policy.getMaxDailyRate().compareTo(BigDecimal.ZERO) <= 0) {
            // Không có MaxDailyRate → không cap, trả về nguyên
            return totalFeeBeforeCap;
        }

        BigDecimal maxDaily = policy.getMaxDailyRate();
        long fullDays       = totalHours / 24;
        long remainingHours = totalHours % 24;

        // Phí cho các ngày đầy đủ — mỗi ngày tối đa maxDaily
        BigDecimal fullDaysFee = maxDaily.multiply(BigDecimal.valueOf(fullDays));

        // Tính phí cho phần giờ lẻ của ngày cuối
        BigDecimal remainingFee = BigDecimal.ZERO;
        if (remainingHours > 0) {
            long remRush = 0, remOff = 0;
            LocalDateTime remTime = entryTime.plusDays(fullDays);
            for (int i = 0; i < remainingHours; i++) {
                if (isRushHour(remTime.toLocalTime(), rushStart, rushEnd)) remRush++;
                else remOff++;
                remTime = remTime.plusHours(1);
            }
            BigDecimal remFee = policy.getRushHourPrice().multiply(BigDecimal.valueOf(remRush))
                    .add(policy.getOffPeakPrice().multiply(BigDecimal.valueOf(remOff)));

            // Cap phần giờ lẻ nếu vượt MaxDailyRate
            remainingFee = remFee.compareTo(maxDaily) > 0 ? maxDaily : remFee;
        }

        return fullDaysFee.add(remainingFee);
    }


    private boolean isRushHour(LocalTime timeOfDay, LocalTime rushStart, LocalTime rushEnd) {
        if (rushStart.isBefore(rushEnd)) {
            // Trường hợp bình thường: VD 07:00 -> 19:00
            // timeOfDay >= rushStart AND timeOfDay < rushEnd
            return !timeOfDay.isBefore(rushStart) && timeOfDay.isBefore(rushEnd);
        } else {
            // Trường hợp qua đêm: VD 22:00 -> 06:00
            // timeOfDay >= rushStart OR timeOfDay < rushEnd
            return !timeOfDay.isBefore(rushStart) || timeOfDay.isBefore(rushEnd);
        }
    }





    //================================================================================================================

    //Supportive function (map request to entity)
    private void mapRequestToEntity(PricingRequest request, PricingPolicy entity){
        //Vehicle id
        entity.setVehicleTypeId(request.getVehicleTypeId());
        //Policy name
        entity.setPolicyName(request.getPolicyName());
        //Base price
        entity.setBasePrice(request.getBasePrice());
        //RushHourPrice
        entity.setRushHourPrice(request.getRushHourPrice());
        //Off-peak price
        entity.setOffPeakPrice(request.getOffPeakPrice());
        //Rush hour start
        entity.setRushHourStart(request.getRushHourStart());
        //Rush hour end
        entity.setRushHourEnd(request.getRushHourEnd());
        //Max daily rate
        entity.setMaxDailyRate(request.getMaxDailyRate());
        //Lost ticket fee
        entity.setLostTicketFee(request.getLostTicketFee());
        //Overtime fee per hour
        entity.setOvertimeFeePerHour(request.getOvertimeFeePerHour());
        //Effective from
        entity.setEffectiveFrom(request.getEffectiveFrom());
        //Effective to
        entity.setEffectiveTo(request.getEffectiveTo());
    }


    //Supportive function (map entity to response)
    private PricingResponse entityMapToResponse(PricingPolicy entity){
        PricingResponse response = new PricingResponse();

        //Pricing policy id
        response.setPricingPolicyId(entity.getPricingPolicyId());
        //Vehicle id
        response.setVehicleTypeId(entity.getVehicleTypeId());
        //Policy name
        response.setPolicyName(entity.getPolicyName());
        //Base price
        response.setBasePrice(entity.getBasePrice());
        //RushHourPrice
        response.setRushHourPrice(entity.getRushHourPrice());
        //Off-peak price
        response.setOffPeakPrice(entity.getOffPeakPrice());
        //Rush hour start
        response.setRushHourStart(entity.getRushHourStart());
        //Rush hour end
        response.setRushHourEnd(entity.getRushHourEnd());
        //Max daily rate
        response.setMaxDailyRate(entity.getMaxDailyRate());
        //Lost ticket fee
        response.setLostTicketFee(entity.getLostTicketFee());
        //Overtime fee per hour
        response.setOvertimeFeePerHour(entity.getOvertimeFeePerHour());
        //Effective from
        response.setEffectiveFrom(entity.getEffectiveFrom());
        //Effective to
        response.setEffectiveTo(entity.getEffectiveTo());
        return response;
    }
}
