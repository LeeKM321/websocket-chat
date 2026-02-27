package com.codeit.chat;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.ControllerAdvice;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * WebSocket 메시지 처리 중 발생한 예외 처리
     */
    @MessageExceptionHandler
    @SendToUser("/queue/errors") // 에러를 발생시킨 사용자에게만 에러메시지를 보냅니다.
    public String handleException(Exception e) {
        return "에러가 발생했습니다.: " + e.getMessage();
    }

}










