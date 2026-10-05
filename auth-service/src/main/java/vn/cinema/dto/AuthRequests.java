package vn.cinema.dto;
import jakarta.validation.constraints.*;
public class AuthRequests{
 public record Register(@NotBlank String fullName,@Email @NotBlank String email,@NotBlank @Size(min=6,max=72) String password,String phone){}
 public record Login(@Email @NotBlank String email,@NotBlank String password){}
 public record Profile(@NotBlank String fullName,String phone,String avatarUrl){}
 public record Password(@NotBlank String oldPassword,@Size(min=6,max=72) @NotBlank String newPassword){}
 public record Status(@Pattern(regexp="ACTIVE|LOCKED") @NotBlank String status){}
}