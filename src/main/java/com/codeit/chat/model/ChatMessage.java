package com.codeit.chat.model;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    private MessageType type;

    private String content;

    private String sender;

    private long timestamp;

    /**
     * 채팅 메시지 생성 팩토리 메서드
     */
    public static ChatMessage createChatMessage(String sender, String content) {
        return ChatMessage.builder()
                .type(MessageType.CHAT)
                .sender(sender)
                .content(content)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 입장 메시지 생성 팩토리 메서드
     */
    public static ChatMessage createJoinMessage(String sender) {
        return ChatMessage.builder()
                .type(MessageType.JOIN)
                .sender(sender)
                .content(sender + "님이 입장했습니다.")
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 퇴장 메시지 생성 팩토리 메서드
     */
    public static ChatMessage createLeaveMessage(String sender) {
        return ChatMessage.builder()
                .type(MessageType.LEAVE)
                .sender(sender)
                .content(sender + "님이 퇴장했습니다.")
                .timestamp(System.currentTimeMillis())
                .build();
    }

}
