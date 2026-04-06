package com.nexus.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class NexusGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(NexusGatewayApplication.class, args);
    }
}