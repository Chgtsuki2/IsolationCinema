package vn.cinema.service;

import com.fasterxml.jackson.databind.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import vn.cinema.exception.Problem;
import vn.payos.PayOS;
import vn.payos.exception.*;
import vn.payos.model.v2.paymentRequests.*;

@Component
public class PayOSClient {
 private final ObjectMapper mapper;private final PayOS payos;private final String clientId;private final String apiKey;private final String checksumKey;private final String frontendUrl;
 public PayOSClient(ObjectMapper mapper,@Value("${app.payos.client-id:}")String clientId,@Value("${app.payos.api-key:}")String apiKey,@Value("${app.payos.checksum-key:}")String checksumKey,@Value("${app.payos.frontend-url:http://127.0.0.1:5173}")String frontendUrl){this.mapper=mapper;this.clientId=clientId.trim();this.apiKey=apiKey.trim();this.checksumKey=checksumKey.trim();this.frontendUrl=frontendUrl.trim().replaceAll("/$","");this.payos=new PayOS(this.clientId,this.apiKey,this.checksumKey);}
 public record Link(long orderCode,String paymentLinkId,String status,String checkoutUrl,String qrCode,String accountNumber,String accountName,long amountPaid){}
 public boolean configured(){return !clientId.isBlank()&&!apiKey.isBlank()&&!checksumKey.isBlank();}
 public Link create(long orderCode,long bookingId,long amount,String description,long expiredAt){required();String returnUrl=frontendUrl+"/payment/"+bookingId+"?payos=success";String cancelUrl=frontendUrl+"/payment/"+bookingId+"?payos=cancel";try{CreatePaymentLinkRequest request=CreatePaymentLinkRequest.builder().orderCode(orderCode).amount(amount).description(description).cancelUrl(cancelUrl).returnUrl(returnUrl).expiredAt(expiredAt).build();CreatePaymentLinkResponse response=payos.paymentRequests().create(request);return new Link(response.getOrderCode(),response.getPaymentLinkId(),value(response.getStatus()),response.getCheckoutUrl(),response.getQrCode(),response.getAccountNumber(),response.getAccountName(),0);}catch(PayOSException e){throw problem(e);}}
 public Link get(long orderCode){required();try{PaymentLink response=payos.paymentRequests().get(orderCode);return new Link(response.getOrderCode(),response.getId(),value(response.getStatus()),null,null,null,null,response.getAmountPaid()==null?0:response.getAmountPaid());}catch(PayOSException e){throw problem(e);}}
 public void cancel(long orderCode){required();try{payos.paymentRequests().cancel(orderCode,"Khach hang huy dat ve");}catch(PayOSException e){throw problem(e);}}
 public JsonNode verifyWebhook(JsonNode body){required();try{return mapper.valueToTree(payos.webhooks().verify(mapper.convertValue(body,vn.payos.model.webhooks.Webhook.class)));}catch(PayOSException|IllegalArgumentException e){throw new Problem(400,"Chữ ký webhook payOS không hợp lệ");}}
 private String value(PaymentLinkStatus status){return status==null?null:status.getValue();}
 private Problem problem(PayOSException error){if(error instanceof NotFoundException)return new Problem(404,"Không tìm thấy giao dịch payOS");if(error instanceof APIException api){String detail=api.getErrorDesc().filter(x->!x.isBlank()).orElse(api.getMessage());return new Problem(502,"payOS từ chối: "+detail);}if(error instanceof InvalidSignatureException)return new Problem(502,"Chữ ký phản hồi payOS không hợp lệ");return new Problem(502,"Không kết nối được payOS");}
 private void required(){if(!configured())throw new Problem(503,"Chưa cấu hình PAYOS_CLIENT_ID, PAYOS_API_KEY và PAYOS_CHECKSUM_KEY");}
}
