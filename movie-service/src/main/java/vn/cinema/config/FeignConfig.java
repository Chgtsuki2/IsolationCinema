package vn.cinema.config;
import org.springframework.context.annotation.*;import org.springframework.beans.factory.annotation.Value;import feign.RequestInterceptor;
@Configuration public class FeignConfig{@Bean RequestInterceptor internal(@Value("${app.internal-key}")String key){return template->template.header("X-Internal-Key",key);}}