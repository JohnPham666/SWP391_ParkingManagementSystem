package com.parking.management.module.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParkingCardRepository extends JpaRepository<ParkingCard, String> {
    Optional<ParkingCard> findByCardIdAndStatus(String cardId, String status);
}
