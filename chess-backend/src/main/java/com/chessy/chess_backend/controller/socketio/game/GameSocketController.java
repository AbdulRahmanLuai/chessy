package com.chessy.chess_backend.controller.socketio.game;

import com.chessy.chess_backend.controller.socketio.game.event.*;
import com.chessy.chess_backend.controller.socketio.game.payload.GameActionPayload;
import com.chessy.chess_backend.controller.socketio.game.payload.JoinGamePayload;
import com.chessy.chess_backend.controller.socketio.game.payload.LeaveGamePayload;
import com.chessy.chess_backend.controller.socketio.game.payload.MovePayload;
import com.chessy.chess_backend.dto.GameDto;
import com.chessy.chess_backend.dto.GameEndResult;
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

    //TODO: consider joining room with GameID?
    //TODO: create schedular to kill games with expired timers.
    //TODO: avoid roundtrips to db for extracting player ids.
    //TODO: handle race condition issues.


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

        UUID gameId = UUID.fromString(payload.getGameId());
        if (!validateParticipantOrError(client, gameId, userId)) return;

        // TODO: avoid round trip, validateActiveParticipant could return player IDs directly
        PlayerIds players = getPlayerIds(gameId);

        UserJoinedEvent event = new UserJoinedEvent(gameId.toString(), userId.toString());
        sendToPlayers(players, "game:userJoined", event);
    }

    @OnEvent("game:leave")
    public void onLeaveGame(SocketIOClient client, LeaveGamePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        if (!validateParticipantOrError(client, gameId, userId)) return;

        // TODO: avoid round trip, validateActiveParticipant could return player IDs directly
        PlayerIds players = getPlayerIds(gameId);

        UserLeftEvent event = new UserLeftEvent(gameId.toString(), userId.toString());
        sendToPlayers(players, "game:userLeft", event);
    }

    @OnEvent("game:move")
    public void onMove(SocketIOClient client, MovePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        GameMoveResult result;
        try {
            result = gameService.applyMove(gameId, userId, payload);
        } catch (GameTimedOutException e) {
            handleTimeout(client, e);
            return;
        } catch (GameNotFoundException | IllegalMoveException | MoveNotationException | NotYourTurnException |
                 NotAParticipantException | IllegalGameStateException e) {
            client.sendEvent("game:error", e.getMessage());
            return;
        }

        PlayerIds players = getPlayerIds(result.getGame());

        sendToPlayers(players, "game:moveApplied", result.getMoveEvent());
        System.out.println("fired moveApplied Event: " + result.getMoveEvent());
        if (result.getEndResult() != null) {
            sendToPlayers(players, "game:ended", result.getEndResult());
        }
    }

    @OnEvent("game:resign")
    public void onResign(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        GameEndResult endResult;
        try {
            endResult = gameService.resignGame(gameId, userId);
        } catch (GameTimedOutException e) {
            handleTimeout(client, e);
            return;
        } catch (GameNotFoundException | NotAParticipantException | IllegalGameStateException e) {
            client.sendEvent("game:error", e.getMessage());
            return;
        }

        // TODO: avoid round trip, resignGame could return player IDs directly
        PlayerIds players = getPlayerIds(gameId);

        GameEndedEvent event = toGameEndedEvent(endResult);
        sendToPlayers(players, "game:ended", event);
    }

    @OnEvent("game:abort")
    public void onAbort(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        GameEndResult endResult;
        try {
            endResult = gameService.abortGame(gameId, userId);
        } catch (GameTimedOutException e) {
            handleTimeout(client, e);
            return;
        } catch (GameNotFoundException | NotAParticipantException | IllegalGameStateException e) {
            client.sendEvent("game:error", e.getMessage());
            return;
        }

        // TODO: avoid round trip, abortGame could return player IDs directly
        PlayerIds players = getPlayerIds(gameId);

        GameEndedEvent event = toGameEndedEvent(endResult);
        sendToPlayers(players, "game:ended", event);
    }

    @OnEvent("game:offerDraw")
    public void onOfferDraw(SocketIOClient client, GameActionPayload payload) {
        System.out.println("OfferDraw received by server");
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        if (!validateParticipantOrError(client, gameId, userId)) return;

        // TODO: avoid round trip, validateActiveParticipant could return player IDs directly
        gameService.offerDraw(gameId, userId);
        PlayerIds players = getPlayerIds(gameId);

        DrawOfferedEvent event = new DrawOfferedEvent(userId.toString());
        sendToPlayers(players, "game:drawOffered", event);
    }

    @OnEvent("game:acceptDraw")
    public void onAcceptDraw(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        GameEndResult endResult;
        try {
            endResult = gameService.acceptDraw(gameId, userId);
        } catch (GameTimedOutException e) {
            handleTimeout(client, e);
            return;
        } catch (GameNotFoundException | NotAParticipantException | IllegalGameStateException e) {
            client.sendEvent("game:error", e.getMessage());
            return;
        }

        // TODO: avoid round trip, acceptDraw could return player IDs directly
        PlayerIds players = getPlayerIds(gameId);

        GameIdEvent acceptedEvent = new GameIdEvent(gameId.toString());
        GameEndedEvent endedEvent = new GameEndedEvent(
                gameId.toString(),
                endResult.getResult(),
                endResult.getWinner() == null ? "DRAW" : endResult.getWinner().toString(),
                endResult.getResultReason().toString()
        );

        sendToPlayers(players, "game:drawAccepted", acceptedEvent);
        sendToPlayers(players, "game:ended", endedEvent);
    }

    @OnEvent("game:declineDraw")
    public void onDeclineDraw(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        if (!validateParticipantOrError(client, gameId, userId)) return;

        gameService.declineDraw(gameId, userId);
        // TODO: avoid round trip, validateActiveParticipant could return player IDs directly
        PlayerIds players = getPlayerIds(gameId);

        GameIdEvent event = new GameIdEvent(gameId.toString());
        sendToPlayers(players, "game:declineDraw", event);
    }

    private UUID requireAuth(SocketIOClient client) {
        UUID userId = client.get("userId");
        if (userId == null) {
            client.sendEvent("game:error", "Not authenticated");
        }
        return userId;
    }


    private boolean validateParticipantOrError(SocketIOClient client, UUID gameId, UUID userId) {
        try {
            gameService.validateActiveParticipant(gameId, userId);
            return true;
        } catch (GameTimedOutException e) {
            handleTimeout(client, e);
            return false;
        } catch (GameNotFoundException | NotAParticipantException | IllegalGameStateException e) {
            client.sendEvent("game:error", e.getMessage());
            return false;
        }
    }

    private void handleTimeout(SocketIOClient client, GameTimedOutException e) {
        client.sendEvent("game:error", e.getMessage());

        GameEndResult endResult = e.getEndResult();
        PlayerIds players = getPlayerIds(endResult.getGameId());
        GameEndedEvent event = toGameEndedEvent(endResult);
        sendToPlayers(players, "game:ended", event);
    }

    private GameEndedEvent toGameEndedEvent(GameEndResult endResult) {
        return new GameEndedEvent(
                endResult.getGameId().toString(),
                endResult.getResult(),
                endResult.getWinner() == null ? null : endResult.getWinner().toString(),
                endResult.getResultReason().toString()
        );
    }

    private record PlayerIds(UUID white, UUID black) {}

    private PlayerIds getPlayerIds(GameDto game) {
        return new PlayerIds(game.getWhitePlayer().getId(), game.getBlackPlayer().getId());
    }

    private PlayerIds getPlayerIds(UUID gameId) {
        return getPlayerIds(gameService.getGame(gameId));
    }


    private void sendToPlayers(PlayerIds players, String eventName, Object event) {
        server.getRoomOperations("user:" + players.white().toString()).sendEvent(eventName, event);
        server.getRoomOperations("user:" + players.black().toString()).sendEvent(eventName, event);
    }

}