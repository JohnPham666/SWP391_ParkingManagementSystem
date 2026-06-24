package com.parking.management.module.session;

import com.parking.management.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ParkingCardService {
    private final ParkingCardRepository repository;

    @Transactional
    public ParkingCardResponse createCard(ParkingCardRequest request) {
        if (repository.existsById(request.getCardId())) {
            throw new IllegalArgumentException("Card ID already exists");
        }

        ParkingCard card = new ParkingCard();
        card.setCardId(request.getCardId());
        card.setStatus(request.getStatus() != null ? request.getStatus() : "ACTIVE");
        card.setCreatedAt(LocalDateTime.now());

        ParkingCard savedCard = repository.save(card);
        return mapEntityToResponse(savedCard);
    }

    public ParkingCardResponse getCardById(String cardId) {
        ParkingCard card = repository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));
        return mapEntityToResponse(card);
    }

    public List<ParkingCardResponse> getAllCards() {
        return repository.findAll().stream()
                .map(this::mapEntityToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ParkingCardResponse updateCardStatus(String cardId, String status) {
        ParkingCard card = repository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));
        card.setStatus(status);
        ParkingCard savedCard = repository.save(card);
        return mapEntityToResponse(savedCard);
    }

    @Transactional
    public void deleteCard(String cardId) {
        if (!repository.existsById(cardId)) {
            throw new ResourceNotFoundException("Card not found");
        }
        repository.deleteById(cardId);
    }

    private ParkingCardResponse mapEntityToResponse(ParkingCard card) {
        ParkingCardResponse response = new ParkingCardResponse();
        response.setCardId(card.getCardId());
        response.setStatus(card.getStatus());
        response.setIssuedAt(card.getCreatedAt());
        return response;
    }
}
