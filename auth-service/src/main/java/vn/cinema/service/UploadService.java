package vn.cinema.service;
import org.springframework.stereotype.Service;import org.springframework.beans.factory.annotation.Value;import org.springframework.web.multipart.MultipartFile;import java.nio.file.*;import java.util.*;import vn.cinema.exception.Problem;
@Service public class UploadService{private final Path root;public UploadService(@Value("${app.upload-dir}")String root){this.root=Path.of(root).toAbsolutePath().normalize();}
 public String store(MultipartFile file,String type)throws java.io.IOException{
  if(file.isEmpty()||file.getSize()>5*1024*1024)throw new Problem(400,"Ảnh phải có dung lượng từ 1 byte đến 5MB");
  String folder=switch(type){case "MOVIE_POSTER"->"movies/posters";case "MOVIE_BANNER"->"movies/banners";case "CINEMA"->"cinemas";case "AVATAR"->"avatars";default->throw new Problem(400,"Loại ảnh không hợp lệ");};if(!type.equals("AVATAR"))vn.cinema.security.Actor.requireAdmin();
  byte[] b=file.getBytes();String ext;if(b.length>=12&&b[0]==(byte)0x89&&b[1]==0x50&&b[2]==0x4e&&b[3]==0x47)ext="png";else if(b.length>=3&&b[0]==(byte)0xff&&b[1]==(byte)0xd8&&b[2]==(byte)0xff)ext="jpg";else if(b.length>=12&&new String(b,0,4,java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")&&new String(b,8,4,java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP"))ext="webp";else throw new Problem(400,"Chỉ chấp nhận JPG, PNG, WEBP");
  String filename=UUID.randomUUID()+"."+ext;Path dir=root.resolve(folder);Files.createDirectories(dir);Files.write(dir.resolve(filename),b,StandardOpenOption.CREATE_NEW);return "/uploads/"+folder+"/"+filename;
 }
}