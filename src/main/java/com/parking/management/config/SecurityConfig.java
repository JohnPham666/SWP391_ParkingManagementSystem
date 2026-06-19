package com.parking.management.config;

import com.parking.management.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors(org.springframework.security.config.Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/api-docs",
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**",
                                "/api/payments/vnpay-return", //return to swagger page after payment
                                // Static frontend files
                                "/",
                                "/index.html",
                                "/*.html",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/assets/**",
                                "/parking_management_split/**"
                        ).permitAll()

                        // Driver, Staff, Manager, Admin đều được tạo/báo incident
                        .requestMatchers(HttpMethod.POST, "/api/incidents")
                        .authenticated()

                        // Chỉ Manager, Admin được xem/sửa/xóa incident
                        .requestMatchers(HttpMethod.GET, "/api/incidents/**")
                        .hasAnyRole("Admin", "ParkingManager", "ParkingStaff", "Driver")

                        .requestMatchers(HttpMethod.PUT, "/api/incidents/**")
                        .hasAnyRole("Admin", "ParkingManager")

                        .requestMatchers(HttpMethod.DELETE, "/api/incidents/**")
                        .hasAnyRole("Admin", "ParkingManager")

                        // Reports chỉ Admin và Manager xem
                        .requestMatchers("/api/reports/**")
                        .hasAnyRole("Admin", "ParkingManager")

                        .anyRequest().authenticated()
                )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
