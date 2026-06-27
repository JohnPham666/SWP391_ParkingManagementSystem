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
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
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

        String email = authentication.getName();
        return userRepository.findByEmail(email).map(user -> user.getUserId()).orElse(null);
    }

    public Integer getBuildingId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return null;
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .filter(user -> user.getBuilding() != null)
                .map(user -> user.getBuilding().getBuildingId())
                .orElse(null);
    }
}
