package vn.cinema.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.cinema.client.BookingClient;
import vn.cinema.entity.Payment;
import vn.cinema.exception.Problem;
import vn.cinema.repository.PaymentRepository;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
public class PaymentService {
 private final PaymentRepository payments;private final BookingClient bookings;private final JdbcTemplate db;private final PayOSClient payos;
 public PaymentService(PaymentRepository payments,BookingClient bookings,JdbcTemplate db,PayOSClient payos){this.payments=payments;this.bookings=bookings;this.db=db;this.payos=payos;}
 private void owner(Payment p,long user,boolean admin){if(!admin&&!p.userId.equals(user))throw new Problem(403,"Bạn không có quyền xem thanh toán này");}

 @Transactional public Payment create(long bookingId,long user,boolean admin){
  db.update("INSERT IGNORE INTO payment_guard(id) VALUES (?)",bookingId);db.queryForObject("SELECT id FROM payment_guard WHERE id=? FOR UPDATE",Long.class,bookingId);
  JsonNode booking=bookings.get(bookingId);if(!admin&&booking.path("userId").asLong()!=user)throw new Problem(403,"Bạn không có quyền xem vé này");
  Payment payment=payments.findByBookingId(bookingId).orElse(null);
  if(payment==null){if(!booking.path("status").asText().equals("PENDING"))throw new Problem(409,"Vé không còn chờ thanh toán");payment=new Payment();payment.bookingId=bookingId;payment.userId=booking.path("userId").asLong();payment.amount=booking.path("totalAmount").decimalValue();payment.paymentMethod="PAYOS";payment.transactionCode="PAYOS-"+bookingId;payment.status="PENDING";payment.provider="PAYOS";payment=payments.saveAndFlush(payment);payment.providerOrderCode=nextOrderCode(payment);}
  normalize(payment);sync(payment,booking);if(payment.status.equals("PENDING")&&payment.providerPaymentLinkId==null)createPayOSLink(payment,booking);return payment;
 }

 @Transactional public Payment get(long id,long user,boolean admin){Payment p=payments.lock(id).orElseThrow(Problem::missing);owner(p,user,admin);refresh(p);return p;}
 @Transactional public Payment byBooking(long bookingId,long user,boolean admin){Payment p=payments.findByBookingId(bookingId).orElseThrow(Problem::missing);return get(p.id,user,admin);}

 @Transactional public Payment confirmByAdmin(long id){Payment p=payments.lock(id).orElseThrow(Problem::missing);JsonNode booking=bookings.get(p.bookingId);sync(p,booking);if(p.status.equals("SUCCESS"))return p;if(!p.status.equals("PENDING"))throw new Problem(409,"Thanh toán không còn hiệu lực");p.providerStatus="MANUAL_ADMIN_CONFIRM";sync(p,bookings.confirm(p.bookingId));return p;}
 @Transactional public Payment cancel(long id,long user,boolean admin){Payment p=payments.lock(id).orElseThrow(Problem::missing);owner(p,user,admin);sync(p,bookings.get(p.bookingId));if(p.status.equals("SUCCESS"))throw new Problem(409,"Không thể hủy thanh toán đã thành công");if(p.status.equals("PENDING")){if(p.providerOrderCode!=null&&p.providerPaymentLinkId!=null)payos.cancel(p.providerOrderCode);sync(p,bookings.cancel(p.bookingId));}return p;}
 @Transactional public Payment fail(long id){return cancel(id,0,true);}

 @Transactional public void webhook(JsonNode body){JsonNode data=payos.verifyWebhook(body);if(!body.path("success").asBoolean()||!"00".equals(data.path("code").asText()))return;long orderCode=data.path("orderCode").asLong();Payment found=payments.findByProviderOrderCode(orderCode).orElse(null);if(found==null)return;Payment p=payments.lock(found.id).orElseThrow(Problem::missing);if(p.status.equals("SUCCESS"))return;validatePaidData(p,data.path("amount").decimalValue(),data.path("paymentLinkId").asText());p.providerReference=data.path("reference").asText();p.providerStatus="PAID";finishPaid(p);}

