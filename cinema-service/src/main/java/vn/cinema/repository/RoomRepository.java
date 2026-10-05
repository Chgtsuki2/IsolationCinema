package vn.cinema.repository;
import vn.cinema.entity.Room;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import jakarta.persistence.LockModeType;import java.util.*;
public interface RoomRepository extends JpaRepository<Room,Long>{List<Room> findByCinemaId(Long id);}