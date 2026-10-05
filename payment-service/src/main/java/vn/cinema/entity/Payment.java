package vn.cinema.entity;
import jakarta.persistence.*;import java.time.*;import java.math.BigDecimal;
@Entity public class Payment extends BaseEntity{
 @Column(unique=true,nullable=false)public Long bookingId;
 public Long userId;public BigDecimal amount;public String paymentMethod;
 @Column(unique=true)public String transactionCode;
 @Column(length=2048)public String qrContent;
 public String status;public Instant paidAt;
 public String provider;@Column(unique=true)public Long providerOrderCode;
 @Column(unique=true)public String providerPaymentLinkId;
 @Column(unique=true)public String providerReference;
 @Column(length=1000)public String checkoutUrl;
 public String providerStatus;public String accountNumber;public String accountName;
 public Instant providerCheckedAt;
}
