package vn.cinema.controller;
import org.springframework.web.bind.annotation.*;import jakarta.validation.Valid;import vn.cinema.service.BookingService;import vn.cinema.dto.*;import vn.cinema.security.Actor;
@RestController public class BookingController{private final BookingService s;public BookingController(BookingService s){this.s=s;}
 @PostMapping("/api/bookings") @ResponseStatus(org.springframework.http.HttpStatus.CREATED)public Object create(@Valid @RequestBody BookingRequest r){return Api.ok(s.view(s.create(Actor.id(),r)));}
 @GetMapping("/api/bookings")public Object list(){for(long id:s.expired())s.expireOne(id);return Api.ok(s.list(Actor.id(),Actor.admin()).stream().map(s::view).toList());}
 @GetMapping("/api/bookings/{id}")public Object get(@PathVariable long id){var b=s.get(id);BookingService.owner(b,Actor.id(),Actor.admin());return Api.ok(s.view(b));}
 @PutMapping("/api/bookings/{id}/cancel")public Object cancel(@PathVariable long id){return Api.ok(s.view(s.cancel(id,Actor.id(),Actor.admin())));}
 @GetMapping("/api/bookings/showtime/{id}/seats")public Object seats(@PathVariable long id){for(long bid:s.expired())s.expireOne(bid);return Api.ok(s.seatMap(id));}
 @GetMapping("/internal/bookings/{id}")public Object internal(@PathVariable long id){return s.view(s.get(id));}@PutMapping("/internal/bookings/{id}/confirm")public Object confirm(@PathVariable long id){return s.view(s.confirm(id));}@PutMapping("/internal/bookings/{id}/cancel")public Object internalCancel(@PathVariable long id){return s.view(s.cancel(id,0,true));}@GetMapping("/internal/bookings/showtime/{id}/exists")public boolean used(@PathVariable long id){return s.used(id);}
}