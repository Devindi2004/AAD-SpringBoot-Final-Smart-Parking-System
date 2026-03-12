package org.example.backend.repository;

import org.example.backend.entity.ParkingLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParkingLocationRepository extends JpaRepository<ParkingLocation, Long> {

    List<ParkingLocation> findByOwnerId(Long ownerId);

}