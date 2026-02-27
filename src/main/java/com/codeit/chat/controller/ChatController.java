package com.codeit.chat.controller;

import com.codeit.chat.model.ChatMessage;
import com.codeit.chat.model.PrivateMessage;
import com.codeit.chat.service.ChatRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomService chatRoomService;

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

    @MessageMapping("/chat.sendMessage/{roomId}")
    @SendTo("/topic/room.{roomId}")
    public ChatMessage sendMessageToRoom(@DestinationVariable String roomId, @Payload ChatMessage chatMessage) {
        log.info("메시지 수신 - 방: {} 발신자: {}, 내용: {}",
                roomId,
                chatMessage.getSender(),
                chatMessage.getContent());

        chatMessage.setTimestamp(System.currentTimeMillis());

//        messagingTemplate.convertAndSend("/topic/room." + roomId);

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

    @MessageMapping("/chat.addUser/{roomId}")
    @SendTo("/topic/public")
    public ChatMessage addUserToRoom(@DestinationVariable String roomId, @Payload ChatMessage chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {

        // 세션에 사용자 이름과 방 ID를 저장
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        headerAccessor.getSessionAttributes().put("roomId", roomId);

        // 채팅방 입장 처리
        chatRoomService.enterRoom(roomId);

        log.info("사용자 입장 - 방: {} 이름: {}",
                roomId,
                chatMessage.getSender());

        // 입장 메시지 생성
        return ChatMessage.createJoinMessage(chatMessage.getSender());
    }

    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload PrivateMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String sender = (String) headerAccessor.getSessionAttributes().get("username");
        message.setSender(sender);
        message.setTimestamp(System.currentTimeMillis());

        // 실제 목적지: /user/김철수/queue/messages
        messagingTemplate.convertAndSendToUser(message.getRecipient(), "/queue/message", message);
    }


}











