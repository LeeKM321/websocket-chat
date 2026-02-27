package com.codeit.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // WebSocket 메시지 브로커 활성화
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 여기에 메시지 브로커 설정
        // /topic으로 시작하는 목적지를 가진 메시지를 브로커가 처리 -> 이 주소를 구독하는 모든 사용자에게 메시지를 전달
        // /topic은 브로드캐스트용, /queue는 개인 메시지용
        config.enableSimpleBroker("/topic", "/queue");

        // 클라이언트가 /app으로 시작하는 주소로 메시지를 보내면, 우리가 만들 컨트롤러의 @MessageMapping으로 라우팅됩니다.
        config.setApplicationDestinationPrefixes("/app");

        // 사용자별 목적지 prefix 설정
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 여기에 STOMP 엔드포인트 등록
        registry.addEndpoint("/ws") // 웹소켓 연결 엔드포인트 설정. (ws://localhost:8080/ws)
                .setAllowedOrigins("http://localhost:8080") // 웹소켓 요청이 들어오는 특정 도메인을 허용하기.
                .setHandshakeHandler(new UserHandshakeHandler()) // 사용자별 메시지 전송을 위한 핸드쉐이커 등록.
                .withSockJS(); // WebSocket을 지원하지 않는 구형 브라우저를 위한 풀백. (자동으로 롱 폴링 등으로 전환)
    }
}









