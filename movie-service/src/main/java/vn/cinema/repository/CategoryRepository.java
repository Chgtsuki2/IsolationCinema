package vn.cinema.repository;
import vn.cinema.entity.Category;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import jakarta.persistence.LockModeType;import java.util.*;
public interface CategoryRepository extends JpaRepository<Category,Long>{}