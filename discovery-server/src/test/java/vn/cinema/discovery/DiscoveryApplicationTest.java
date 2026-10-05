package vn.cinema.discovery;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DiscoveryApplicationTest {
    @Autowired private TestRestTemplate http;

    @Test void healthEndpointReportsUp() {
        var response = http.getForEntity("/actuator/health", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("\"status\":\"UP\"");
    }

    @Test void eurekaRegistryIsAvailable() {
        var response = http.getForEntity("/eureka/apps", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("applications");
    }

    @Test void serviceCanRegisterHeartbeatAndDeregister() {
        String instanceId = "discovery-test-" + java.util.UUID.randomUUID();
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String registration = """
            {"instance":{"instanceId":"%s","hostName":"localhost",
            "app":"REGISTRY-TEST","ipAddr":"127.0.0.1","status":"UP",
            "port":{"$":18081,"@enabled":"true"},
            "dataCenterInfo":{"@class":"com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo","name":"MyOwn"}}}
            """.formatted(instanceId);
        var result = http.postForEntity("/eureka/apps/REGISTRY-TEST",
                new HttpEntity<>(registration, headers), String.class);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        String path = "/eureka/apps/REGISTRY-TEST/" + instanceId;
        try {
            var heartbeat = http.exchange(path, HttpMethod.PUT, HttpEntity.EMPTY, String.class);
            assertThat(heartbeat.getStatusCode()).isEqualTo(HttpStatus.OK);
            var instance = http.getForEntity(path, String.class);
            assertThat(instance.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(instance.getBody()).contains(instanceId);
        } finally {
            http.delete(path);
        }
        assertThat(http.getForEntity(path, String.class).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
