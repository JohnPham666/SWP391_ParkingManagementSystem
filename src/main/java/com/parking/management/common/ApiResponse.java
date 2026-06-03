package com.parking.management.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    public static <U> ApiResponse<U> success(String message, U data) {
        return new ApiResponse<U>(true, message, data);
    }

    public static <U> ApiResponse<U> error(String message) {
        return new ApiResponse<U>(false, message, null);
    }
}
