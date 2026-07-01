package com.parking.management.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Xử lý ngoại lệ ResourceNotFoundException.
     * Khi hệ thống không tìm thấy resource (ví dụ: User không tồn tại, Slot không
     * tồn tại),
     * phương thức này sẽ bắt lỗi và trả về HTTP Status 404 (NOT_FOUND) cùng với
     * thông báo lỗi.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Xử lý ngoại lệ IllegalArgumentException.
     * Khi có đối số truyền vào không hợp lệ hoặc sai logic (ví dụ: tham số bị thiếu
     * hoặc sai định dạng),
     * phương thức này sẽ bắt lỗi và trả về HTTP Status 400 (BAD_REQUEST).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Xử lý ngoại lệ AccessDeniedException.
     * Khi người dùng truy cập vào tài nguyên mà họ không có quyền (không đủ Role),
     * phương thức này sẽ bắt lỗi và trả về HTTP Status 403 (FORBIDDEN).
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied: " + ex.getMessage()));
    }

    /**
     * Xử lý ngoại lệ MethodArgumentNotValidException.
     * Thường xảy ra khi dữ liệu đầu vào từ RequestBody không vượt qua được các ràng
     * buộc kiểm tra (@Valid).
     * Phương thức này thu thập tất cả các lỗi validation và trả về HTTP Status 400
     * cùng với danh sách chi tiết các trường bị lỗi.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        // Duyệt qua tất cả các lỗi từ các trường dữ liệu và đưa vào map
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.errorWithData("Validation Failed", errors));
    }

    /**
     * Xử lý ngoại lệ Exception (Catch-all).
     * Bắt tất cả các lỗi chưa được định nghĩa cụ thể ở các phương thức trên để
     * tránh crash ứng dụng.
     * Phương thức này sẽ trả về HTTP Status 500 (INTERNAL_SERVER_ERROR) báo lỗi hệ
     * thống.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Internal Server Error: " + ex.getMessage()));
    }
}
