package org.example.backend.repository;

import org.example.backend.entity.Vehicle;
import org.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByDriver(User driver);

}