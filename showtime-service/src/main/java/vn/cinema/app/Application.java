package vn.cinema.app;
import org.springframework.boot.*;import org.springframework.boot.autoconfigure.*;import org.springframework.cloud.openfeign.EnableFeignClients;import org.springframework.scheduling.annotation.EnableScheduling;
@SpringBootApplication(scanBasePackages="vn.cinema") @EnableFeignClients(basePackages="vn.cinema.client") @EnableScheduling @org.springframework.boot.autoconfigure.domain.EntityScan("vn.cinema.entity") @org.springframework.data.jpa.repository.config.EnableJpaRepositories("vn.cinema.repository")
public class Application {public static void main(String[] args){SpringApplication.run(Application.class,args);}}
