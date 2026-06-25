package com.parking.management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class UploadWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@org.springframework.lang.NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/vehicles/**")
                .addResourceLocations("file:uploads/vehicles/");
        registry.addResourceHandler("/uploads/sessions/**")
                .addResourceLocations("file:uploads/sessions/");
    }
}