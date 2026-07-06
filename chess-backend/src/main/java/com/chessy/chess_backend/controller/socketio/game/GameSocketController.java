package com.chessy.chess_backend.controller.socketio.game;

import com.chessy.chess_backend.controller.socketio.game.event.*;
import com.chessy.chess_backend.controller.socketio.game.payload.GameActionPayload;
import com.chessy.chess_backend.controller.socketio.game.payload.JoinGamePayload;
import com.chessy.chess_backend.controller.socketio.game.payload.LeaveGamePayload;
import com.chessy.chess_backend.controller.socketio.game.payload.MovePayload;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class GameSocketController {

    private final SocketIOServer server;

    public GameSocketController(SocketIOServer server) {
        this.server = server;
    }

    @PostConstruct
    public void init() {
        server.addListeners(this);
    }

    @OnConnect
    public void onConnect(SocketIOClient client) {
        System.out.println("Connected: " + client.getSessionId());
    }

    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        System.out.println("Disconnected: " + client.getSessionId());
    }

    @OnEvent("game:join")
    public void onJoinGame(SocketIOClient client, JoinGamePayload payload) {
        String gameId = payload.getGameId();
        client.joinRoom(gameId);

        // TODO: load game state from DB/service
        String fen = "startpos"; // placeholder
        long whiteTimeRemainingMs = 0;
        long blackTimeRemainingMs = 0;

        client.sendEvent("game:loaded",
                new GameLoadedEvent(fen, whiteTimeRemainingMs, blackTimeRemainingMs));
    }

    @OnEvent("game:leave")
    public void onLeaveGame(SocketIOClient client, LeaveGamePayload payload) {
        client.leaveRoom(payload.getGameId());
    }

    @OnEvent("game:move")
    public void onMove(SocketIOClient client, MovePayload payload) {
        String gameId = payload.getGameId();

        // TODO: validate move against game state/engine
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
        String gameId = payload.getGameId();

        // TODO: determine winner based on who resigned, persist result
        String result = "..."; // e.g. "0-1" or "1-0"

        server.getRoomOperations(gameId)
                .sendEvent("game:ended", new GameEndedEvent(gameId, result, "resignation"));
    }

    @OnEvent("game:abort")
    public void onAbort(SocketIOClient client, GameActionPayload payload) {
        String gameId = payload.getGameId();

        // TODO: only allow abort under certain conditions (e.g. before move 1)
        server.getRoomOperations(gameId)
                .sendEvent("game:ended", new GameEndedEvent(gameId, "aborted", "abort"));
    }

    @OnEvent("game:offerDraw")
    public void onOfferDraw(SocketIOClient client, GameActionPayload payload) {
        String gameId = payload.getGameId();

        // TODO: resolve the offering user's ID from session/auth
        String byUserId = "..."; // placeholder

        server.getRoomOperations(gameId)
                .sendEvent("game:drawOffered", new DrawOfferedEvent(byUserId));
    }

    @OnEvent("game:acceptDraw")
    public void onAcceptDraw(SocketIOClient client, GameActionPayload payload) {
        String gameId = payload.getGameId();

        // TODO: persist draw result
        server.getRoomOperations(gameId)
                .sendEvent("game:drawAccepted", new GameIdEvent(gameId));

        server.getRoomOperations(gameId)
                .sendEvent("game:ended", new GameEndedEvent(gameId, "1/2-1/2", "draw agreed"));
    }

    @OnEvent("game:declineDraw")
    public void onDeclineDraw(SocketIOClient client, GameActionPayload payload) {
        String gameId = payload.getGameId();

        server.getRoomOperations(gameId)
                .sendEvent("game:declineDraw", new GameIdEvent(gameId));
    }
}
