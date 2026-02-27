package com.codeit.chat.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

// 사용자별 메시지 전송을 위해 각 연결에 고유한 Principal을 할당합니다.
public class UserHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        // 고유한 사용자 식별자 생성
        String randomId = UUID.randomUUID().toString();
        return new StompPrincipal(randomId);
    }

    private static class StompPrincipal implements Principal {

        private final String name;

        private StompPrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }

}