 private void refresh(Payment p){normalize(p);JsonNode booking=bookings.get(p.bookingId);sync(p,booking);if(!p.status.equals("PENDING"))return;if(p.providerPaymentLinkId==null){createPayOSLink(p,booking);return;}Instant now=Instant.now();if(p.providerCheckedAt!=null&&p.providerCheckedAt.isAfter(now.minusSeconds(3)))return;p.providerCheckedAt=now;PayOSClient.Link link;try{link=payos.get(p.providerOrderCode);}catch(Problem e){if(!missingRemote(e))throw e;resetPayOSLink(p);createPayOSLink(p,booking);return;}apply(p,link);if("PAID".equals(link.status())){validatePaidData(p,BigDecimal.valueOf(link.amountPaid()),link.paymentLinkId());finishPaid(p);}else if("CANCELLED".equals(link.status()))sync(p,bookings.cancel(p.bookingId));}
 private void finishPaid(Payment p){JsonNode confirmed=bookings.confirm(p.bookingId);sync(p,confirmed);if(!p.status.equals("SUCCESS"))p.providerStatus="PAID_AFTER_BOOKING_CLOSED";}
 private void validatePaidData(Payment p,BigDecimal received,String paymentLinkId){if(received.compareTo(p.amount)!=0)throw new Problem(409,"Số tiền payOS không khớp với đơn hàng");if(p.providerPaymentLinkId!=null&&!p.providerPaymentLinkId.equals(paymentLinkId))throw new Problem(409,"Mã link payOS không khớp với đơn hàng");}
 private void createPayOSLink(Payment p,JsonNode booking){if(!payos.configured())throw new Problem(503,"Chưa cấu hình tài khoản payOS trong Payment Service");String description="VE "+booking.path("bookingCode").asText();long expiry=Instant.parse(booking.path("expiredAt").asText()).getEpochSecond();PayOSClient.Link link;try{link=payos.create(p.providerOrderCode,p.bookingId,p.amount.longValueExact(),description,expiry);}catch(Problem createError){try{link=payos.get(p.providerOrderCode);}catch(Problem ignored){throw createError;}}apply(p,link);}
 private void apply(Payment p,PayOSClient.Link link){p.provider="PAYOS";p.providerOrderCode=link.orderCode();if(!blank(link.paymentLinkId()))p.providerPaymentLinkId=link.paymentLinkId();if(!blank(link.status()))p.providerStatus=link.status();if(!blank(link.checkoutUrl()))p.checkoutUrl=link.checkoutUrl();if(!blank(link.qrCode()))p.qrContent=link.qrCode();if(!blank(link.accountNumber()))p.accountNumber=link.accountNumber();if(!blank(link.accountName()))p.accountName=link.accountName();}
 private void normalize(Payment p){if(p.provider==null)p.provider="PAYOS";if(p.providerOrderCode==null||(p.providerPaymentLinkId==null&&(Objects.equals(p.providerOrderCode,p.bookingId)||p.providerOrderCode>9_007_199_254_740_991L)))p.providerOrderCode=nextOrderCode(p);if(p.status.equals("PENDING"))p.paymentMethod="PAYOS";}
 private long nextOrderCode(Payment p){return System.currentTimeMillis()*1_000L+Math.floorMod(p.id,1_000L);}
 private boolean missingRemote(Problem e){String message=Objects.toString(e.getMessage(),"").toLowerCase(Locale.ROOT);return e.status.value()==404||message.contains("không tồn tại")||message.contains("khong ton tai")||message.contains("does not exist")||message.contains("not found");}
 private void resetPayOSLink(Payment p){p.providerOrderCode=nextOrderCode(p);p.providerPaymentLinkId=null;p.providerReference=null;p.providerStatus=null;p.checkoutUrl=null;p.qrContent=null;p.accountNumber=null;p.accountName=null;p.providerCheckedAt=null;}
 private boolean blank(String s){return s==null||s.isBlank();}
 private void sync(Payment p,JsonNode booking){String state=booking.path("status").asText();if(state.equals("CONFIRMED")){p.status="SUCCESS";if(p.paidAt==null)p.paidAt=booking.path("confirmedAt").isTextual()?Instant.parse(booking.path("confirmedAt").asText()):Instant.now();}else if(state.equals("EXPIRED")||state.equals("CANCELLED"))p.status="FAILED";}

 public List<Payment> list(){return payments.findAll();}public List<Long> pending(){return payments.findByStatus("PENDING").stream().map(p->p.id).toList();}
 @Transactional public void reconcile(long id){Payment p=payments.lock(id).orElseThrow(Problem::missing);refresh(p);}
}
