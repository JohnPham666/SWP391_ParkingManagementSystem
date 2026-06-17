package com.parking.management;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class HashGenTest {
    @Test
    public void genHashes() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("HASH_ADMIN: " + encoder.encode("admin123"));
        System.out.println("HASH_STAFF: " + encoder.encode("staff123"));
    }
}
