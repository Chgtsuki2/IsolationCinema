package vn.cinema;
import com.fasterxml.jackson.databind.ObjectMapper;import org.junit.jupiter.api.Test;import vn.cinema.service.PayOSClient;import vn.cinema.exception.Problem;import static org.assertj.core.api.Assertions.*;
class PayOSClientTest{
 @Test void verifiesOfficialPayOSWebhookSignature()throws Exception{String key="1a54716c8f0efb2744fb28b6e38b25da7f67a925d98bc1c18bd8faaecadd7675";var client=new PayOSClient(new ObjectMapper(),"client","api",key,"http://127.0.0.1:5173");String json="""
 {"code":"00","desc":"success","success":true,"data":{"orderCode":123,"amount":3000,"description":"VQRIO123","accountNumber":"12345678","reference":"TF230204212323","transactionDateTime":"2023-02-04 18:25:00","currency":"VND","paymentLinkId":"124c33293c43417ab7879e14c8d9eb18","code":"00","desc":"Thành công","counterAccountBankId":"","counterAccountBankName":"","counterAccountName":"","counterAccountNumber":"","virtualAccountName":"","virtualAccountNumber":""},"signature":"412e915d2871504ed31be63c8f62a149a4410d34c4c42affc9006ef9917eaa03"}
 """;var body=new ObjectMapper().readTree(json);assertThat(client.verifyWebhook(body).path("orderCode").asLong()).isEqualTo(123);((com.fasterxml.jackson.databind.node.ObjectNode)body.path("data")).put("amount",3001);assertThatThrownBy(()->client.verifyWebhook(body)).isInstanceOf(Problem.class);}
}
