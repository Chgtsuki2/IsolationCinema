package vn.cinema.dto;
import jakarta.validation.constraints.*;
public class CinemaRequests{
 public record CinemaInput(@NotBlank String name,@NotBlank String address,@NotBlank String province,String phone,String description,String imageUrl,@NotBlank @Pattern(regexp="ACTIVE|INACTIVE")String status){}
 public record RoomInput(@NotNull Long cinemaId,@NotBlank String name,@Min(0) @Max(300) int totalSeats,@NotBlank @Pattern(regexp="STANDARD|VIP|IMAX")String roomType,@NotBlank @Pattern(regexp="ACTIVE|INACTIVE")String status){}
 public record Generate(@Min(1) @Max(26)int rows,@Min(1) @Max(20)int columns){}
 public record SeatInput(@NotBlank @Pattern(regexp="NORMAL|VIP|COUPLE")String seatType,@NotBlank @Pattern(regexp="ACTIVE|LOCKED")String status){}
}