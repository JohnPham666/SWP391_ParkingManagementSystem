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
@SuppressWarnings("null")
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

    //Truyền null vào overtimeStart để tính cho trường hợp không có overtime(3 tham số)
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

    //Gọi trực tiếp method khi có overtime (4 tham số)
    public FeeCalculationResponse calculateFee(Long vehicleTypeId,
                                               LocalDateTime entryTime,
                                               LocalDateTime exitTime,
                                               LocalDateTime overtimeStart) {
        // --- Validation ---
        if (exitTime.isBefore(entryTime)) {
            throw new IllegalArgumentException("Exit time must be after entry time.");
        }

        // --- Lấy pricing policy đang hiệu lực cho loại xe tương ứng ---
        PricingPolicy policy = repository.findActivePolicyByVehicleTypeId(
                vehicleTypeId, LocalDateTime.now())
                .orElseThrow(() -> new ResourceNotFoundException(//nếu không tìm thấy thì ném ra exception
                        "No active pricing policy found for vehicle type id: " + vehicleTypeId));

        //Lấy giờ cao điểm từ policy của loại xe tương ứng
        LocalTime rushStart = policy.getRushHourStart();
        LocalTime rushEnd   = policy.getRushHourEnd();

        // ============================================================
        // 1. BASE PRICE — phí vào cổng, thu 1 lần khi xe vào
        // ============================================================
        BigDecimal baseFee = (policy.getBasePrice() != null)
                ? policy.getBasePrice()//gán base price từ policy nếu có vào baseFee
                : BigDecimal.ZERO;//mặc định baseFee bằng 0 nếu không có

        // ============================================================
        // 2. HOURLY FEE — tính từ entryTime đến normalEnd
        //    normalEnd = overtimeStart nếu có, ngược lại = exitTime
        // ============================================================

        //Kiểm tra xem xe có overTime hay không
        //OverTimeStart khi reservation end
        //Exit Time isAfter overtimeStart nghĩa là sau khi reservation end thì xe vẫn ở lại gửi xe
        boolean hasOvertime = overtimeStart != null && exitTime.isAfter(overtimeStart);

        //normalEnd là thời gian kết thúc tính phí theo giờ
        //nếu có overtime thì normalEnd = overtimeStart
        //nếu không có overtime thì normalEnd = exitTime
        LocalDateTime normalEnd = hasOvertime ? overtimeStart : exitTime;

        //tính tổng số giây từ entryTime đến normalEnd
        long totalSeconds = java.time.Duration.between(entryTime, normalEnd).getSeconds();
        //làm tròn lên số giờ theo Rounding Rule: Gửi lố 1 phút cũng tính tròn thành 1 tiếng
        long totalHours   = (totalSeconds <= 0) ? 0 : (long) Math.ceil(totalSeconds / 3600.0);

        //khởi tạo biến đếm số giờ cao điểm(rushHours) và giờ thường(offPeakHours)
        long rushHours    = 0;
        long offPeakHours = 0;

        // Base price đã bao gồm 1 giờ đầu tiên
        long billableHours = Math.max(0, totalHours - 1);
        //Phí giờ (hourly fee) sẽ tính từ giờ thứ 2 
        LocalDateTime billingStartTime = entryTime.plusHours(1);//Cộng thêm 1 giờ vào entryTime để tính giờ thứ 2 trở đi

        //Số giờ cao điểm trong 1 ngày
        long rushHoursPerDay;   
        if (rushStart.isBefore(rushEnd)) {//Nếu giờ cao điểm bắt đầu trước giờ cao điểm kết thúc
            rushHoursPerDay = java.time.Duration.between(rushStart, rushEnd).toHours();//Tính số giờ cao điểm trong ngày
        } else {//Nếu giờ cao điểm kết thúc trước giờ cao điểm bắt đầu(ví dụ 22h - 6h)
            //Do không thể lấy 6h trừ 22h nên ta dùng 24h trừ đi khoảng thời gian không cao điểm
            //Khoảng thời gian từ 22h tới 6h = (6 - 22) = -16h -> SAI
            //Cách đúng: 24 - (22 - 6) = 24 - 16 = 8 -> ĐÚNG
            rushHoursPerDay = 24 - java.time.Duration.between(rushEnd, rushStart).toHours();//Tính số giờ cao điểm trong ngày
        }
    
        //Từ số giờ cao điểm trong ngày(rushHoursPerDay) suy ra số giờ thường trong ngày
        long offPeakHoursPerDay = 24 - rushHoursPerDay;

        //Số ngày tính phí(tổng số giờ tính phí chia cho 24,ví dụ 100 giờ / 24 = 4 ngày)
        long fullDays = billableHours / 24;
        //Số giờ còn lại sau khi đã tính hết số ngày(lấy tổng số giờ tính phí chia lấy dư cho 24)
        //Ví dụ 100 giờ % 24 = 4 giờ lẻ
        long remainingHours = billableHours % 24;

        //tính tổng số giờ cao điểm và giờ thường dựa trên số ngày tính phí
        rushHours = fullDays * rushHoursPerDay;
        offPeakHours = fullDays * offPeakHoursPerDay;

        // Tính các giờ lẻ còn lại
        // Lấy mốc thời gian sau khi đã bỏ qua X ngày chẵn
        // để làm điểm bắt đầu đếm các giờ lẻ còn lại\
        // Ví dụ: 100 giờ = 4 ngày 4 giờ lẻ
        // fullDays = 4 ngày
        // remainingHours = 4 giờ
        // billingStartTime = 10:00 (ngày 1) cộng thêm 4 ngày
        // currentHour = 10:00 (ngày 5)
        LocalDateTime currentHour = billingStartTime.plusDays(fullDays);
        for (int i = 0; i < remainingHours; i++) {//Duyệt qua số giờ còn lại
            LocalTime timeOfDay = currentHour.toLocalTime();//Lấy giờ hiện tại
            if (isRushHour(timeOfDay, rushStart, rushEnd)) {//Kiểm tra xem có phải giờ cao điểm không
                rushHours++;//tăng số giờ cao điểm 
            } else {//Nếu không phải giờ cao điểm
                offPeakHours++;//tăng số giờ không cao điểm
            }
            currentHour = currentHour.plusHours(1);//tăng lên 1 giờ(đi qua toàn bộ số giờ lẻ)
        }

        BigDecimal rushHourFee = policy.getRushHourPrice().multiply(BigDecimal.valueOf(rushHours));//tính phí giờ cao điểm = số giờ cao điểm * phí giờ cao điểm
        BigDecimal offPeakFee  = policy.getOffPeakPrice().multiply(BigDecimal.valueOf(offPeakHours));//tính phí giờ thường = số giờ thường * phí giờ thường
        
        //tính tổng phí giờ cao điểm và giờ thường
        //totalFeeBeforeCap = rushHourFee + offPeakFee;
        BigDecimal totalFeeBeforeCap = rushHourFee.add(offPeakFee);

        // --- Áp MaxDailyRate cap theo từng ngày ---
        BigDecimal cappedHourlyFee = applyDailyCap(totalFeeBeforeCap, billableHours, policy, billingStartTime, rushStart, rushEnd);

        // ============================================================
        // 3. OVERTIME FEE — tính cho khoảng thời gian xe ở quá giờ
        //    Áp dụng khi xe ra sau overtimeStart (ví dụ: sau ReservationEnd)
        // ============================================================

        //khai báo số giờ quá hạn và phí quá hạn
        long overtimeHours = 0;
        BigDecimal overtimeFee = BigDecimal.ZERO;

        //kiểm tra nếu có quá hạn
        if (hasOvertime && policy.getOvertimeFeePerHour() != null
                && policy.getOvertimeFeePerHour().compareTo(BigDecimal.ZERO) > 0) {
            long overtimeMinutes = java.time.Duration.between(overtimeStart, exitTime).toMinutes();
            overtimeHours = (long) Math.ceil(overtimeMinutes / 60.0);
            //overtimeFee = getOvertimeFeePerHour * overtimeHours;
            overtimeFee = policy.getOvertimeFeePerHour().multiply(BigDecimal.valueOf(overtimeHours));
        }

        // ============================================================
        // 4. FINAL FEE = BasePrice + CappedHourlyFee + OvertimeFee
        // ============================================================

        //finalFee = baseFee(1 giờ đầu tiên) + cappedHourlyFee(giờ thứ 2 trở đi) + overtimeFee(từ lúc vượt giờ)
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

        //lấy mức phí hàng ngày tối đa
        BigDecimal maxDaily = policy.getMaxDailyRate();
        //tính số ngày đầy đủ(24 giờ)
        long fullDays       = totalHours / 24;
        //tính số giờ lẻ còn lại
        long remainingHours = totalHours % 24;

        //tính phí cho các ngày đầy đủ — mỗi ngày tối đa maxDaily
        //fullDaysFee = maxDaily * số ngày đầy đủ(fullDays)
        BigDecimal fullDaysFee = maxDaily.multiply(BigDecimal.valueOf(fullDays));

        // Tính phí cho phần giờ lẻ của ngày cuối
        // Khởi tạo remainingFee
        BigDecimal remainingFee = BigDecimal.ZERO;//phần phí còn lại
        if (remainingHours > 0) {//Có tồn tại giờ lẻ
            long remRush = 0, remOff = 0;//Số giờ cao điểm(remRush), giờ thường(remOff)

            //biến thời gian(remTime) bắt đầu giờ lẻ(để tính toán giờ cao điểm, giờ thường)
            LocalDateTime remTime = entryTime.plusDays(fullDays);
            //duyệt qua số giờ lẻ
            for (int i = 0; i < remainingHours; i++) {// duyet qua remainingHours(số giờ lẻ)
                //kiểm tra xem có phải giờ cao điểm không
                if (isRushHour(remTime.toLocalTime(), rushStart, rushEnd)) remRush++;//tăng số giờ cao điểm
                else remOff++;//tăng số giờ thường

                //tăng lên 1 giờ để kiểm tra giờ tiếp theo
                remTime = remTime.plusHours(1);
            }
            //tính phí giờ lẻ = (phí giờ cao điểm * số giờ cao điểm) + (phí giờ thường * số giờ thường)
            BigDecimal remFee = policy.getRushHourPrice().multiply(BigDecimal.valueOf(remRush))
                    .add(policy.getOffPeakPrice().multiply(BigDecimal.valueOf(remOff)));

            // Cap phần giờ lẻ nếu vượt MaxDailyRate
            remainingFee = remFee.compareTo(maxDaily) > 0 ? maxDaily : remFee;
        }

        //tổng phí = phí của ngày đầy đủ + phí của giờ lẻ
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
