package vn.cinema.controller;
import org.springframework.web.bind.annotation.*;import jakarta.validation.Valid;import vn.cinema.service.AuthService;import vn.cinema.dto.*;import vn.cinema.dto.AuthRequests.*;import vn.cinema.security.Actor;
@RestController public class AuthController{private final AuthService service;public AuthController(AuthService service){this.service=service;}
 @PostMapping("/api/auth/register") @ResponseStatus(org.springframework.http.HttpStatus.CREATED) public Object register(@Valid @RequestBody Register r){return Api.ok(service.register(r));}
 @PostMapping("/api/auth/login") public Object login(@Valid @RequestBody Login r){return Api.ok(service.login(r));}
 @GetMapping("/api/auth/me") public Object me(){return Api.ok(service.get(Actor.id()));}
 @PutMapping("/api/auth/profile") public Object profile(@Valid @RequestBody Profile r){return Api.ok(service.profile(Actor.id(),r));}
 @PutMapping("/api/auth/change-password") public Object password(@Valid @RequestBody Password r){service.password(Actor.id(),r);return Api.ok("Đã đổi mật khẩu");}
 @GetMapping("/api/auth/users") public Object users(){return Api.ok(service.list());}
 @GetMapping("/api/auth/users/{id}") public Object user(@PathVariable long id){return Api.ok(service.get(id));}
 @PutMapping("/api/auth/users/{id}/status") public Object status(@PathVariable long id,@Valid @RequestBody Status r){return Api.ok(service.status(id,r.status()));}
 @GetMapping("/internal/users/{id}") public Object internal(@PathVariable long id){return service.get(id);}
}