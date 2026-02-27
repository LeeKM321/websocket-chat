package com.codeit.chat.service;

import com.codeit.chat.model.ChatRoom;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class ChatRoomService {

    // 채팅방 저장소 (메모리)
    // 멀티 스레드 환경에서도 Map의 내용을 공유할 수 있도록 도와주는 ConcurrentHashMap (서버가 여러개면 답 없습니다...)
    private final Map<String, ChatRoom> chatRooms = new ConcurrentHashMap<>();

    // 모든 채팅방 조회
    public List<ChatRoom> findAllRooms() {
        return new ArrayList<>(chatRooms.values());
    }

    // 특정 채팅방 조회
    public ChatRoom findRoomById(String id) {
        return chatRooms.get(id);
    }

    // 채팅방 생성
    public ChatRoom createRoom(String name) {
        ChatRoom room = ChatRoom.create(name);
        chatRooms.put(room.getId(), room);
        log.info("채팅방 생성 - ID: {}, 이름: {}", room.getId(), room.getName());

        return room;
    }

    // 사용자 입장
    public void enterRoom(String roomId) {
        ChatRoom room = chatRooms.get(roomId);
        if (room != null) {
            room.setUserCount(room.getUserCount() + 1);
            log.info("채팅방 입장 - 방: {}, 현재 인원: {}", room.getName(), room.getUserCount());
        }
    }

    // 사용자 퇴장
    public void leaveRoom(String roomId) {
        ChatRoom room = chatRooms.get(roomId);
        if (room != null) {
            room.setUserCount(Math.max(0, room.getUserCount() - 1));
            log.info("채팅방 퇴장 - 방: {}, 현재 인원: {}", room.getName(), room.getUserCount());
        }
    }

}














