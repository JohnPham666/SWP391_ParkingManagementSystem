package com.parking.management.module.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemConfigService {

    private final SystemConfigRepository repository;
    private final Map<String, SystemConfig> cache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        log.info("Initializing System Config Cache...");
        List<SystemConfig> configs = repository.findAll();
        for (SystemConfig config : configs) {
            cache.put(config.getConfigKey(), config);
        }
        log.info("Loaded {} configurations into cache.", cache.size());
    }

    public List<SystemConfig> getAllConfigs() {
        return List.copyOf(cache.values());
    }

    public String getConfigValue(String key) {
        SystemConfig config = cache.get(key);
        return config != null ? config.getConfigValue() : null;
    }

    public String getConfigValue(String key, String defaultValue) {
        String value = getConfigValue(key);
        return value != null ? value : defaultValue;
    }

    public int getInt(String key, int defaultValue) {
        String value = getConfigValue(key);
        if (value == null) return defaultValue;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public boolean getBoolean(String key, boolean defaultValue) {
        String value = getConfigValue(key);
        if (value == null) return defaultValue;
        return Boolean.parseBoolean(value.trim());
    }

    public SystemConfig updateConfig(String key, String value) {
        SystemConfig config = repository.findById(key)
                .orElseThrow(() -> new IllegalArgumentException("Configuration key not found: " + key));
        
        // Validate that specific keys must be positive integers
        List<String> positiveIntegerKeys = List.of(
                "MAX_ADVANCE_RESERVATION_DAYS",
                "MAX_VEHICLES_PER_USER",
                "MAX_RESERVATION_HOURS",
                "EARLY_CHECKIN_BUFFER_MINUTES",
                "LATE_CHECKOUT_GRACE_MINUTES",
                "PAYMENT_TIMEOUT_MINUTES"
        );

        if (positiveIntegerKeys.contains(key)) {
            try {
                int intValue = Integer.parseInt(value.trim());
                if (intValue <= 0) {
                    throw new IllegalArgumentException(key + " phải là một số nguyên dương (> 0).");
                }
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException(key + " phải là một số nguyên hợp lệ.");
            }
        }

        config.setConfigValue(value.trim());
        SystemConfig updated = repository.save(config);
        
        // Update cache
        cache.put(key, updated);
        log.info("Configuration updated: {} = {}", key, value);
        
        return updated;
    }
}
