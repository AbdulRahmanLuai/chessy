package com.chessy.chess_backend.controller.socketio.game;

import com.chessy.chess_backend.controller.socketio.game.event.*;
import com.chessy.chess_backend.controller.socketio.game.payload.GameActionPayload;
import com.chessy.chess_backend.controller.socketio.game.payload.JoinGamePayload;
import com.chessy.chess_backend.controller.socketio.game.payload.LeaveGamePayload;
import com.chessy.chess_backend.controller.socketio.game.payload.MovePayload;
import com.chessy.chess_backend.dto.GameDto;
import com.chessy.chess_backend.entity.Game;
import com.chessy.chess_backend.service.GameService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class GameSocketController {

    private final SocketIOServer server;
    private final GameService gameService;

    public GameSocketController(SocketIOServer server, GameService gameService) {
        this.server = server;
        this.gameService = gameService;
    }

    @PostConstruct
    public void init() {
        server.addListeners(this);
    }


    @OnEvent("game:join")
    public void onJoinGame(SocketIOClient client, JoinGamePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        String gameId = payload.getGameId();
        client.joinRoom(gameId);

        GameDto startedGame = gameService.startGame(UUID.fromString(gameId));

        client.sendEvent("game:loaded",
                new GameLoadedEvent(startedGame.getCurrentFen(),
                        startedGame.getWhiteTimeRemainingMs(),
                        startedGame.getBlackTimeRemainingMs())
        );
    }

    @OnEvent("game:leave")
    public void onLeaveGame(SocketIOClient client, LeaveGamePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        client.leaveRoom(payload.getGameId());
    }

    @OnEvent("game:move")
    public void onMove(SocketIOClient client, MovePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        String gameId = payload.getGameId();

        // TODO: validate move against game state/engine, confirm userId is a player in this game and it's their turn
        boolean isValid = true; // placeholder

        if (!isValid) {
            client.sendEvent("game:error", "Illegal move");
            return;
        }

        // TODO: apply move, persist state, recompute clocks
        String newFen = "..."; // placeholder
        long whiteTimeRemainingMs = 0;
        long blackTimeRemainingMs = 0;

        MoveAppliedEvent event = new MoveAppliedEvent(
                gameId,
                new MoveAppliedEvent.MoveDetail(payload.getFrom(), payload.getTo(), payload.getPromotion()),
                newFen,
                whiteTimeRemainingMs,
                blackTimeRemainingMs
        );

        server.getRoomOperations(gameId).sendEvent("game:moveApplied", event);

        // TODO: check for checkmate/stalemate/draw and emit game:ended if applicable
    }

    @OnEvent("game:resign")
    public void onResign(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        String gameId = payload.getGameId();

        // TODO: confirm userId is a player in this game; determine winner based on who resigned, persist result
        String result = "..."; // e.g. "0-1" or "1-0"

        server.getRoomOperations(gameId)
                .sendEvent("game:ended", new GameEndedEvent(gameId, result, "resignation"));
    }

    @OnEvent("game:abort")
    public void onAbort(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        String gameId = payload.getGameId();

        // TODO: confirm userId is a player in this game; only allow abort under certain conditions (e.g. before move 1)
        server.getRoomOperations(gameId)
                .sendEvent("game:ended", new GameEndedEvent(gameId, "aborted", "abort"));
    }

    @OnEvent("game:offerDraw")
    public void onOfferDraw(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        String gameId = payload.getGameId();

        server.getRoomOperations(gameId)
                .sendEvent("game:drawOffered", new DrawOfferedEvent(userId.toString()));
    }

    @OnEvent("game:acceptDraw")
    public void onAcceptDraw(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        String gameId = payload.getGameId();

        // TODO: confirm userId is a player in this game; persist draw result
        server.getRoomOperations(gameId)
                .sendEvent("game:drawAccepted", new GameIdEvent(gameId));

        server.getRoomOperations(gameId)
                .sendEvent("game:ended", new GameEndedEvent(gameId, "1/2-1/2", "draw agreed"));
    }

    @OnEvent("game:declineDraw")
    public void onDeclineDraw(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        String gameId = payload.getGameId();

        server.getRoomOperations(gameId)
                .sendEvent("game:declineDraw", new GameIdEvent(gameId));
    }

    private UUID requireAuth(SocketIOClient client) {
        UUID userId = client.get("userId");
        if (userId == null) {
            client.sendEvent("game:error", "Not authenticated");
        }
        return userId;
    }
}