package vn.cinema.repository;
import vn.cinema.entity.Cinema;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import jakarta.persistence.LockModeType;import java.util.*;
public interface CinemaRepository extends JpaRepository<Cinema,Long>{}