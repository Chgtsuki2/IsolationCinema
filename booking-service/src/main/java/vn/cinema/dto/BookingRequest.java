package vn.cinema.dto;
import jakarta.validation.constraints.*;import java.util.List;public record BookingRequest(@NotNull Long showtimeId,@NotEmpty @Size(max=10)List<@NotNull Long> seatIds){}