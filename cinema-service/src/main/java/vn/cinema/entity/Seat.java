package vn.cinema.entity;
import jakarta.persistence.*;import java.time.*;import java.math.BigDecimal;import java.util.*;
@Entity @Table(uniqueConstraints=@UniqueConstraint(columnNames={"room_id","row_name","seat_number"}))  public class Seat extends BaseEntity{public Long roomId;public String rowName;public int seatNumber;public String seatType;public String status;}
