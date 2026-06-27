package com.parking.management.module.alpr;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AlprService {

    @Value("${platerecognizer.api.token}")
    private String apiToken;

    @Value("${platerecognizer.api.url}")
    private String apiUrl;

    public String recognizeLicensePlate(MultipartFile file) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Authorization", apiToken); // Gắn chìa khóa vào Header

            // Đóng gói file ảnh để gửi đi
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("upload", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg"; 
                }
            });
            body.add("regions", "vn"); // Báo cho AI biết đây là biển số Việt Nam

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // BẮT ĐẦU GỌI API (Gửi POST Request sang Platerecognizer)
            String safeUrl = apiUrl != null ? apiUrl : "https://api.platerecognizer.com/v1/plate-reader/";
            ResponseEntity<String> response = restTemplate.postForEntity(safeUrl, requestEntity, String.class);

            // Bóc tách kết quả JSON trả về
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(response.getBody());
            JsonNode results = rootNode.path("results");
            
            if (results.isArray() && results.size() > 0) {
                // Lấy biển số đầu tiên AI đọc được (chuyển thành IN HOA)
                String plate = results.get(0).path("plate").asText().toUpperCase();
                plate = formatLicensePlate(plate);
                log.info("ALPR Recognized Plate: {}", plate);
                return plate;
            }
            log.warn("ALPR returned no results for the uploaded image");
            return null; // Không đọc được biển số
            
        } catch (Exception e) {
            log.error("Error during ALPR recognition: {}", e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    private String formatLicensePlate(String plate) {
        if (plate == null || plate.length() < 6) return plate;
        
        plate = plate.replaceAll("[^A-Z0-9]", "");
        
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^(\\d{2})([A-Z]{1,2}\\d?)(\\d{4,5})$");
        java.util.regex.Matcher matcher = pattern.matcher(plate);
        
        if (matcher.matches()) {
            String province = matcher.group(1);
            String series = matcher.group(2);
            String number = matcher.group(3);
            
            if (number.length() == 5) {
                number = number.substring(0, 3) + "." + number.substring(3);
            }
            
            return province + "-" + series + " " + number;
        }
        
        return plate;
    }
}
