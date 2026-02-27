package com.codeit.chat.controller;

import com.codeit.chat.model.ChatRoom;
import com.codeit.chat.service.ChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    /**
     * 모든 채팅방 조회
     */
    @GetMapping
    public ResponseEntity<List<ChatRoom>> getAllRooms() {
        return ResponseEntity.ok(chatRoomService.findAllRooms());
    }

    /**
     * 채팅방 생성
     */
    @PostMapping
    public ResponseEntity<ChatRoom> createRoom(@RequestParam String name) {
        return ResponseEntity.ok(chatRoomService.createRoom(name));
    }

    /**
     * 특정 채팅방 조회
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<ChatRoom> getRoom(@PathVariable String roomId) {
        ChatRoom room = chatRoomService.findRoomById(roomId);
        if (room == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(room);
    }

}
