package vn.cinema.entity;
import jakarta.persistence.*;import java.time.*;import java.math.BigDecimal;import java.util.*;
@Entity   public class Cinema extends BaseEntity{public String name;public String address;public String province;public String phone;@Column(length=4000) public String description;@Column(length=2000) public String imageUrl;public String status;}