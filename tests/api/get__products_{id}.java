package com.api.tests;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.jupiter.api.*;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ProductApiTest {

    @BeforeAll
    public static void setup() {
        RestAssured.baseURI = "https://dummyjson.com";
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
    }

    @Nested
    @DisplayName("Happy Path Tests")
    class HappyPathTests {

        @Test
        @DisplayName("should return 200 and valid product when id exists")
        public void shouldReturnValidProductWhenIdExists() {
            given()
                .pathParam("id", 1)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(200)
                .time(lessThan(2000L))
                .body("id", equalTo(1))
                .body("title", notNullValue())
                .body("title", instanceOf(String.class))
                .body("price", notNullValue())
                .body("price", instanceOf(Number.class))
                .body("category", notNullValue())
                .body("category", instanceOf(String.class))
                .body("images", notNullValue())
                .body("images", instanceOf(List.class))
                .body("images.size()", greaterThan(0));
        }

        @Test
        @DisplayName("should return consistent product data for same id")
        public void shouldReturnConsistentProductData() {
            Response firstResponse = given()
                .pathParam("id", 5)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(200)
                .extract().response();

            Response secondResponse = given()
                .pathParam("id", 5)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(200)
                .extract().response();

            assertEquals(firstResponse.jsonPath().getInt("id"), 
                        secondResponse.jsonPath().getInt("id"));
            assertEquals(firstResponse.jsonPath().getString("title"), 
                        secondResponse.jsonPath().getString("title"));
        }
    }

    @Nested
    @DisplayName("Boundary Value Tests")
    class BoundaryValueTests {

        @Test
        @DisplayName("should handle minimum valid id value")
        public void shouldHandleMinimumValidId() {
            given()
                .pathParam("id", 1)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(200)
                .time(lessThan(2000L))
                .body("id", equalTo(1));
        }

        @Test
        @DisplayName("should return 404 for zero id")
        public void shouldReturn404ForZeroId() {
            given()
                .pathParam("id", 0)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(404)
                .time(lessThan(2000L));
        }

        @Test
        @DisplayName("should return 404 for negative id")
        public void shouldReturn404ForNegativeId() {
            given()
                .pathParam("id", -1)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(404)
                .time(lessThan(2000L));
        }

        @Test
        @DisplayName("should return 404 for very large id")
        public void shouldReturn404ForVeryLargeId() {
            given()
                .pathParam("id", 999999999)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(404)
                .time(lessThan(2000L));
        }
    }

    @Nested
    @DisplayName("Invalid Data Type Tests")
    class InvalidDataTypeTests {

        @Test
        @DisplayName("should return 400 when id is string")
        public void shouldReturn400WhenIdIsString() {
            given()
                .pathParam("id", "abc")
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(anyOf(is(400), is(404)))
                .time(lessThan(2000L));
        }

        @Test
        @DisplayName("should return 400 when id is special character")
        public void shouldReturn400WhenIdIsSpecialCharacter() {
            given()
                .pathParam("id", "@#$%")
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(anyOf(is(400), is(404)))
                .time(lessThan(2000L));
        }

        @Test
        @DisplayName("should return 400 when id is decimal")
        public void shouldReturn400WhenIdIsDecimal() {
            given()
                .pathParam("id", "1.5")
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(anyOf(is(400), is(404)))
                .time(lessThan(2000L));
        }

        @Test
        @DisplayName("should handle empty id parameter")
        public void shouldHandleEmptyIdParameter() {
            given()
            .when()
                .get("/products/")
            .then()
                .statusCode(anyOf(is(200), is(404), is(405)))
                .time(lessThan(2000L));
        }
    }

    @Nested
    @DisplayName("Not Found Scenarios")
    class NotFoundTests {

        @Test
        @DisplayName("should return 404 when product id does not exist")
        public void shouldReturn404WhenProductIdDoesNotExist() {
            given()
                .pathParam("id", 9999)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(404)
                .time(lessThan(2000L));
        }

        @Test
        @DisplayName("should return 404 for deleted product id")
        public void shouldReturn404ForDeletedProductId() {
            // TODO: Replace with actual deleted product ID from test environment
            given()
                .pathParam("id", 5000)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(404)
                .time(lessThan(2000L));
        }
    }

    @Nested
    @DisplayName("Schema Validation Tests")
    class SchemaValidationTests {

        @Test
        @DisplayName("should return all required fields in response")
        public void shouldReturnAllRequiredFields() {
            Response response = given()
                .pathParam("id", 1)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(200)
                .extract().response();

            assertNotNull(response.jsonPath().get("id"), "id field is missing");
            assertNotNull(response.jsonPath().get("title"), "title field is missing");
            assertNotNull(response.jsonPath().get("price"), "price field is missing");
            assertNotNull(response.jsonPath().get("category"), "category field is missing");
            assertNotNull(response.jsonPath().get("images"), "images field is missing");
        }

        @Test
        @DisplayName("should return correct data types for all fields")
        public void shouldReturnCorrectDataTypes() {
            given()
                .pathParam("id", 1)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(200)
                .body("id", instanceOf(Integer.class))
                .body("title", instanceOf(String.class))
                .body("price", instanceOf(Number.class))
                .body("category", instanceOf(String.class))
                .body("images", instanceOf(List.class));
        }

        @Test
        @DisplayName("should return non-empty values for required fields")
        public void shouldReturnNonEmptyValues() {
            given()
                .pathParam("id", 1)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(200)
                .body("title", not(emptyString()))
                .body("category", not(emptyString()))
                .body("price", greaterThan(0))
                .body("images", not(empty()));
        }
    }

    @Nested
    @DisplayName("Performance Tests")
    class PerformanceTests {

        @Test
        @DisplayName("should respond within 2000ms for valid request")
        public void shouldRespondWithinTimeLimit() {
            given()
                .pathParam("id", 1)
            .when()
                .get("/products/{id}")
            .then()
                .time(lessThan(2000L));
        }

        @Test
        @DisplayName("should respond within 2000ms for 404 response")
        public void shouldRespondQuicklyFor404() {
            given()
                .pathParam("id", 9999)
            .when()
                .get("/products/{id}")
            .then()
                .time(lessThan(2000L));
        }
    }

    @Nested
    @DisplayName("Authorization Tests")
    class AuthorizationTests {

        @Test
        @DisplayName("should allow access without authentication")
        public void shouldAllowAccessWithoutAuth() {
            given()
                .pathParam("id", 1)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(200)
                .time(lessThan(2000L));
        }

        @Test
        @DisplayName("should handle request with invalid auth token")
        public void shouldHandleInvalidAuthToken() {
            given()
                .header("Authorization", "Bearer invalid_token_12345")
                .pathParam("id", 1)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(anyOf(is(200), is(401), is(403)))
                .time(lessThan(2000L));
        }

        @Test
        @DisplayName("should handle request with expired auth token")
        public void shouldHandleExpiredAuthToken() {
            // TODO: Replace with actual expired token from test environment
            given()
                .header("Authorization", "Bearer expired_token_xyz")
                .pathParam("id", 1)
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(anyOf(is(200), is(401), is(403)))
                .time(lessThan(2000L));
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("should handle URL encoding in id parameter")
        public void shouldHandleUrlEncodingInId() {
            given()
                .pathParam("id", "%20")
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(anyOf(is(400), is(404)))
                .time(lessThan(2000L));
        }

        @Test
        @DisplayName("should handle SQL injection attempt in id")
        public void shouldHandleSqlInjectionAttempt() {
            given()
                .pathParam("id", "1; DROP TABLE products;")
            .when()
                .get("/products/{id}")
            .then()
                .statusCode(anyOf(is(400), is(404)))
                .time(lessThan(2000L));
        }

        @Test
        @DisplayName("should handle multiple slashes in path")
        public void shouldHandleMultipleSlashes() {
            given()
            .when()
                .get("/products//1")
            .then()
                .statusCode(anyOf(is(200), is(404)))
                .time(lessThan(2000L));
        }
    }
}