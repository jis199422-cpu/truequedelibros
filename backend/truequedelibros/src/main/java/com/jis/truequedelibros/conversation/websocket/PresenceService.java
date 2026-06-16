package com.jis.truequedelibros.conversation.websocket;

import com.jis.truequedelibros.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PresenceService {

    private final UserRepository userRepository;

    // email → set of active sessionIds (multiple tabs/devices)
    private final ConcurrentHashMap<String, Set<String>> sessions = new ConcurrentHashMap<>();

    /** Returns true if the user just came online (first session). */
    public boolean markOnline(String email, String sessionId) {
        Set<String> userSessions = sessions.computeIfAbsent(email, k -> ConcurrentHashMap.newKeySet());
        boolean wasEmpty = userSessions.isEmpty();
        userSessions.add(sessionId);
        return wasEmpty;
    }

    /** Returns true if the user just went offline (no sessions remaining). */
    public boolean markOffline(String email, String sessionId) {
        Set<String> userSessions = sessions.get(email);
        if (userSessions == null) return false;
        userSessions.remove(sessionId);
        boolean nowEmpty = userSessions.isEmpty();
        if (nowEmpty) sessions.remove(email);
        return nowEmpty;
    }

    public boolean isOnline(String email) {
        Set<String> userSessions = sessions.get(email);
        return userSessions != null && !userSessions.isEmpty();
    }

    public boolean isOnline(UUID userId) {
        return userRepository.findById(userId)
                .map(u -> isOnline(u.getEmail()))
                .orElse(false);
    }
}
