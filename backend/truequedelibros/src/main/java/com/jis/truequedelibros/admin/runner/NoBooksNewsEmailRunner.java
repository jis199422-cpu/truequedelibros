package com.jis.truequedelibros.admin.runner;

import com.jis.truequedelibros.auth.service.EmailService;
import com.jis.truequedelibros.book.domain.BookStatus;
import com.jis.truequedelibros.book.repository.BookRepository;
import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Slf4j
@Component
@Profile("no-books-news-email")
@RequiredArgsConstructor
public class NoBooksNewsEmailRunner implements ApplicationRunner {

    private final EmailService emailService;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final ApplicationContext applicationContext;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        boolean send = args.containsOption("send");
        List<String> emails = loadEmails();
        long availableBooksCount = bookRepository.countByStatus(BookStatus.AVAILABLE);
        log.info("Lista cargada: {} emails. Libros disponibles hoy: {}. Modo: {}",
                emails.size(), availableBooksCount, send ? "ENVÍO REAL" : "DRY-RUN (pasá --send para enviar de verdad)");

        int sent = 0, alreadyHasBooks = 0, notFound = 0;
        for (String email : emails) {
            var userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                log.warn("Usuario no encontrado en BD: {}", email);
                notFound++;
                continue;
            }
            User user = userOpt.get();
            if (bookRepository.existsByOwner_Id(user.getId())) {
                log.info("Salteado (ya tiene libros cargados): {}", email);
                alreadyHasBooks++;
                continue;
            }
            if (send) {
                emailService.sendNoBooksNewsEmail(email, user.getName(), availableBooksCount);
                log.info("Email enviado a {}", email);
            } else {
                log.info("[DRY-RUN] Se enviaría a {} ({})", email, user.getName());
            }
            sent++;
        }

        log.info("Finalizado — {}: {}, ya tenían libros: {}, no encontrados: {}",
                send ? "enviados" : "se enviarían", sent, alreadyHasBooks, notFound);
        SpringApplication.exit(applicationContext, () -> 0);
    }

    private List<String> loadEmails() throws Exception {
        var resource = new ClassPathResource("bulk-email/no-books-news-recipients.txt");
        var seen = new LinkedHashSet<String>();
        try (var reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split("\\|");
                if (parts.length != 3) {
                    continue;
                }
                String email = parts[2].trim().toLowerCase();
                if (email.isEmpty() || !email.contains("@")) {
                    continue;
                }
                seen.add(email);
            }
        }
        return new ArrayList<>(seen);
    }
}
