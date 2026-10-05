package vn.cinema.exception;
import org.springframework.http.HttpStatus;
public class Problem extends RuntimeException{public final HttpStatus status;public Problem(int status,String message){super(message);this.status=HttpStatus.valueOf(status);}public static Problem missing(){return new Problem(404,"Không tìm thấy dữ liệu");}}