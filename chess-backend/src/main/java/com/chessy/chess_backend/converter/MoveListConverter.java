package com.chessy.chess_backend.converter;

import com.chessy.chess_backend.model.Move;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import java.util.List;

@Converter
public class MoveListConverter implements AttributeConverter<List<Move>, String> {
    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<Move> attribute) {
        if (attribute == null) return null;
        try {
            return mapper.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public List<Move> convertToEntityAttribute(String dbData) {
        if (dbData == null) return Collections.emptyList();
        try {
            return mapper.readValue(dbData, new TypeReference<List<Move>>() {});
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}