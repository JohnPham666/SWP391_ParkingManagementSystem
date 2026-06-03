package com.parking.management.security;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    // TODO: Inject UserRepository to load user from database
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Basic placeholder implementation. Needs to be wired with UserRepository in actual app.
        if ("admin".equals(username)) {
            return new User("admin", "password", new ArrayList<org.springframework.security.core.GrantedAuthority>());
        }
        throw new UsernameNotFoundException("User not found with username: " + username);
    }
}
