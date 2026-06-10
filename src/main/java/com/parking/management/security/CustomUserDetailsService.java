package com.parking.management.security;

import com.parking.management.module.user.User;
import com.parking.management.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String phoneNumber) throws UsernameNotFoundException {
        // Tìm user trong DB theo phoneNumber
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with phone number: " + phoneNumber));

        // Chuyển User entity thành Spring Security UserDetails
        return new org.springframework.security.core.userdetails.User(
                user.getPhoneNumber(),
                user.getPasswordHash(),
                Collections.singletonList(
                    new SimpleGrantedAuthority("ROLE_" + user.getRole().getRoleName())
                )
        );
    }
}
