package com.codeit.chat.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OnlineUserService {

    // 온라인 사용자 목록 (Thread-safe)
    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    // 사용자 이름 -> Principal ID 매핑 (개인 메시지 전송용)
    private final Map<String, String> userPrincipalMap = new ConcurrentHashMap<>();

    /**
     * 사용자 추가
     */
    public void addUser(String username) {
        onlineUsers.add(username);
    }

    /**
     * 사용자 추가 (Principal ID 포함)
     */
    public void addUser(String username, String principalId) {
        onlineUsers.add(username);
        userPrincipalMap.put(username, principalId);
    }

    /**
     * 사용자 제거
     */
    public void removeUser(String username) {
        onlineUsers.remove(username);
        userPrincipalMap.remove(username);
    }

    /**
     * 사용자 이름으로 Principal ID 조회
     */
    public String getPrincipalId(String username) {
        return userPrincipalMap.get(username);
    }

    /**
     * 온라인 사용자 수 조회
     */
    public int getOnlineUserCount() {
        return onlineUsers.size();
    }

    /**
     * 온라인 사용자 목록 조회
     */
    public Set<String> getOnlineUsers() {
        return Set.copyOf(onlineUsers);
    }

    /**
     * 사용자가 온라인인지 확인
     */
    public boolean isOnline(String username) {
        return onlineUsers.contains(username);
    }


}
