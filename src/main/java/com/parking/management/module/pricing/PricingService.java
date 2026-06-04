package com.parking.management.module.pricing;

import com.parking.management.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
