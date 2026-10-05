package vn.cinema.entity;
import jakarta.persistence.*;import java.time.*;import java.math.BigDecimal;import java.util.*;
@Entity   public class BookingSeat extends BaseEntity{@Column(name="booking_id",insertable=false,updatable=false)public Long bookingId;public Long showtimeId;public Long seatId;public String seatName;public String seatType;public BigDecimal unitPrice;}