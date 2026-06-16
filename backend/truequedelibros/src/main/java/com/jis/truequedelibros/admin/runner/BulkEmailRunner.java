package com.jis.truequedelibros.admin.runner;

import com.jis.truequedelibros.auth.service.EmailService;
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
@Profile("bulk-email")
@RequiredArgsConstructor
public class BulkEmailRunner implements ApplicationRunner {

    private final EmailService emailService;
    private final UserRepository userRepository;
    private final ApplicationContext applicationContext;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        List<String> emails = loadEmails();
        log.info("Iniciando envío masivo a {} emails", emails.size());

        int sent = 0, notFound = 0;
        for (String email : emails) {
            var userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                emailService.sendAddFirstBookEmail(email, userOpt.get().getName());
                log.info("Email enviado a {}", email);
                sent++;
            } else {
                log.warn("Usuario no encontrado en BD: {}", email);
                notFound++;
            }
        }

        log.info("Envío finalizado — enviados: {}, no encontrados: {}", sent, notFound);
        SpringApplication.exit(applicationContext, () -> 0);
    }

    private List<String> loadEmails() throws Exception {
        var resource = new ClassPathResource("bulk-email/usuarios.txt");
        var seen = new LinkedHashSet<String>();
        try (var reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String email = line.trim().toLowerCase();
                if (!email.isEmpty()) {
                    seen.add(email);
                }
            }
        }
        return new ArrayList<>(seen);
    }
}
