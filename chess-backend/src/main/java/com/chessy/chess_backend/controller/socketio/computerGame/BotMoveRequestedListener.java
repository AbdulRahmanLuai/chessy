package com.chessy.chess_backend.controller.socketio.computerGame;

import com.chessy.chess_backend.controller.socketio.computerGame.payload.ComputerGameMovePayload;
import com.chessy.chess_backend.dto.computerGame.ComputerGameDto;
import com.chessy.chess_backend.dto.computerGame.ComputerGameMoveResult;
import com.chessy.chess_backend.dto.onlineGame.GameMoveResult;
import com.chessy.chess_backend.entity.ComputerGame;
import com.chessy.chess_backend.event.computerGame.BotMoveRequestedEvent;
import com.chessy.chess_backend.exception.*;
import com.chessy.chess_backend.model.enums.computerGame.EngineType;
import com.chessy.chess_backend.model.enums.computerGame.MoveSource;
import com.chessy.chess_backend.model.enums.computerGame.UserColor;
import com.chessy.chess_backend.model.enums.gameGeneral.GameStatus;
import com.chessy.chess_backend.service.ComputerGameService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;


@Component
public class BotMoveRequestedListener {

    private final ComputerGameService gameService;
    private final ChessEngineFactory engineFactory;
    private final ComputerGameEventBroadcaster broadcaster;

    public BotMoveRequestedListener(ComputerGameService gameService,
                                    ChessEngineFactory engineFactory,
                                    ComputerGameEventBroadcaster broadcaster) {
        this.gameService = gameService;
        this.engineFactory = engineFactory;
        this.broadcaster = broadcaster;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBotMoveRequested(BotMoveRequestedEvent event) {
        UUID gameId = event.getGameId();

        ComputerGameDto game = gameService.getGame(gameId);

        // Defensive check: guards against stale/duplicate events, or the
        // game having ended/been resigned/etc. between publish and consume.
        if (!isBotMove(game) || !inProgress(game)) {
            return;
        }

        System.out.println("Bot move requested for game with id" + gameId);


        ComputerGameMoveResult result;
        try {
            ChessEngine engine = engineFactory.getEngine(EngineType.valueOf(game.getEngine()));
            ComputerGameMovePayload botMove = engine.computeMove(game.getCurrentFen(), game.getMoves(), game.getDifficulty());
            botMove.setGameId(String.valueOf(gameId));

            result = gameService.applyMove(gameId, game.getUserId(), botMove, MoveSource.COMPUTER);
        } catch (ComputerGameTimedOutException e) {
            broadcaster.broadcastTimeout(gameId, e);
            return;
        } catch (GameNotFoundException | IllegalMoveException | MoveNotationException | NotYourTurnException |
                 NotAParticipantException | IllegalGameStateException | GameConcurrentModificationException e) {
            broadcaster.broadcastFailure(gameId, new BotMoveFailedException(gameId, "The bot failed to make a move.", e));
            return;
        } catch (Exception e) {
            broadcaster.broadcastFailure(gameId, new BotMoveFailedException(gameId, e.getMessage(), e));
            return;
        }

        broadcaster.broadcastMoveApplied(result);
    }

    private boolean isBotMove(ComputerGameDto game) {
        UserColor black = UserColor.BLACK;
        boolean botIsWhite = black.equals(game.getUserColor());
        int numberOfMoves = game.getMoves().size();

        return botIsWhite
                ? numberOfMoves % 2 == 0
                : numberOfMoves % 2 == 1;
    }

    private boolean inProgress(ComputerGameDto game){
        return game.getStatus().equals(GameStatus.IN_PROGRESS);
    }
}