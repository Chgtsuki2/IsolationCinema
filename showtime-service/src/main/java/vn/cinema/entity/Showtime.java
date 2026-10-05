package vn.cinema.entity;
import jakarta.persistence.*;import java.time.*;import java.math.BigDecimal;import java.util.*;
@Entity   public class Showtime extends BaseEntity{public Long movieId;public Long cinemaId;public Long roomId;public LocalDate showDate;public LocalTime startTime;public LocalTime endTime;public LocalDateTime startAt;public LocalDateTime endAt;@Column(precision=14,scale=0) public BigDecimal basePrice;public String status;public boolean bookingOpened;}
