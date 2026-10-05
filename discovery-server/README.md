# Discovery Server — Phase 1

Eureka Server chạy độc lập tại `http://localhost:8761`, chỉ lắng nghe loopback cho đồ án local. Service không dùng database, không tự đăng ký và không fetch registry của chính nó. Giữ cơ chế self-preservation mặc định của Eureka.

## Phiên bản cố định

- Java 17
- Spring Boot 3.5.11
- Spring Cloud 2025.0.1
- JUnit 5 qua Spring Boot dependency management

Spring Cloud 2025.0.x tương thích với Spring Boot 3.5.x: https://github.com/spring-cloud/spring-cloud-release/wiki/Supported-Versions

## Build và chạy

Trong thư mục này, dùng JDK 17 và Maven 3.6.3 trở lên:

```powershell
mvn clean test
mvn clean package
java -jar target/discovery-server-1.0.0.jar
```

Kiểm tra `http://localhost:8761/actuator/health` trả `UP`; dashboard ở `/`; registry ở `/eureka/apps`.

## File nguồn

- `pom.xml`: dependencies và executable jar.
- `src/main/java/vn/cinema/discovery/DiscoveryApplication.java`: khởi động Eureka.
- `src/main/resources/application.yml`: cổng, địa chỉ local, registry và health.
- `src/test/java/vn/cinema/discovery/DiscoveryApplicationTest.java`: health, đọc registry, đăng ký service, heartbeat, hủy đăng ký.

Các bài test khởi động HTTP server thật ở cổng ngẫu nhiên. Không cần MySQL và không phụ thuộc server đang chạy ở cổng 8761.
