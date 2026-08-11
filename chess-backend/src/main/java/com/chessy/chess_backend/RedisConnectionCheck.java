package com.chessy.chess_backend;

import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class RedisConnectionCheck implements CommandLineRunner {

    private final RedissonClient redisson;

    public RedisConnectionCheck(RedissonClient redisson) {
        this.redisson = redisson;
    }

    @Override
    public void run(String... args) {
        RBucket<String> bucket = redisson.getBucket("startup-check");
        bucket.set("hello from " + java.time.Instant.now());
        System.out.println("Redis says: " + bucket.get());
    }
}