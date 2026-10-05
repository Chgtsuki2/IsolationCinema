package vn.cinema.controller;
import com.fasterxml.jackson.databind.JsonNode;import org.springframework.web.bind.annotation.*;import jakarta.validation.Valid;import jakarta.validation.constraints.*;import vn.cinema.service.PaymentService;import vn.cinema.security.Actor;import vn.cinema.dto.Api;
@RestController @RequestMapping("/api/payments")public class PaymentController{private final PaymentService s;public PaymentController(PaymentService s){this.s=s;}public record Create(@NotNull Long bookingId,@Pattern(regexp="PAYOS|QR_CODE")String paymentMethod){}
 @PostMapping public Object create(@Valid @RequestBody Create r){return Api.ok(s.create(r.bookingId(),Actor.id(),Actor.admin()));}@GetMapping public Object list(){Actor.requireAdmin();return Api.ok(s.list());}
 @GetMapping("/{id}")public Object get(@PathVariable long id){return Api.ok(s.get(id,Actor.id(),Actor.admin()));}@GetMapping("/booking/{id}")public Object byBooking(@PathVariable long id){return Api.ok(s.byBooking(id,Actor.id(),Actor.admin()));}
 @PostMapping("/{id}/confirm")public Object confirm(@PathVariable long id){Actor.requireAdmin();return Api.ok(s.confirmByAdmin(id));}@PostMapping("/{id}/cancel")public Object cancel(@PathVariable long id){return Api.ok(s.cancel(id,Actor.id(),Actor.admin()));}@PostMapping("/{id}/fail")public Object fail(@PathVariable long id){Actor.requireAdmin();return Api.ok(s.fail(id));}
 @PostMapping("/payos/webhook")public Object webhook(@RequestBody JsonNode body){s.webhook(body);return java.util.Map.of("success",true);}
}
