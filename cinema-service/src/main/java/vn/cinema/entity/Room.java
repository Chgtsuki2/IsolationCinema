package vn.cinema.entity;
import jakarta.persistence.*;import java.time.*;import java.math.BigDecimal;import java.util.*;
@Entity   public class Room extends BaseEntity{public Long cinemaId;public String name;public int totalSeats;public String roomType;public String status;}