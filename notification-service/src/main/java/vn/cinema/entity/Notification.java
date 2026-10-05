package vn.cinema.entity;
import jakarta.persistence.*;import java.time.*;import java.math.BigDecimal;import java.util.*;
@Entity   public class Notification extends BaseEntity{@Column(unique=true,nullable=false)public Long bookingId;public Long userId;public String title;public String message;public boolean readStatus;}