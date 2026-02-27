package com.codeit.chat.controller;

import com.codeit.chat.model.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
public class ChatController {

    /**
     * 일반 채팅 메시지 전송 처리
     *
     * 클라이언트가 /app/chat.sendMessage로 메시지를 보내면
     * 이 메서드가 처리하고 /topic/public으로 브로드캐스트 합니다.
     *
     * @param chatMessage - 클라이언트가 보낸 채팅 메시지
     * @return 처리된 채팅 메시지 (모든 구독자에게 전송됨)
     */
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        log.info("메시지 수신 - 발신자: {}, 내용: {}",
                chatMessage.getSender(),
                chatMessage.getContent());

        chatMessage.setTimestamp(System.currentTimeMillis());

        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {

        // WebSocket 세션에 사용자의 이름을 저장
        // 사용자가 브라우저를 닫거나 연결이 끊어지면, '누가' 나갔는지 알아야 퇴장 메시지를 보낼 수 있습니다. 그래서 세션에 저장합니다.
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());

        log.info("사용자 입장 - 이름: {}",
                chatMessage.getSender());

        // 입장 메시지 생성
        return ChatMessage.createJoinMessage(chatMessage.getSender());
    }



}











