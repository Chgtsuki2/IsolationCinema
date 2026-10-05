package vn.cinema.entity;
import jakarta.persistence.*;import java.time.Instant;
@MappedSuperclass public abstract class BaseEntity{@Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;public Instant createdAt;public Instant updatedAt;@PrePersist void created(){createdAt=Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS);updatedAt=createdAt;}@PreUpdate void updated(){updatedAt=Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS);}}
