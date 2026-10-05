package vn.cinema.repository;
import vn.cinema.entity.Seat;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import jakarta.persistence.LockModeType;import java.util.*;
public interface SeatRepository extends JpaRepository<Seat,Long>{List<Seat> findByRoomIdOrderByRowNameAscSeatNumberAsc(Long id);}