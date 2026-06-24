package com.jis.truequedelibros.beneficio.service;

import com.jis.truequedelibros.beneficio.domain.*;
import com.jis.truequedelibros.beneficio.dto.*;
import com.jis.truequedelibros.beneficio.repository.*;
import com.jis.truequedelibros.shared.exception.AppException;
import com.jis.truequedelibros.user.domain.Role;
import com.jis.truequedelibros.user.domain.User;
import com.jis.truequedelibros.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BeneficioService {

    private final LocalRepository localRepository;
    private final PromocionRepository promocionRepository;
    private final CuponRepository cuponRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final SecureRandom RNG = new SecureRandom();

    // ── Public / User ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LocalResponse> getActiveLocales() {
        return localRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LocalResponse getLocalById(UUID id) {
        Local local = findLocalOrThrow(id);
        return toResponse(local);
    }

    public GenerarCuponResponse generarCupon(User user, GenerarCuponRequest request) {
        if (user.getTermsAcceptedAt() == null) {
            throw new AppException("Debés aceptar los términos y condiciones de la plataforma", HttpStatus.FORBIDDEN);
        }

        Local local = findLocalOrThrow(request.localId());

        if (!local.isActive()) {
            throw new AppException("El local no está disponible", HttpStatus.BAD_REQUEST);
        }

        Promocion promocion = promocionRepository
                .findByIdAndLocal_Id(request.promocionId(), request.localId())
                .orElseThrow(() -> new AppException("Promoción no encontrada", HttpStatus.NOT_FOUND));

        if (!promocion.isActive()) {
            throw new AppException("La promoción no está activa", HttpStatus.BAD_REQUEST);
        }

        if (cuponRepository.existsByUser_IdAndLocal_IdAndStatus(
                user.getId(), request.localId(), CuponStatus.PENDIENTE)) {
            throw new AppException(
                    "Ya tenés un cupón activo para este local", HttpStatus.CONFLICT);
        }

        String code = generateUniqueCode();
        Cupon cupon = Cupon.builder()
                .user(user)
                .local(local)
                .promocion(promocion)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();
        cupon = cuponRepository.save(cupon);

        return new GenerarCuponResponse(cupon.getId(), cupon.getCode(), cupon.getExpiresAt());
    }

    @Transactional(readOnly = true)
    public Optional<GenerarCuponResponse> getCuponActivo(User user, UUID localId) {
        return cuponRepository
                .findByUser_IdAndLocal_IdAndStatus(user.getId(), localId, CuponStatus.PENDIENTE)
                .filter(c -> c.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(c -> new GenerarCuponResponse(c.getId(), c.getCode(), c.getExpiresAt()));
    }

    public void cancelarCupon(User user, UUID cuponId) {
        Cupon cupon = cuponRepository.findById(cuponId)
                .orElseThrow(() -> new AppException("Cupón no encontrado", HttpStatus.NOT_FOUND));
        if (!cupon.getUser().getId().equals(user.getId())) {
            throw new AppException("No tenés permiso para cancelar este cupón", HttpStatus.FORBIDDEN);
        }
        if (cupon.getStatus() != CuponStatus.PENDIENTE) {
            throw new AppException("Solo se pueden cancelar cupones pendientes", HttpStatus.BAD_REQUEST);
        }
        cupon.setStatus(CuponStatus.EXPIRADO);
        cuponRepository.save(cupon);
    }

    @Transactional(readOnly = true)
    public List<CanjeResponse> getMisCupones(User user) {
        return cuponRepository.findByUser_IdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toCanjeResponse)
                .toList();
    }

    // ── Local dashboard ───────────────────────────────────────────────────────

    public EstadisticasResponse getEstadisticas(User localUser, UUID localId) {
        assertOwnership(localUser, localId);
        LocalDate today = LocalDate.now();
        return new EstadisticasResponse(
                cuponRepository.countByLocal_IdAndStatus(localId, CuponStatus.VALIDADO),
                cuponRepository.countByLocal_IdAndStatus(localId, CuponStatus.EXPIRADO),
                cuponRepository.countByLocal_IdAndStatus(localId, CuponStatus.PENDIENTE),
                cuponRepository.countValidatedByLocalAndDay(localId, today),
                cuponRepository.countValidatedByLocalAndMonth(
                        localId, today.getYear(), today.getMonthValue())
        );
    }

    public Page<CanjeResponse> getCanjes(User localUser, UUID localId, int page) {
        assertOwnership(localUser, localId);
        return cuponRepository.findByLocal_IdAndStatusOrderByValidatedAtDesc(
                        localId, CuponStatus.VALIDADO, PageRequest.of(page, 20))
                .map(this::toCanjeResponse);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    public LocalResponse adminCreateLocal(LocalRequest request) {
        User owner = userRepository.findById(request.ownerId())
                .orElseThrow(() -> new AppException("Usuario no encontrado", HttpStatus.NOT_FOUND));

        Local local = Local.builder()
                .name(request.name())
                .address(request.address())
                .logoUrl(request.logoUrl())
                .cartaUrl(request.cartaUrl())
                .category(request.category())
                .owner(owner)
                .latitude(request.latitude())
                .longitude(request.longitude())
                .build();
        syncOwnerLocation(owner, request.latitude(), request.longitude());
        return toResponse(localRepository.save(local));
    }

    public LocalResponse adminUpdateLocal(UUID localId, LocalRequest request) {
        Local local = findLocalOrThrow(localId);
        local.setName(request.name());
        local.setAddress(request.address());
        local.setLogoUrl(request.logoUrl());
        local.setCartaUrl(request.cartaUrl());
        local.setCategory(request.category());
        local.setLatitude(request.latitude());
        local.setLongitude(request.longitude());

        User owner = local.getOwner();
        if (!owner.getId().equals(request.ownerId())) {
            owner = userRepository.findById(request.ownerId())
                    .orElseThrow(() -> new AppException("Usuario no encontrado", HttpStatus.NOT_FOUND));
            local.setOwner(owner);
        }
        syncOwnerLocation(owner, request.latitude(), request.longitude());
        return toResponse(localRepository.save(local));
    }

    // Los libros de punto seguro heredan la geolocalización del owner del Local (cuenta
    // ROLE_LOCAL), para que el feed los ordene/filtre por distancia sin tocar sus queries.
    private void syncOwnerLocation(User owner, Double latitude, Double longitude) {
        if (latitude == null || longitude == null) return;
        owner.setLatitude(latitude);
        owner.setLongitude(longitude);
        userRepository.save(owner);
    }

    public void adminDeleteLocal(UUID localId) {
        Local local = findLocalOrThrow(localId);
        local.setActive(false);
        localRepository.save(local);
    }

    public PromocionResponse adminCreatePromocion(UUID localId, PromocionRequest request) {
        Local local = findLocalOrThrow(localId);
        Promocion promo = Promocion.builder()
                .local(local)
                .description(request.description())
                .build();
        return toPromocionResponse(promocionRepository.save(promo));
    }

    public PromocionResponse adminUpdatePromocion(UUID localId, UUID promocionId,
                                                   PromocionRequest request) {
        Promocion promo = promocionRepository.findByIdAndLocal_Id(promocionId, localId)
                .orElseThrow(() -> new AppException("Promoción no encontrada", HttpStatus.NOT_FOUND));
        promo.setDescription(request.description());
        return toPromocionResponse(promocionRepository.save(promo));
    }

    public void adminDeletePromocion(UUID localId, UUID promocionId) {
        Promocion promo = promocionRepository.findByIdAndLocal_Id(promocionId, localId)
                .orElseThrow(() -> new AppException("Promoción no encontrada", HttpStatus.NOT_FOUND));
        promo.setActive(false);
        promocionRepository.save(promo);
    }

    public User adminCreateLocalUser(CreateLocalUserRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new AppException("Ya existe un usuario con ese email", HttpStatus.CONFLICT);
        }
        User user = User.builder()
                .email(request.email())
                .name(request.name())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.LOCAL)
                .emailVerified(true)
                .build();
        return userRepository.save(user);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private String generateUniqueCode() {
        byte[] bytes = new byte[3];
        for (int i = 0; i < 10; i++) {
            RNG.nextBytes(bytes);
            String code = HexFormat.of().formatHex(bytes).substring(0, 5).toUpperCase();
            if (!cuponRepository.existsByCode(code)) return code;
        }
        throw new AppException("No se pudo generar un código único", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private Local findLocalOrThrow(UUID id) {
        return localRepository.findById(id)
                .orElseThrow(() -> new AppException("Local no encontrado", HttpStatus.NOT_FOUND));
    }

    private void assertOwnership(User user, UUID localId) {
        localRepository.findByIdAndOwner_Id(localId, user.getId())
                .orElseThrow(() -> new AppException(
                        "No tenés permiso para acceder a este local", HttpStatus.FORBIDDEN));
    }

    private LocalResponse toResponse(Local local) {
        List<PromocionResponse> promos = local.getPromociones().stream()
                .filter(Promocion::isActive)
                .map(this::toPromocionResponse)
                .toList();
        return new LocalResponse(
                local.getId(),
                local.getName(),
                local.getAddress(),
                local.getLogoUrl(),
                local.getCartaUrl(),
                local.getCategory(),
                local.getOwner().getId(),
                local.getOwner().getName(),
                promos,
                local.getLatitude(),
                local.getLongitude()
        );
    }

    private PromocionResponse toPromocionResponse(Promocion p) {
        return new PromocionResponse(p.getId(), p.getDescription(), p.isActive());
    }

    private CanjeResponse toCanjeResponse(Cupon c) {
        return new CanjeResponse(
                c.getId(),
                c.getCode(),
                c.getLocal().getName(),
                c.getPromocion().getDescription(),
                c.getStatus(),
                c.getCreatedAt(),
                c.getExpiresAt(),
                c.getValidatedAt()
        );
    }
}
