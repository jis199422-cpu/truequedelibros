package com.jis.truequedelibros.admin.controller;

import com.jis.truequedelibros.admin.dto.ActivationStatsResponse;
import com.jis.truequedelibros.admin.dto.AdminBookResponse;
import com.jis.truequedelibros.admin.dto.AdminStatsResponse;
import com.jis.truequedelibros.admin.dto.AdminUserResponse;
import com.jis.truequedelibros.admin.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/stats/activation")
    public ResponseEntity<ActivationStatsResponse> getActivationStats() {
        return ResponseEntity.ok(adminService.getActivationStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getUsers() {
        return ResponseEntity.ok(adminService.getUsers());
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<AdminUserResponse> toggleBan(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.toggleBan(id));
    }

    @GetMapping("/books")
    public ResponseEntity<List<AdminBookResponse>> getBooks() {
        return ResponseEntity.ok(adminService.getBooks());
    }

    @DeleteMapping("/books/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable UUID id) {
        adminService.deleteBook(id);
        return ResponseEntity.noContent().build();
    }
}
