package com.chessy.chess_backend.controller.socketio.challenge;

import com.chessy.chess_backend.controller.socketio.challenge.event.ChallengeAcceptedEvent;
import com.chessy.chess_backend.controller.socketio.challenge.event.ChallengeEndedEvent;
import com.chessy.chess_backend.controller.socketio.challenge.event.ChallengeReceivedEvent;
import com.chessy.chess_backend.controller.socketio.challenge.event.ChallengeSentEvent;
import com.chessy.chess_backend.controller.socketio.challenge.payload.RespondChallengePayload;
import com.chessy.chess_backend.controller.socketio.challenge.payload.SendChallengePayload;
import com.chessy.chess_backend.dto.onlineGame.CreateGameResponseDto;
import com.chessy.chess_backend.entity.User;
import com.chessy.chess_backend.event.auth.SocketAuthenticatedEvent;
import com.chessy.chess_backend.repository.UserRepository;
import com.chessy.chess_backend.service.GameService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnEvent;
import jakarta.annotation.PostConstruct;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class ChallengeSocketController {

    private final SocketIOServer server;
    private final ChallengeService challengeService;
    private final GameService gameService;
    private final UserRepository userRepository;

    public ChallengeSocketController(SocketIOServer server, ChallengeService challengeService,
                                     GameService gameService, UserRepository userRepository) {
        this.server = server;
        this.challengeService = challengeService;
        this.gameService = gameService;
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void init() {
        server.addListeners(this);
    }


    @EventListener
    public void onAuthenticated(SocketAuthenticatedEvent event) {
        deliverPendingChallenges(event.getClient(), event.getUserId());
    }

    @OnEvent("challenge:send")
    public void onSendChallenge(SocketIOClient client, SendChallengePayload payload) {
        UUID challengerId = requireAuth(client);
        if (challengerId == null) return;

        UUID challengedId = UUID.fromString(payload.getChallengedUserId());

        if (challengerId.equals(challengedId)) {
            client.sendEvent("challenge:error", "You can't challenge yourself");
            return;
        }

        if (gameService.hasActiveGame(challengerId)) {
            client.sendEvent("challenge:error", "You are already in an active game");
            return;
        }

        if (gameService.hasActiveGame(challengedId)) {
            client.sendEvent("challenge:error", "The challenged user is already in an active game");
            return;
        }

        Challenge challenge = challengeService.create(
                challengerId,
                challengedId,
                payload.getPreferredColor(),
                payload.getTimeLimitSeconds(),
                payload.getIncrementSeconds(),
                (oldChallenge, reason) -> notifyEnded(oldChallenge, reason),
                (expiredChallenge, reason) -> notifyEnded(expiredChallenge, reason)
        );

        server.getRoomOperations("user:" + challengerId).sendEvent("challenge:sent", new ChallengeSentEvent(
                challenge.getId().toString(),
                challengedId.toString(),
                challenge.getPreferredColor(),
                challenge.getExpiresAt().toEpochMilli()
        ));

        User challenger = userRepository.findById(challengerId)
                .orElseThrow(() -> new RuntimeException("User not found: " + challengerId));


        System.out.println(
                "Emitting challenge:received -> toUser=" +
                        challenge.getChallengedId() +
                        ", challengeId=" +
                        challenge.getId()
        );
        server.getRoomOperations("user:" + challengedId).sendEvent(
                "challenge:received",
                new ChallengeReceivedEvent(
                        challenge.getId().toString(),
                        challengerId.toString(),
                        challenger.getUsername(),
                        challenger.getDisplayName(),
                        invertColor(challenge.getPreferredColor()),
                        challenge.getExpiresAt().toEpochMilli()
                )
        );
    }


    @OnEvent("challenge:accept")
    public void onAcceptChallenge(SocketIOClient client, RespondChallengePayload payload) {
        UUID responderId = requireAuth(client);
        if (responderId == null) return;

        UUID challengeId = UUID.fromString(payload.getChallengeId());
        Challenge challenge = challengeService.get(challengeId);

        if (challenge == null || challenge.isExpired()) {
            client.sendEvent("challenge:error", "Challenge no longer valid");
            return;
        }

        if (!responderId.equals(challenge.getChallengedId())) {
            client.sendEvent("challenge:error", "Not your challenge to accept");
            return;
        }

        // Re-check active-game status right before committing — up to TTL_SECONDS
        // could have passed since the challenge was created.
        if (gameService.hasActiveGame(challenge.getChallengerId())) {
            client.sendEvent("challenge:error", "Challenger is already in an active game");
            return;
        }
        if (gameService.hasActiveGame(challenge.getChallengedId())) {
            client.sendEvent("challenge:error", "You are already in an active game");
            return;
        }

        // Atomic claim — only one concurrent accept can win this
        Challenge claimed = challengeService.removeIfPresent(challengeId);
        if (claimed == null) {
            client.sendEvent("challenge:error", "Challenge already handled");
            return;
        }

        UUID whiteId;
        UUID blackId;
        String color = claimed.getPreferredColor();

        if ("WHITE".equals(color)) {
            whiteId = claimed.getChallengerId();
            blackId = claimed.getChallengedId();
        } else if ("BLACK".equals(color)) {
            whiteId = claimed.getChallengedId();
            blackId = claimed.getChallengerId();
        } else {
            boolean challengerIsWhite = Math.random() < 0.5;
            whiteId = challengerIsWhite ? claimed.getChallengerId() : claimed.getChallengedId();
            blackId = challengerIsWhite ? claimed.getChallengedId() : claimed.getChallengerId();
        }

        CreateGameResponseDto game = gameService.createGame(
                whiteId,
                blackId,
                claimed.getTimeLimitSeconds(),
                claimed.getIncrementSeconds()
        );

        String gameId = game.getGameId().toString();

        ChallengeAcceptedEvent event = new ChallengeAcceptedEvent(claimed.getId().toString(), gameId);
        server.getRoomOperations("user:" + claimed.getChallengerId()).sendEvent("challenge:accepted", event);
        server.getRoomOperations("user:" + claimed.getChallengedId()).sendEvent("challenge:accepted", event);

        // Auto-cancel any other pending challenges either player was part of
        List<Challenge> cancelledForChallenger = challengeService.cancelOutgoingForUser(claimed.getChallengerId());
        List<Challenge> cancelledForChallenged = challengeService.cancelOutgoingForUser(claimed.getChallengedId());

        cancelledForChallenger.forEach(c -> notifyEnded(c, "cancelled"));
        cancelledForChallenged.forEach(c -> notifyEnded(c, "cancelled"));
    }

    @OnEvent("challenge:decline")
    public void onDeclineChallenge(SocketIOClient client, RespondChallengePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID challengeId = UUID.fromString(payload.getChallengeId());
        Challenge challenge = challengeService.get(challengeId);

        if (challenge == null) return;

        challengeService.remove(challengeId);
        notifyEnded(challenge, "declined");
    }

    @OnEvent("challenge:cancel")
    public void onCancelChallenge(SocketIOClient client, RespondChallengePayload payload) {
        UUID requesterId = requireAuth(client);
        if (requesterId == null) return;

        UUID challengeId = UUID.fromString(payload.getChallengeId());
        Challenge challenge = challengeService.get(challengeId);

        if (challenge == null) return;

        if (!requesterId.equals(challenge.getChallengerId())) {
            client.sendEvent("challenge:error", "Not your challenge to cancel");
            return;
        }

        challengeService.remove(challengeId);
        notifyEnded(challenge, "cancelled");
    }

    private void notifyEnded(Challenge challenge, String reason) {
        ChallengeEndedEvent event = new ChallengeEndedEvent(challenge.getId().toString(), reason);
        server.getRoomOperations("user:" + challenge.getChallengerId()).sendEvent("challenge:ended", event);
        server.getRoomOperations("user:" + challenge.getChallengedId()).sendEvent("challenge:ended", event);
    }

    private UUID requireAuth(SocketIOClient client) {
        UUID userId = client.get("userId");
        if (userId == null) {
            client.sendEvent("challenge:error", "Not authenticated");
        }
        return userId;
    }

    private void deliverPendingChallenges(SocketIOClient client, UUID userId) {
        challengeService.getPendingFor(userId).forEach(challenge -> {
            User challenger = userRepository.findById(challenge.getChallengerId())
                    .orElseThrow(() -> new RuntimeException("User not found: " + challenge.getChallengerId()));

            client.sendEvent("challenge:received", new ChallengeReceivedEvent(
                    challenge.getId().toString(),
                    challenge.getChallengerId().toString(),
                    challenger.getUsername(),
                    challenger.getDisplayName(),
                    invertColor(challenge.getPreferredColor()),
                    challenge.getExpiresAt().toEpochMilli()
            ));
        });
    }

    private String invertColor(String color) {
        if ("WHITE".equals(color)) return "BLACK";
        if ("BLACK".equals(color)) return "WHITE";
        return "RANDOM";
    }
}