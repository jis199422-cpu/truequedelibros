package com.jis.truequedelibros.match.service;

import com.jis.truequedelibros.book.service.BookService;
import com.jis.truequedelibros.conversation.service.ConversationService;
import com.jis.truequedelibros.match.domain.Match;
import com.jis.truequedelibros.match.dto.MatchResponse;
import com.jis.truequedelibros.match.repository.MatchRepository;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final ConversationService conversationService;
    private final BookService bookService;

    @Transactional(readOnly = true)
    public List<MatchResponse> getMatches(User user) {
        return matchRepository.findByUserId(user.getId())
                .stream().map(m -> toResponse(m, user)).toList();
    }

    private MatchResponse toResponse(Match match, User user) {
        boolean isUserA = match.getUserA().getId().equals(user.getId());
        User other = isUserA ? match.getUserB() : match.getUserA();

        java.util.UUID conversationId = conversationService
                .findByUsers(user.getId(), other.getId())
                .map(c -> c.getId())
                .orElse(null);

        return MatchResponse.builder()
                .id(match.getId())
                .conversationId(conversationId)
                .otherUser(MatchResponse.OtherUserInfo.builder()
                        .id(other.getId()).name(other.getName())
                        .profilePictureUrl(other.getProfilePictureUrl())
                        .city(other.getCity()).build())
                .bookYouLiked(bookService.toResponse(isUserA ? match.getBookB() : match.getBookA()))
                .bookTheyLiked(bookService.toResponse(isUserA ? match.getBookA() : match.getBookB()))
                .createdAt(match.getCreatedAt())
                .build();
    }
}
