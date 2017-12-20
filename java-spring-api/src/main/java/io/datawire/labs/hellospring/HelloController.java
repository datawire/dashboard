package io.datawire.labs.hellospring;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {


  @GetMapping("/hello/{name}")
  public String sayHello(@PathVariable String name) {
    return String.format("Hello, %s! This is from Spring!", name);
  }
}
