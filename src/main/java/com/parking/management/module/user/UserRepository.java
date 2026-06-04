package com.parking.management.module.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    // Tìm user theo email (dùng cho Login và kiểm tra trùng)
    Optional<User> findByEmail(String email);

    // Kiểm tra email đã tồn tại chưa (dùng cho Register)
    boolean existsByEmail(String email);
}
