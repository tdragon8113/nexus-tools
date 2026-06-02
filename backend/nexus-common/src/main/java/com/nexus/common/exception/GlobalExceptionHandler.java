package com.nexus.common.exception;

import com.nexus.common.constants.ResultCode;
import com.nexus.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

/**
 * 统一异常日志：4xx warn、5xx error，附带 method/path 便于排查。
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<?>> handleBusiness(BusinessException e, WebRequest request) {
        log.warn("event=http.error type=business code={} message={} {}",
                e.getCode(), e.getMessage(), requestLine(request));
        HttpStatus status = mapBusinessCodeToHttpStatus(e.getCode());
        return ResponseEntity.status(status).body(ApiResponse.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(MethodArgumentNotValidException e, WebRequest request) {
        String message = e.getBindingResult().getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        log.warn("event=http.error type=validation message={} {}", message, requestLine(request));
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ResultCode.BAD_REQUEST, message));
    }

    @ExceptionHandler({
        MissingRequestHeaderException.class,
        MethodArgumentTypeMismatchException.class,
        HttpMessageNotReadableException.class
    })
    public ResponseEntity<ApiResponse<?>> handleBadRequest(Exception e, WebRequest request) {
        log.warn("event=http.error type=bad_request message={} {}", e.getMessage(), requestLine(request));
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ResultCode.BAD_REQUEST, "请求参数无效"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleUnknown(Exception e, WebRequest request) {
        log.error("event=http.error type=internal message={} {}", e.getMessage(), requestLine(request), e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(ResultCode.INTERNAL_ERROR, "系统异常"));
    }

    private static String requestLine(WebRequest request) {
        if (request instanceof ServletWebRequest servlet) {
            HttpServletRequest req = servlet.getRequest();
            return "method=" + req.getMethod() + " path=" + req.getRequestURI();
        }
        return "";
    }

    private static HttpStatus mapBusinessCodeToHttpStatus(int code) {
        return switch (code) {
            case ResultCode.UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
            case ResultCode.FORBIDDEN -> HttpStatus.FORBIDDEN;
            case ResultCode.NOT_FOUND -> HttpStatus.NOT_FOUND;
            case 409 -> HttpStatus.CONFLICT;
            default -> HttpStatus.BAD_REQUEST;
        };
    }
}
