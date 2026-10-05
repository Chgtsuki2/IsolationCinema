package vn.cinema.entity;
import jakarta.persistence.*;import java.time.*;import java.math.BigDecimal;import java.util.*;
@Entity   public class Category extends BaseEntity{@Column(unique=true,nullable=false) public String name;@Column(length=2000) public String description;}