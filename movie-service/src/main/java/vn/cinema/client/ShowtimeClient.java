package vn.cinema.client;
import org.springframework.cloud.openfeign.FeignClient;import org.springframework.web.bind.annotation.*;
@FeignClient(name="showtime-service",url="http://localhost:8084") public interface ShowtimeClient{@GetMapping("/internal/showtimes/movie/{id}/exists") boolean movieUsed(@PathVariable long id);}