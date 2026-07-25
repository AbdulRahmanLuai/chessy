package com.chessy.chess_backend.controller.rest;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TimeController {

    @GetMapping("/api/time")
    public ResponseEntity<Map<String, Long>> getServerTime() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(Map.of("serverTime", System.currentTimeMillis()));
    }
}