package com.chessy.chess_backend.controller.socketio.challenge;

import com.chessy.chess_backend.controller.socketio.challenge.event.ChallengeAcceptedEvent;
import com.chessy.chess_backend.controller.socketio.challenge.event.ChallengeEndedEvent;
import com.chessy.chess_backend.controller.socketio.challenge.event.ChallengeReceivedEvent;
import com.chessy.chess_backend.controller.socketio.challenge.payload.RespondChallengePayload;
import com.chessy.chess_backend.controller.socketio.challenge.payload.SendChallengePayload;
import com.chessy.chess_backend.dto.CreateGameResponseDto;
import com.chessy.chess_backend.service.GameService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnEvent;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ChallengeSocketController {

    private final SocketIOServer server;
    private final ChallengeService challengeService;
    private final GameService gameService;

    public ChallengeSocketController(SocketIOServer server, ChallengeService challengeService, GameService gameService) {
        this.server = server;
        this.challengeService = challengeService;
        this.gameService = gameService;

    }

    @PostConstruct
    public void init() {
        server.addListeners(this);
    }

    @OnEvent("challenge:send")
    public void onSendChallenge(SocketIOClient client, SendChallengePayload payload) {
        UUID challengerId = resolveUserId(client);
        UUID challengedId = UUID.fromString(payload.getChallengedUserId());

        if (challengerId.equals(challengedId)) {
            client.sendEvent("challenge:error", "You can't challenge yourself");
            return;
        }

        // CHECK: Ensure challenger isn't already in an active game
        if (gameService.hasActiveGame(challengerId)) {
            client.sendEvent("challenge:error", "You are already in an active game");
            return;
        }

        // CHECK: Ensure challenged player isn't already in an active game
        if (gameService.hasActiveGame(challengedId)) {
            client.sendEvent("challenge:error", "The challenged user is already in an active game");
            return;
        }

        Challenge challenge = challengeService.create(
                challengerId,
                challengedId,
                (oldChallenge, reason) -> notifyEnded(oldChallenge, reason),
                (expiredChallenge, reason) -> notifyEnded(expiredChallenge, reason)
        );

        server.getRoomOperations("user:" + challengedId).sendEvent(
                "challenge:received",
                new ChallengeReceivedEvent(
                        challenge.getId().toString(),
                        challengerId.toString(),
                        challenge.getExpiresAt().toEpochMilli()
                )
        );
    }

    @OnEvent("challenge:accept")
    public void onAcceptChallenge(SocketIOClient client, RespondChallengePayload payload) {
        UUID challengeId = UUID.fromString(payload.getChallengeId());
        Challenge challenge = challengeService.get(challengeId);

        if (challenge == null || challenge.isExpired()) {
            client.sendEvent("challenge:error", "Challenge no longer valid");
            return;
        }

        UUID responderId = resolveUserId(client);
        if (!responderId.equals(challenge.getChallengedId())) {
            client.sendEvent("challenge:error", "Not your challenge to accept");
            return;
        }

        challengeService.remove(challengeId);

        String gameId;
        CreateGameResponseDto game = gameService.createGame();
        gameId = game.getGameId().toString();

        ChallengeAcceptedEvent event = new ChallengeAcceptedEvent(challengeId.toString(), gameId);
        server.getRoomOperations("user:" + challenge.getChallengerId()).sendEvent("challenge:accepted", event);
        server.getRoomOperations("user:" + challenge.getChallengedId()).sendEvent("challenge:accepted", event);
    }

    @OnEvent("challenge:decline")
    public void onDeclineChallenge(SocketIOClient client, RespondChallengePayload payload) {
        UUID challengeId = UUID.fromString(payload.getChallengeId());
        Challenge challenge = challengeService.get(challengeId);

        if (challenge == null) return;

        challengeService.remove(challengeId);
        notifyEnded(challenge, "declined");
    }

    @OnEvent("challenge:cancel")
    public void onCancelChallenge(SocketIOClient client, RespondChallengePayload payload) {
        UUID challengeId = UUID.fromString(payload.getChallengeId());
        Challenge challenge = challengeService.get(challengeId);

        if (challenge == null) return;

        UUID requesterId = resolveUserId(client);
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

    private UUID resolveUserId(SocketIOClient client) {
        return UUID.fromString(client.get("userId"));
    }
}