package com.nexus.user;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
@EnableDiscoveryClient
@MapperScan("com.nexus.user.mapper")
public class NexusUserApplication {
    public static void main(String[] args) {
        SpringApplication.run(NexusUserApplication.class, args);
    }
}