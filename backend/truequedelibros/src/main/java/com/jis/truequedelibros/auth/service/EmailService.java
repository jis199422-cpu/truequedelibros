package com.jis.truequedelibros.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.retry.RetryCallback;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.jis.truequedelibros.user.domain.User;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class EmailService {

    private final RestTemplate restTemplate;
    private final RetryTemplate retryTemplate;

    @Value("${zepto.api-url}")
    private String apiUrl;

    @Value("${zepto.send-mail-token}")
    private String sendMailToken;

    @Value("${zepto.from-address}")
    private String fromAddress;

    @Value("${zepto.from-name}")
    private String fromName;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public EmailService(@Qualifier("zeptoMailRestTemplate") RestTemplate restTemplate,
                        @Qualifier("emailRetryTemplate") RetryTemplate retryTemplate) {
        this.restTemplate = restTemplate;
        this.retryTemplate = retryTemplate;
    }

    @Async
    public void sendVerificationEmail(String toEmail, String name, String token) {
        String link = frontendUrl + "/auth/verify-email?token=" + token;
        String html = buildHtmlEmail(
                "Verificá tu cuenta",
                "Hola " + name + ",",
                "Gracias por registrarte en <strong>Trueque de Libros</strong>.<br><br>" +
                "Para activar tu cuenta hacé clic en el botón. Este enlace expira en <strong>24 horas</strong>.<br><br>" +
                "Si no creaste esta cuenta, podés ignorar este mensaje.",
                "Verificar mi cuenta",
                link
        );
        sendEmail(toEmail, name, "Verificá tu cuenta en Trueque de Libros", html);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String name, String token) {
        String link = frontendUrl + "/auth/reset-password?token=" + token;
        String html = buildHtmlEmail(
                "Restablecer contraseña",
                "Hola " + name + ",",
                "Recibimos una solicitud para restablecer la contraseña de tu cuenta.<br><br>" +
                "Hacé clic en el botón para crear una nueva contraseña. Este enlace expira en <strong>1 hora</strong>.<br><br>" +
                "Si no solicitaste este cambio, podés ignorar este mensaje.",
                "Restablecer contraseña",
                link
        );
        sendEmail(toEmail, name, "Restablecer contraseña - Trueque de Libros", html);
    }

    @Async
    public void sendMatchEmail(String toEmail, String recipientName, String matchedWithName) {
        String html = buildHtmlEmail(
                "¡Nuevo match!",
                "Hola " + recipientName + ",",
                "¡Tenés un nuevo match con <strong>" + matchedWithName + "</strong> en Trueque de Libros!<br><br>" +
                "Ambos se gustaron los libros del otro. Entrá a la app para comenzar a chatear y coordinar el intercambio.",
                "Ir a la app",
                frontendUrl
        );
        sendEmail(toEmail, recipientName, "¡Nuevo match en Trueque de Libros!", html);
    }

    @Async
    public void sendBookLikedEmail(String toEmail, String recipientName, String likerName, String bookTitle) {
        String html = buildHtmlEmail(
                "¡Le gustó tu libro!",
                "Hola " + recipientName + ",",
                "<strong>" + likerName + "</strong> le dio like a tu libro <em>\"" + bookTitle + "\"</em>.<br><br>" +
                "Entrá a la app para ver quién está interesado en tu libro.",
                "Ver quién le dio like",
                frontendUrl + "/likes"
        );
        try {
            sendEmail(toEmail, recipientName, "¡A alguien le gustó tu libro en Trueque de Libros!", html);
        } catch (Exception e) {
            log.error("Error enviando email de like a {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendNewMessageEmail(String toEmail, String recipientName, String senderName) {
        String html = buildHtmlEmail(
                "Nuevo mensaje",
                "Hola " + recipientName + ",",
                "<strong>" + senderName + "</strong> te envió un mensaje en Trueque de Libros.",
                "Ver mensaje",
                frontendUrl + "/conversations"
        );
        try {
            sendEmail(toEmail, recipientName, "Tenés un nuevo mensaje en Trueque de Libros", html);
        } catch (Exception e) {
            log.error("Error enviando email de mensaje a {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendWishlistNotificationEmail(String toEmail, String recipientName,
                                               String bookTitle, String adderName, String adderCity) {
        String cityPart = (adderCity != null && !adderCity.isBlank()) ? " en " + adderCity : "";
        String html = buildHtmlEmail(
                "¡Libro disponible!",
                "Hola " + recipientName + ",",
                "¡Buenas noticias! <strong>" + adderName + "</strong> publicó el libro " +
                "<em>\"" + bookTitle + "\"</em>" + cityPart + " en Trueque de Libros.<br><br>" +
                "Este título está en tu lista de deseos. Si te interesa, dale like para iniciar un intercambio.",
                "Ver libro",
                frontendUrl + "/feed"
        );
        try {
            sendEmail(toEmail, recipientName, "¡Un libro de tu lista de deseos está disponible!", html);
        } catch (Exception e) {
            log.error("Error enviando email de wishlist a {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendReadingPlanParticipantEmail(String toEmail, String participantName,
                                                String planDescription, String organizerName,
                                                String contactPhone) {
        String html = buildHtmlEmail(
                "¡Plan de lectura confirmado!",
                "Hola " + participantName + ",",
                "¡Buenas noticias! El plan de lectura al que te uniste llegó al mínimo de participantes.<br><br>" +
                "Plan: <em>\"" + planDescription + "\"</em><br><br>" +
                "Para coordinar el encuentro, podés contactar al organizador <strong>" + organizerName +
                "</strong> directamente:<br>Teléfono: <strong>" + contactPhone + "</strong>",
                "Ir a la app",
                frontendUrl
        );
        try {
            sendEmail(toEmail, participantName, "¡El plan de lectura alcanzó el cuórum!", html);
        } catch (Exception e) {
            log.error("Error enviando email de plan de lectura a {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendReadingPlanOrganizerEmail(String toEmail, String organizerName,
                                              String planDescription, List<String> participantNames,
                                              String contactPhone) {
        String namesJoined = String.join(", ", participantNames);
        String html = buildHtmlEmail(
                "¡Tu plan de lectura alcanzó el cuórum!",
                "Hola " + organizerName + ",",
                "¡Tu plan de lectura llegó al mínimo de participantes!<br><br>" +
                "Plan: <em>\"" + planDescription + "\"</em><br>" +
                "Participantes: <strong>" + namesJoined + "</strong><br><br>" +
                "Ya les enviamos tu número de contacto (<strong>" + contactPhone +
                "</strong>) para que puedan coordinar el encuentro.",
                "Ver mi plan",
                frontendUrl
        );
        try {
            sendEmail(toEmail, organizerName, "¡Tu plan de lectura alcanzó el cuórum!", html);
        } catch (Exception e) {
            log.error("Error enviando email de plan al organizador {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendWelcomeOnboardingEmail(String toEmail, String name) {
        String link = frontendUrl + "/my-books";
        String html = buildHtmlEmail(
                "¡Bienvenido/a a Trueque de Libros!",
                "Hola " + name + ", ¡tu cuenta ya está verificada!",
                "El primer paso para hacer un trueque es <strong>cargar al menos un libro disponible</strong>.<br><br>" +
                "Una vez que tengas un libro publicado como <em>Disponible</em>, otros usuarios podrán encontrarte y proponer intercambios.<br><br>" +
                "Es rápido: subí la foto de tapa, completá los datos básicos y ¡listo!",
                "Cargar mi primer libro",
                link
        );
        try {
            sendEmail(toEmail, name, "¡Tu primer paso en Trueque de Libros!", html);
        } catch (Exception e) {
            log.error("Error enviando email de bienvenida a {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendAddFirstBookEmail(String toEmail, String name) {
        String html = buildHtmlEmail(
                "¡Cargá tu primer libro!",
                "Hola " + name + ",",
                "Notamos que todavía no publicaste ningún libro en <strong>Trueque de Libros</strong>.<br><br>" +
                "Sin libros cargados, las posibilidades de hacer un match y concretar un trueque son muy bajas. " +
                "¡Solo te lleva un minuto publicar tu primer libro!<br><br>" +
                "Compartí esos libros que ya leíste y no sabés qué hacer con ellos. Alguien los está buscando — " +
                "y vos podrías llevarte uno que querés leer.",
                "Agregar mi primer libro",
                frontendUrl + "/my-books"
        );
        try {
            sendEmail(toEmail, name, "¡Agregá tu primer libro y empezá a hacer trueques!", html);
        } catch (Exception e) {
            log.error("Error enviando recordatorio de primer libro a {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendNoBooksNewsEmail(String toEmail, String name, long availableBooksCount) {
        String bodyHtml = "Notamos que todavía no publicaste ningún libro en <strong>Trueque de Libros</strong>. " +
                "Te contamos algunas novedades que sumamos pensando en vos:<br><br>" +
                "<ul style=\"margin:0;padding-left:20px;color:#4a4a4a;font-size:15px;line-height:1.8\">" +
                "<li><strong>Puntos seguros:</strong> ya podés coordinar tus trueques en locales aliados — dejás el libro " +
                "que vas a intercambiar y retirás el que te corresponde, sin necesidad de coordinar un encuentro cara a cara.</li>" +
                "<li><strong>Descuentos exclusivos:</strong> por ser usuario de Trueque de Libros, en esos mismos locales " +
                "tenés descuentos especiales. Estamos arrancando, pero ya estamos sumando cafeterías y otros tipos de comercio.</li>" +
                "<li><strong>Ahora también podés regalar:</strong> sumamos la opción de regalar tus libros, y también hay " +
                "libros de regalo disponibles para vos.</li>" +
                "</ul><br>" +
                "Hoy hay <strong>" + availableBooksCount + " libros disponibles</strong> para intercambiar, comprar o " +
                "conseguir de regalo — seguro encontrás algo que te interese.<br><br>" +
                "Para empezar, solo te falta subir tu primer libro. ¡Te toma un minuto!<br><br>" +
                "Y nos encantaría conocer tu opinión: ¿qué te gustaría que sumemos? ¿Clubes de lectura? ¿Eventos? " +
                "¿Más descuentos? Respondé este email, lo vamos a leer.";
        String html = buildHtmlEmail(
                "¡Tenemos novedades para vos!",
                "Hola " + name + ",",
                bodyHtml,
                "Subir mi primer libro",
                frontendUrl + "/my-books"
        );
        try {
            sendEmail(toEmail, name, "Novedades en Trueque de Libros: puntos seguros, descuentos y más",
                    html, "contacto@truequedelibros.com");
        } catch (Exception e) {
            log.error("Error enviando email de novedades a {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendHomeDeliveryRequest(User user, UUID conversationId) {
        String cityPart = (user.getCity() != null && !user.getCity().isBlank())
                ? user.getCity() : "no especificada";
        String convPart = (conversationId != null) ? conversationId.toString() : "—";
        String bodyHtml = "<p>El usuario <strong>" + user.getName() + "</strong> prefiere recibir su libro en su casa.</p>" +
                "<ul>" +
                "<li><strong>Email:</strong> " + user.getEmail() + "</li>" +
                "<li><strong>Ciudad:</strong> " + cityPart + "</li>" +
                "<li><strong>ID conversación:</strong> " + convPart + "</li>" +
                "</ul>";
        String html = buildHtmlEmail(
                "Solicitud de envío a domicilio",
                "Hola equipo,",
                bodyHtml,
                null, null
        );
        sendEmail("contacto@truequedelibros.com", "Equipo Trueque de Libros",
                "Solicitud de envío a domicilio — " + user.getName(), html);
    }

    public void sendExternalPurchaseRequestEmail(User user, List<String> bookTitles) {
        String titlesHtml = bookTitles.stream()
                .map(t -> "<li>" + t + "</li>")
                .collect(Collectors.joining());
        String bodyHtml = "<p>El usuario <strong>" + user.getName() + "</strong> (" + user.getEmail() +
                ") quiere que le avisemos sobre opciones de compra fuera de Trueque de Libros para:</p>" +
                "<ul>" + titlesHtml + "</ul>";
        String html = buildHtmlEmail(
                "Solicitud de búsqueda de precios externos",
                "Hola equipo,",
                bodyHtml,
                null, null
        );
        sendEmail("contacto@truequedelibros.com", "Equipo Trueque de Libros",
                "Solicitud de precios externos — " + user.getName(), html);
    }

    public void sendBookUnavailableReport(String bookTitle, String localName,
                                           String userName, String userEmail,
                                           java.time.LocalDateTime reportedAt, String message) {
        String comentario = (message != null && !message.isBlank())
                ? "<li><strong>Comentario:</strong> " + message + "</li>"
                : "";
        String bodyHtml = "<p>Se reportó un libro como no disponible en un Punto Seguro.</p>" +
                "<ul>" +
                "<li><strong>Libro:</strong> " + bookTitle + "</li>" +
                "<li><strong>Local:</strong> " + localName + "</li>" +
                "<li><strong>Usuario:</strong> " + userName + " (" + userEmail + ")</li>" +
                "<li><strong>Fecha y hora:</strong> " + reportedAt.toString().replace("T", " ") + "</li>" +
                comentario +
                "</ul>";
        String html = buildHtmlEmail(
                "Libro reportado como no disponible",
                "Hola equipo,",
                bodyHtml,
                null, null
        );
        sendEmail("contacto@truequedelibros.com", "Equipo Trueque de Libros",
                "Libro no disponible en " + localName + " — " + bookTitle, html);
    }

    private void sendEmail(String toAddress, String toName, String subject, String htmlBody) {
        sendEmail(toAddress, toName, subject, htmlBody, null);
    }

    private void sendEmail(String toAddress, String toName, String subject, String htmlBody, String replyToAddress) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(HttpHeaders.AUTHORIZATION, sendMailToken);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("from", Map.of("address", fromAddress, "name", fromName));
        body.put("to", List.of(Map.of("email_address", Map.of("address", toAddress, "name", toName))));
        body.put("subject", subject);
        body.put("htmlbody", htmlBody);
        if (replyToAddress != null) {
            body.put("reply_to", List.of(Map.of("address", replyToAddress, "name", "Equipo Trueque de Libros")));
        }

        try {
            retryTemplate.execute((RetryCallback<Void, RestClientException>) ctx -> {
                if (ctx.getRetryCount() > 0) {
                    log.warn("Reintento {} enviando email a {} [{}]", ctx.getRetryCount(), toAddress, subject);
                }
                restTemplate.postForEntity(apiUrl, new HttpEntity<>(body, headers), String.class);
                return null;
            });
        } catch (RestClientException e) {
            log.error("Error enviando email a {} [{}]: {}", toAddress, subject, e.getMessage());
            throw e;
        }
    }

    private String buildHtmlEmail(String title, String greeting, String bodyHtml,
                                   String buttonText, String buttonUrl) {
        String button = (buttonText != null && buttonUrl != null)
                ? "<div style=\"text-align:center;margin:32px 0\">" +
                  "<a href=\"" + buttonUrl + "\" style=\"background-color:#4B0081;color:#ffffff;text-decoration:none;" +
                  "padding:14px 28px;border-radius:6px;font-weight:bold;font-size:15px;display:inline-block\">" +
                  buttonText + "</a></div>" +
                  "<p style=\"text-align:center;font-size:12px;color:#9a9a9a;margin:0 0 4px\">" +
                  "Si el bot&#243;n no abre, copi&#225; este enlace en tu navegador:</p>" +
                  "<p style=\"text-align:center;font-size:12px;margin:0;word-break:break-all\">" +
                  "<a href=\"" + buttonUrl + "\" style=\"color:#4B0081\">" + buttonUrl + "</a></p>"
                : "";

        return """
                <!DOCTYPE html>
                <html lang="es">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                <body style="margin:0;padding:0;background-color:#f5f0eb;font-family:Arial,sans-serif">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:32px 16px">
                    <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%">
                        <tr><td style="background-color:#4B0081;border-radius:8px 8px 0 0;padding:24px 32px;text-align:center">
                          <span style="color:#ffffff;font-size:22px;font-weight:bold">Trueque de Libros</span>
                        </td></tr>
                        <tr><td style="background-color:#ffffff;padding:32px;border-radius:0 0 8px 8px">
                          <h2 style="color:#2d2d2d;margin:0 0 16px">%s</h2>
                          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 12px">%s</p>
                          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0">%s</p>
                          %s
                          <hr style="border:none;border-top:1px solid #e8e0d8;margin:24px 0">
                          <p style="color:#9a9a9a;font-size:12px;margin:0;text-align:center">
                            Este mensaje fue enviado por Trueque de Libros.<br>
                            Si no esperabas este email, podés ignorarlo.
                          </p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(title, greeting, bodyHtml, button);
    }
}
