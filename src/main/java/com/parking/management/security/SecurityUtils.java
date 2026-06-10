package com.parking.management.security;

import com.parking.management.module.user.User;
import com.parking.management.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    public void checkDataOwnership(Integer dataUserId) {
        if (dataUserId == null) return; // If data doesn't belong to any user (rare), ignore or fail depending on business logic. We'll ignore.
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new AccessDeniedException("Access denied: Not authenticated");
        }

        boolean isAdminOrManagerOrStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin") || 
                               a.getAuthority().equals("ROLE_ParkingManager") || 
                               a.getAuthority().equals("ROLE_ParkingStaff"));
        
        if (isAdminOrManagerOrStaff) {
            return; // Staff/Admin can access everything
        }

        // It's a Driver, check ID
        String phoneNumber = authentication.getName();
        User currentUser = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new AccessDeniedException("Access denied: User not found"));

        if (!currentUser.getUserId().equals(dataUserId)) {
            throw new AccessDeniedException("Access denied: You do not have permission to access or modify this data");
        }
    }

    public Integer getDriverUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return null;
        }

        boolean isAdminOrManagerOrStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin") || 
                               a.getAuthority().equals("ROLE_ParkingManager") || 
                               a.getAuthority().equals("ROLE_ParkingStaff"));
        
        if (isAdminOrManagerOrStaff) {
            return null; // Staff/Admin have no restriction
        }

        String phoneNumber = authentication.getName();
        return userRepository.findByPhoneNumber(phoneNumber).map(User::getUserId).orElse(null);
    }
}
