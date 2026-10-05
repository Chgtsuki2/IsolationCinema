package vn.cinema;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.fasterxml.jackson.databind.*;
import vn.cinema.app.Application;
import vn.cinema.service.*;
import vn.cinema.client.*;
import vn.cinema.repository.*;
import vn.cinema.dto.BookingRequest;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest(classes=Application.class)
class BookingTest {
 @Autowired BookingService service;
 @Autowired BookingRepository bookings;
 @Autowired SeatReservationRepository reservations;
 @Autowired ObjectMapper mapper;
 @MockitoBean ShowtimeClient showtimes;
 @MockitoBean CinemaClient cinemas;
 @MockitoBean NotificationClient notifications;
 private final long showtime=501, room=901, normal=1201, vip=1202;
 @BeforeEach void setup(){
  reservations.deleteAll();bookings.deleteAll();
  var details=mapper.createObjectNode();var show=details.putObject("showtime");show.put("id",showtime);show.put("roomId",room);show.put("status","AVAILABLE");show.put("startAt",LocalDateTime.now().plusDays(1).toString());show.put("basePrice",90000);
  details.putObject("movie").put("title","Phim kiểm thử");details.putObject("room").put("status","ACTIVE");details.putObject("cinema").put("status","ACTIVE");
  when(showtimes.details(showtime)).thenReturn(details);when(showtimes.open(showtime)).thenReturn(details);
  var a=mapper.createObjectNode();a.put("id",normal);a.put("rowName","A");a.put("seatNumber",1);a.put("seatType","NORMAL");a.put("status","ACTIVE");
  var e=mapper.createObjectNode();e.put("id",vip);e.put("rowName","E");e.put("seatNumber",1);e.put("seatType","VIP");e.put("status","ACTIVE");when(cinemas.seats(room)).thenReturn(List.of(a,e));
 }
 @Test void pricesAreStoredForEveryTicket(){var b=service.create(71,new BookingRequest(showtime,List.of(normal,vip)));assertThat(b.totalAmount).isEqualByComparingTo("210000");assertThat(b.seats.get(0).unitPrice).isEqualByComparingTo("90000");assertThat(b.seats.get(1).unitPrice).isEqualByComparingTo("120000");assertThat(service.get(b.id).seats).hasSize(2);}
 @Test void wrongRoomIsRejected(){assertThatThrownBy(()->service.create(71,new BookingRequest(showtime,List.of(999999L)))).hasMessageContaining("không thuộc phòng");assertThat(bookings.count()).isZero();}
 @Test void duplicateSeatIdsAreRejected(){assertThatThrownBy(()->service.create(71,new BookingRequest(showtime,List.of(normal,normal)))).hasMessageContaining("trùng");}
 @Test void simultaneousBookingHasOnlyOneWinner()throws Exception{var pool=Executors.newFixedThreadPool(2);var gate=new CountDownLatch(1);Callable<Boolean> request=()->{gate.await();try{service.create(Thread.currentThread().getId(),new BookingRequest(showtime,List.of(normal)));return true;}catch(org.springframework.dao.DataIntegrityViolationException e){return false;}};try{var a=pool.submit(request);var b=pool.submit(request);gate.countDown();assertThat(List.of(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS))).containsExactlyInAnyOrder(true,false);assertThat(reservations.count()).isEqualTo(1);assertThat(bookings.count()).isEqualTo(1);}finally{pool.shutdownNow();}}
 @Test void cancelReleasesSeatsButRetainsTicketPrices(){var b=service.create(71,new BookingRequest(showtime,List.of(normal)));service.cancel(b.id,71,false);assertThat(service.get(b.id).status).isEqualTo("CANCELLED");assertThat(reservations.count()).isZero();assertThat(service.get(b.id).seats).hasSize(1);assertThat(service.create(72,new BookingRequest(showtime,List.of(normal))).id).isNotEqualTo(b.id);}
 @Test void expirationReleasesSeats(){var b=service.create(71,new BookingRequest(showtime,List.of(normal)));b.expiredAt=Instant.now().minusSeconds(1);bookings.save(b);service.expireOne(b.id);assertThat(service.get(b.id).status).isEqualTo("EXPIRED");assertThat(reservations.count()).isZero();assertThat(service.confirm(b.id).status).isEqualTo("EXPIRED");}
 @Test void resumePreservesOriginalDeadlineAndPrices(){var b=service.create(71,new BookingRequest(showtime,List.of(normal)));var reopened=service.get(b.id);assertThat(reopened.expiredAt).isEqualTo(b.expiredAt);assertThat(reopened.status).isEqualTo("PENDING");assertThat(reopened.totalAmount).isEqualByComparingTo("90000");assertThat(service.list(71,false)).extracting(x->x.id).contains(b.id);}
 @Test void repeatedConfirmationIsIdempotentAndCannotBeCancelled(){var b=service.create(71,new BookingRequest(showtime,List.of(normal)));var time=service.confirm(b.id).confirmedAt;assertThat(service.confirm(b.id).confirmedAt).isEqualTo(time);assertThat(reservations.count()).isEqualTo(1);assertThatThrownBy(()->service.cancel(b.id,71,false)).hasMessageContaining("không thể");}
 @Test void anotherUserCannotCancelOrOwnTicket(){var b=service.create(71,new BookingRequest(showtime,List.of(normal)));assertThatThrownBy(()->service.cancel(b.id,72,false)).hasMessageContaining("quyền");assertThatThrownBy(()->BookingService.owner(b,72,false)).hasMessageContaining("quyền");}
}

