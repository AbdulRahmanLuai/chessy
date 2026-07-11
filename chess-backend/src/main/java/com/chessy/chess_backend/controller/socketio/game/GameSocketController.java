package com.chessy.chess_backend.controller.socketio.game;

import com.chessy.chess_backend.controller.socketio.game.event.*;
import com.chessy.chess_backend.controller.socketio.game.payload.GameActionPayload;
import com.chessy.chess_backend.controller.socketio.game.payload.JoinGamePayload;
import com.chessy.chess_backend.controller.socketio.game.payload.LeaveGamePayload;
import com.chessy.chess_backend.controller.socketio.game.payload.MovePayload;
import com.chessy.chess_backend.dto.GameDto;
import com.chessy.chess_backend.dto.GameMoveResult;
import com.chessy.chess_backend.dto.MoveDto;
import com.chessy.chess_backend.entity.Game;
import com.chessy.chess_backend.exception.*;
import com.chessy.chess_backend.service.GameService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;


import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Component
public class GameSocketController {

    //TODO: broadcast to users not gameID
    //TODO: complete resign/draw..etc methods
    //TODO: consider joining room with GameID?
    //TODO: create schedular to kill games with expired timers
    

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
        // used to show other user if user is connected? TODO
    }

    @OnEvent("game:move")
    public void onMove(SocketIOClient client, MovePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        GameMoveResult result;
        try {
            result = gameService.applyMove(gameId, userId, payload);
        } catch (GameNotFoundException | IllegalMoveException | MoveNotationException | NotYourTurnException |
                 NotAParticipantException | IllegalGameStateException e) {
            client.sendEvent("game:error", e.getMessage());
            return;
        }


        UUID whitePlayerId = result.getGame().getWhitePlayer().getId();
        UUID blackPlayerId = result.getGame().getBlackPlayer().getId();


        server.getRoomOperations("user:" + whitePlayerId.toString()).sendEvent("game:moveApplied", result.getMoveEvent());
        server.getRoomOperations("user:" + blackPlayerId.toString()).sendEvent("game:moveApplied", result.getMoveEvent());
        System.out.println("fired moveApplied Event: " + result.getMoveEvent());
        if (result.getEndResult() != null) {
            server.getRoomOperations("user:" + whitePlayerId.toString()).sendEvent("game:ended", result.getEndResult());
            server.getRoomOperations("user:" + blackPlayerId.toString()).sendEvent("game:ended", result.getEndResult());
        }
    }

    @OnEvent("game:leave")
    public void onLeaveGame(SocketIOClient client, LeaveGamePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        client.leaveRoom(payload.getGameId());
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