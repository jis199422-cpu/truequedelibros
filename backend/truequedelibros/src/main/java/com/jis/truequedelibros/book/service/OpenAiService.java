package com.jis.truequedelibros.book.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jis.truequedelibros.book.domain.Genre;
import com.jis.truequedelibros.book.dto.BookEnrichResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OpenAiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${openai.api-key:}")
    private String apiKey;

    private static final String API_URL = "https://api.openai.com/v1/chat/completions";

    public String generateDescription(String title, String author) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OpenAI API key no configurada");
        }

        String prompt = String.format(
            "Escribe una descripción breve y atractiva en español para el libro '%s' de %s. Máximo 3 oraciones.",
            title, author
        );

        Map<String, Object> body = Map.of(
            "model", "gpt-4o-mini",
            "messages", List.of(Map.of("role", "user", "content", prompt)),
            "max_tokens", 200
        );

        Map response = callApi(body);
        return extractContent(response);
    }

    public BookEnrichResponse enrichFromTitle(String title) {
        if (apiKey == null || apiKey.isBlank()) return null;
        try {
            String prompt = String.format(
                "Para el libro \"%s\", responde SOLO con un JSON válido (sin markdown ni texto extra):\n" +
                "{\"author\":\"...\",\"genre\":\"uno exacto de: %s\",\"description\":\"máx 3 oraciones en español\"}\n" +
                "Si no conocés un campo, usá null.",
                title, buildGenreList()
            );

            Map<String, Object> body = Map.of(
                "model", "gpt-4o-mini",
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "max_tokens", 300
            );

            Map response = callApi(body);
            String content = extractContent(response);
            return parseEnrichResponse(content);
        } catch (Exception ignored) {
            return null;
        }
    }

    public BookEnrichResponse enrichFromImage(String imageUrl) {
        if (apiKey == null || apiKey.isBlank()) return null;
        try {
            String textPrompt = String.format(
                "Analiza la portada del libro en la imagen y responde SOLO con un JSON válido (sin markdown ni texto extra):\n" +
                "{\"title\":\"...\",\"author\":\"...\",\"genre\":\"uno exacto de: %s\",\"description\":\"máx 3 oraciones en español\"}\n" +
                "Si no podés identificar un campo, usá null.",
                buildGenreList()
            );

            List<Map<String, Object>> content = List.of(
                Map.of("type", "text", "text", textPrompt),
                Map.of("type", "image_url", "image_url", Map.of("url", imageUrl))
            );

            Map<String, Object> body = Map.of(
                "model", "gpt-4o-mini",
                "messages", List.of(Map.of("role", "user", "content", content)),
                "max_tokens", 300
            );

            Map response = callApi(body);
            String responseContent = extractContent(response);
            return parseEnrichResponse(responseContent);
        } catch (Exception ignored) {
            return null;
        }
    }

    private Map callApi(Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        ResponseEntity<Map> response = restTemplate.exchange(
            API_URL,
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );
        return response.getBody();
    }

    private String extractContent(Map response) {
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }

    private BookEnrichResponse parseEnrichResponse(String json) throws Exception {
        if (json == null || json.isBlank()) return null;
        // Strip potential markdown fences
        String clean = json.strip();
        if (clean.startsWith("```")) {
            clean = clean.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").strip();
        }
        Map<String, String> map = objectMapper.readValue(clean, Map.class);
        return BookEnrichResponse.builder()
            .title(map.get("title"))
            .author(map.get("author"))
            .genre(resolveGenre(map.get("genre")))
            .description(map.get("description"))
            .build();
    }

    private String resolveGenre(String suggested) {
        if (suggested == null || suggested.isBlank()) return null;
        String normalized = suggested.trim().toUpperCase().replace(" ", "_").replace("-", "_");
        try {
            Genre.valueOf(normalized);
            return normalized;
        } catch (IllegalArgumentException e) {
            // Try matching against labels
            for (Genre g : Genre.values()) {
                if (g.getLabel().equalsIgnoreCase(suggested.trim())) return g.name();
            }
            return "OTROS";
        }
    }

    private String buildGenreList() {
        return Arrays.stream(Genre.values())
            .map(Genre::name)
            .collect(Collectors.joining(", "));
    }
}
