package com.chessy.chess_backend;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for all integration tests.
 *
 * The PostgreSQL container is declared `static` so it is started once for the
 * entire test suite and reused across every subclass — keeping the suite fast.
 *
 * @ServiceConnection tells Spring Boot to read the JDBC URL, username, and
 * password directly from the running container, so no manual property wiring
 * is needed.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
public abstract class PostgresTestBase {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("chessy_test")
                    .withUsername("chessy")
                    .withPassword("chessy");
}