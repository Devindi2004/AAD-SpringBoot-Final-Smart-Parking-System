package org.example.backend.repository;

import org.example.backend.entity.ParkingSlot;
import org.example.backend.enums.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {

    List<ParkingSlot> findByLocationId(Long locationId);

    List<ParkingSlot> findByLocation_OwnerId(Long ownerId);

    long countByLocationId(Long locationId);

    long countByLocationIdAndStatus(Long locationId, SlotStatus status);

}