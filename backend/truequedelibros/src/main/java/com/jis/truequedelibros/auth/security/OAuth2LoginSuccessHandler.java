package com.jis.truequedelibros.auth.security;

import com.jis.truequedelibros.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.refresh-token.expiration-days}")
    private long refreshTokenExpirationDays;

    @Value("${app.secure-cookies}")
    private boolean secureCookies;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        AuthService.OAuth2LoginResult result = authService.loginOrRegisterOAuth2User(
                oAuth2User.getAttribute("email"),
                oAuth2User.getAttribute("sub"),
                oAuth2User.getAttribute("name"),
                oAuth2User.getAttribute("picture")
        );

        response.addHeader("Set-Cookie", buildRefreshTokenCookie(result.loginResult().refreshToken()).toString());
        String redirectUrl = frontendUrl + "/auth/google/callback?accessToken=" + result.loginResult().accessToken();
        if (result.isNewUser()) redirectUrl += "&isNewUser=true";
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private ResponseCookie buildRefreshTokenCookie(String token) {
        return ResponseCookie.from("refresh_token", token)
                .httpOnly(true)
                .secure(secureCookies)
                .path("/")
                .maxAge(Duration.ofDays(refreshTokenExpirationDays))
                .sameSite("Lax")
                .build();
    }
}
