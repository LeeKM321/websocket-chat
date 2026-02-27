package com.codeit.chat.listener;

import com.codeit.chat.model.ChatMessage;
import com.codeit.chat.service.ChatRoomService;
import com.codeit.chat.service.OnlineUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketEventListener {

    // 메시지를 직접 전송할 수 있는 객체
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomService chatRoomService;
    private final OnlineUserService onlineUserService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        log.info("새로운 WebSocket 연결 - 세션 ID: {}", sessionId);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String username = (String) headerAccessor.getSessionAttributes().get("username");
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");

        if (username != null) {
            log.info("사용자 퇴장 - 방:{} 이름: {}", roomId, username);

            chatRoomService.leaveRoom(roomId);

            onlineUserService.removeUser(username);

            // 퇴장 메시지 생성 및 브로드캐스트
            ChatMessage leaveMessage = ChatMessage.createLeaveMessage(username);
            messagingTemplate.convertAndSend("/topic/room." + roomId, leaveMessage);

            broadcastOnlineUserCount();
        }

    }


    /**
     * 온라인 사용자 수를 모든 클라이언트에게 브로드캐스트
     */
    private void broadcastOnlineUserCount() {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("count", onlineUserService.getOnlineUserCount());
        userInfo.put("users", onlineUserService.getOnlineUsers());

        messagingTemplate.convertAndSend("/topic/users", userInfo);
    }

}













