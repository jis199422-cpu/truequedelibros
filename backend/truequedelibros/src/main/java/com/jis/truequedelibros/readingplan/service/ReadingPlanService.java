package com.jis.truequedelibros.readingplan.service;

import com.jis.truequedelibros.auth.service.EmailService;
import com.jis.truequedelibros.readingplan.domain.ReadingPlan;
import com.jis.truequedelibros.readingplan.domain.ReadingPlanParticipant;
import com.jis.truequedelibros.readingplan.dto.CreateReadingPlanRequest;
import com.jis.truequedelibros.readingplan.dto.ReadingPlanResponse;
import com.jis.truequedelibros.readingplan.dto.ReadingPlansPageResponse;
import com.jis.truequedelibros.readingplan.dto.UpdateReadingPlanRequest;
import com.jis.truequedelibros.readingplan.repository.ReadingPlanParticipantRepository;
import com.jis.truequedelibros.readingplan.repository.ReadingPlanRepository;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReadingPlanService {

    private static final int PAGE_SIZE = 5;

    private final ReadingPlanRepository planRepository;
    private final ReadingPlanParticipantRepository participantRepository;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public ReadingPlansPageResponse getPlans(User user, int page) {
        Page<ReadingPlan> result = planRepository.findByActiveTrueOrderByCreatedAtDesc(
                PageRequest.of(page, PAGE_SIZE));

        List<ReadingPlanResponse> responses = result.getContent().stream()
                .map(plan -> toResponse(plan, user))
                .toList();

        return ReadingPlansPageResponse.builder()
                .plans(responses)
                .hasMore(result.hasNext())
                .totalElements(result.getTotalElements())
                .page(page)
                .build();
    }

    @Transactional
    public ReadingPlanResponse create(User organizer, CreateReadingPlanRequest request) {
        if (planRepository.existsByOrganizer_IdAndActiveTrue(organizer.getId())) {
            throw new AppException("Ya tenés un plan activo. Eliminalo antes de crear uno nuevo.", HttpStatus.CONFLICT);
        }
        ReadingPlan plan = ReadingPlan.builder()
                .organizer(organizer)
                .description(request.getDescription())
                .maxParticipants(request.getMaxParticipants())
                .contactPhone(request.getContactPhone())
                .build();
        plan = planRepository.save(plan);
        return toResponse(plan, organizer);
    }

    @Transactional
    public ReadingPlanResponse update(UUID planId, User user, UpdateReadingPlanRequest request) {
        ReadingPlan plan = findActiveOrThrow(planId);
        assertOrganizer(plan, user);

        int oldMax = plan.getMaxParticipants();
        plan.setDescription(request.getDescription());
        plan.setMaxParticipants(request.getMaxParticipants());
        plan.setContactPhone(request.getContactPhone());

        // If capacity increased beyond current participants, allow emails again for the new quorum
        if (request.getMaxParticipants() > oldMax) {
            int current = participantRepository.countByPlan_Id(planId);
            if (current < request.getMaxParticipants()) {
                plan.setEmailsSent(false);
            }
        }

        plan = planRepository.save(plan);
        return toResponse(plan, user);
    }

    @Transactional
    public void delete(UUID planId, User user) {
        ReadingPlan plan = findActiveOrThrow(planId);
        assertOrganizer(plan, user);
        plan.setActive(false);
        planRepository.save(plan);
    }

    @Transactional
    public ReadingPlanResponse join(UUID planId, User user) {
        ReadingPlan plan = findActiveOrThrow(planId);

        if (plan.getOrganizer().getId().equals(user.getId())) {
            throw new AppException("El organizador no puede unirse a su propio plan", HttpStatus.BAD_REQUEST);
        }
        if (participantRepository.existsByPlan_IdAndUser_Id(planId, user.getId())) {
            throw new AppException("Ya te uniste a este plan", HttpStatus.CONFLICT);
        }

        int current = participantRepository.countByPlan_Id(planId);
        if (current >= plan.getMaxParticipants()) {
            throw new AppException("El plan ya está completo", HttpStatus.CONFLICT);
        }

        participantRepository.save(ReadingPlanParticipant.builder()
                .plan(plan)
                .user(user)
                .build());

        int newCount = current + 1;
        if (newCount >= plan.getMaxParticipants() && !plan.isEmailsSent()) {
            plan.setEmailsSent(true);
            planRepository.save(plan);
            sendQuorumEmails(plan, planId);
        }

        return toResponse(plan, user);
    }

    @Transactional
    public ReadingPlanResponse leave(UUID planId, User user) {
        ReadingPlan plan = findActiveOrThrow(planId);

        ReadingPlanParticipant participant = participantRepository
                .findByPlan_IdAndUser_Id(planId, user.getId())
                .orElseThrow(() -> new AppException("No estás unido a este plan", HttpStatus.NOT_FOUND));

        participantRepository.delete(participant);
        return toResponse(plan, user);
    }

    private void sendQuorumEmails(ReadingPlan plan, UUID planId) {
        List<ReadingPlanParticipant> participants = participantRepository.findByPlan_Id(planId);

        String planDescription = plan.getDescription();
        String organizerName = plan.getOrganizer().getName();
        String organizerEmail = plan.getOrganizer().getEmail();
        String contactPhone = plan.getContactPhone();

        List<String> participantNames = participants.stream()
                .map(p -> p.getUser().getName())
                .toList();

        participants.forEach(p -> emailService.sendReadingPlanParticipantEmail(
                p.getUser().getEmail(),
                p.getUser().getName(),
                planDescription,
                organizerName,
                contactPhone));

        emailService.sendReadingPlanOrganizerEmail(
                organizerEmail,
                organizerName,
                planDescription,
                participantNames,
                contactPhone);
    }

    private ReadingPlan findActiveOrThrow(UUID planId) {
        ReadingPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new AppException("Plan no encontrado", HttpStatus.NOT_FOUND));
        if (!plan.isActive()) {
            throw new AppException("Plan no encontrado", HttpStatus.NOT_FOUND);
        }
        return plan;
    }

    private void assertOrganizer(ReadingPlan plan, User user) {
        if (!plan.getOrganizer().getId().equals(user.getId())) {
            throw new AppException("Solo el organizador puede modificar este plan", HttpStatus.FORBIDDEN);
        }
    }

    private ReadingPlanResponse toResponse(ReadingPlan plan, User viewer) {
        int current = participantRepository.countByPlan_Id(plan.getId());
        boolean isOrganizer = viewer != null && plan.getOrganizer().getId().equals(viewer.getId());
        boolean isParticipant = viewer != null && participantRepository.existsByPlan_IdAndUser_Id(plan.getId(), viewer.getId());
        boolean isFull = current >= plan.getMaxParticipants();

        String contactPhone = (isFull || isOrganizer) ? plan.getContactPhone() : null;

        return ReadingPlanResponse.builder()
                .id(plan.getId())
                .description(plan.getDescription())
                .maxParticipants(plan.getMaxParticipants())
                .currentParticipants(current)
                .contactPhone(contactPhone)
                .organizerName(plan.getOrganizer().getName())
                .organizerAvatarUrl(plan.getOrganizer().getProfilePictureUrl())
                .organizer(isOrganizer)
                .participant(isParticipant)
                .full(isFull)
                .createdAt(plan.getCreatedAt())
                .build();
    }
}
