package com.nexus.user;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(scanBasePackages = "com.nexus")
@EnableDiscoveryClient
@MapperScan("com.nexus.user.infrastructure.persistence.mapper")
public class NexusUserApplication {
    public static void main(String[] args) {
        SpringApplication.run(NexusUserApplication.class, args);
    }
}