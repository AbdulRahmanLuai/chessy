package com.chessy.chess_backend.controller.socketio.computerGame;

import com.chessy.chess_backend.model.enums.computerGame.EngineType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class ChessEngineFactory {

    private final Map<EngineType, ChessEngine> enginesByType;

    // Spring injects every ChessEngine bean here automatically.
    public ChessEngineFactory(List<ChessEngine> engines) {
        this.enginesByType = engines.stream()
                .collect(Collectors.toMap(ChessEngine::getType, Function.identity()));
    }

    public ChessEngine getEngine(EngineType type) {
        ChessEngine engine = enginesByType.get(type);
        if (engine == null) {
            throw new IllegalArgumentException("No ChessEngine registered for type: " + type);
        }
        return engine;
    }
}
