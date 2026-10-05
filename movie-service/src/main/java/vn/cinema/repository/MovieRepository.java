package vn.cinema.repository;
import vn.cinema.entity.Movie;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import jakarta.persistence.LockModeType;import java.util.*;
public interface MovieRepository extends JpaRepository<Movie,Long>{boolean existsByCategoriesId(Long id);}