package vn.cinema.repository;
import vn.cinema.entity.Payment;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import jakarta.persistence.LockModeType;import java.util.*;
public interface PaymentRepository extends JpaRepository<Payment,Long>{Optional<Payment> findByBookingId(Long id);Optional<Payment> findByProviderOrderCode(Long orderCode);@Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from Payment p where p.id=:id")Optional<Payment> lock(@Param("id")long id);List<Payment> findByStatus(String status);}
