package com.parking.management.module.session;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ParkingCards")
public class ParkingCard {
    
    @Id
    @Column(name = "CardID", length = 50)
    private String cardId;

    @Column(name = "Status", nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, IN_USE, LOST

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt = LocalDateTime.now();
}
