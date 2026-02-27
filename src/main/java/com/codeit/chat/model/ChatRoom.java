package com.codeit.chat.model;

import lombok.*;

import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoom {

    private String id;
    private String name;
    private int userCount;

    public static ChatRoom create(String name) {
        return ChatRoom.builder()
                .id(UUID.randomUUID().toString())
                .name(name)
                .userCount(0)
                .build();
    }

}
