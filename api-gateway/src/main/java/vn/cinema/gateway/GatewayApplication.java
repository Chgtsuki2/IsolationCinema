package vn.cinema.gateway;
import org.springframework.boot.*;import org.springframework.boot.autoconfigure.*;import org.springframework.context.annotation.*;import org.springframework.cloud.gateway.route.*;import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;import org.springframework.beans.factory.annotation.Value;import org.springframework.security.config.web.server.ServerHttpSecurity;import org.springframework.security.web.server.SecurityWebFilterChain;import org.springframework.security.oauth2.jwt.*;import org.springframework.security.oauth2.jose.jws.MacAlgorithm;import javax.crypto.spec.SecretKeySpec;import java.nio.charset.StandardCharsets;
@SpringBootApplication public class GatewayApplication{
 public static void main(String[] args){SpringApplication.run(GatewayApplication.class,args);}
 @Bean RouteLocator routes(RouteLocatorBuilder b){return b.routes()
 .route("auth",r->r.path("/api/auth/**","/api/uploads/**","/uploads/**").uri("lb://auth-service"))
 .route("movie",r->r.path("/api/movies/**","/api/categories/**").uri("lb://movie-service"))
 .route("cinema",r->r.path("/api/cinemas/**","/api/rooms/**","/api/seats/**").uri("lb://cinema-service"))
 .route("showtime",r->r.path("/api/showtimes/**").uri("lb://showtime-service"))
 .route("booking",r->r.path("/api/bookings/**").uri("lb://booking-service"))
 .route("payment",r->r.path("/api/payments/**").uri("lb://payment-service"))
 .route("notification",r->r.path("/api/notifications/**").uri("lb://notification-service")).build();}
 @Bean ReactiveJwtDecoder decoder(@Value("${app.jwt-secret}")String secret){return NimbusReactiveJwtDecoder.withSecretKey(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),"HmacSHA256")).macAlgorithm(MacAlgorithm.HS256).build();}
 @Bean SecurityWebFilterChain security(ServerHttpSecurity h){return h.csrf(c->c.disable()).cors(c->{}).authorizeExchange(a->a.pathMatchers("/internal/**").denyAll().pathMatchers(org.springframework.http.HttpMethod.OPTIONS).permitAll().pathMatchers("/api/auth/register","/api/auth/login","/api/payments/payos/webhook","/uploads/**").permitAll().pathMatchers(org.springframework.http.HttpMethod.GET,"/api/movies/**","/api/categories/**","/api/cinemas/**","/api/rooms/**","/api/seats/**","/api/showtimes/**").permitAll().anyExchange().authenticated()).oauth2ResourceServer(o->o.jwt(j->{}).authenticationEntryPoint((e,x)->GatewayGuard.error(e,401,"Vui lòng đăng nhập"))).exceptionHandling(e->e.accessDeniedHandler((x,y)->GatewayGuard.error(x,403,"Không có quyền truy cập"))).build();}
 @Bean org.springframework.web.cors.reactive.CorsConfigurationSource cors(){var c=new org.springframework.web.cors.CorsConfiguration();c.setAllowedOrigins(java.util.List.of("http://localhost:5173","http://127.0.0.1:5173"));c.setAllowedMethods(java.util.List.of("GET","POST","PUT","DELETE","OPTIONS"));c.setAllowedHeaders(java.util.List.of("Authorization","Content-Type"));var s=new org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource();s.registerCorsConfiguration("/**",c);return s;}
}
