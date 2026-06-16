package com.jis.truequedelibros.conversation.websocket;

import java.util.UUID;

public record PresenceEvent(UUID userId, boolean online) {}
