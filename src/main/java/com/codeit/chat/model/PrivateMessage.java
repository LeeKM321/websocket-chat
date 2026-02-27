package com.codeit.chat.model;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrivateMessage {

    private String sender;
    private String recipient;
    private String content;
    private long timestamp;

    public static PrivateMessage create(String sender, String recipient, String content) {
        return PrivateMessage.builder()
                .sender(sender)
                .recipient(recipient)
                .content(content)
                .timestamp(System.currentTimeMillis())
                .build();
    }

}
