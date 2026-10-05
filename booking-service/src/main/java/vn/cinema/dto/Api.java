package vn.cinema.dto;
public record Api<T>(boolean success,String message,T data){public static <T> Api<T> ok(T data){return new Api<>(true,"Thành công",data);}}