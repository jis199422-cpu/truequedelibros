package com.jis.truequedelibros.book.controller;

import com.jis.truequedelibros.book.domain.Genre;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/genres")
public class GenreController {

    @GetMapping
    public ResponseEntity<List<Map<String, String>>> getGenres() {
        List<Map<String, String>> genres = Arrays.stream(Genre.values())
                .map(g -> Map.of("name", g.name(), "label", g.getLabel()))
                .toList();
        return ResponseEntity.ok(genres);
    }
}
