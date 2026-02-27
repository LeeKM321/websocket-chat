/**
 * WebSocket 실시간 채팅 클라이언트
 * 
 * SockJS와 STOMP 프로토콜을 사용하여 서버와 실시간 통신합니다.
 */

'use strict';

// DOM 요소
const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const messageArea = document.querySelector('#messageArea');
const connectingElement = document.querySelector('.connecting');

// 전역 변수
let stompClient = null;
let username = null;

// 색상 배열 (아바타 배경색)
const colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

/**
 * WebSocket 연결
 */
function connect(event) {
    event.preventDefault();
    
    username = document.querySelector('#name').value.trim();
    
    if (username) {
        // 화면 전환
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        
        // 사용자 이름 표시
        document.querySelector('#connected-user-fullname').textContent = username;
        
        // 연결 중 표시
        connectingElement.classList.add('show');
        
        // SockJS와 STOMP 클라이언트 생성
        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        
        // 디버그 로그 비활성화 (프로덕션에서는 활성화)
        stompClient.debug = function(str) {
            console.log('STOMP: ' + str);
        };
        
        // 서버 연결
        stompClient.connect({}, onConnected, onError);
    }
}

/**
 * 연결 성공 시 호출되는 콜백
 */
function onConnected() {
    console.log('WebSocket 연결 성공!');
    
    // 공개 채팅방 구독
    stompClient.subscribe('/topic/public', onMessageReceived);
    
    // 서버에 입장 메시지 전송
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({
            sender: username,
            type: 'JOIN'
        })
    );
    
    // 연결 중 표시 숨기기
    connectingElement.classList.remove('show');
}

/**
 * 연결 실패 시 호출되는 콜백
 */
function onError(error) {
    console.error('WebSocket 연결 실패:', error);
    connectingElement.textContent = '연결에 실패했습니다. 페이지를 새로고침해주세요.';
    connectingElement.style.color = 'red';
}

/**
 * 메시지 전송
 */
function sendMessage(event) {
    event.preventDefault();
    
    const messageContent = messageInput.value.trim();
    
    if (messageContent && stompClient) {
        const chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT'
        };
        
        // 서버로 메시지 전송
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        
        // 입력 필드 초기화
        messageInput.value = '';
    }
}

/**
 * 메시지 수신 시 호출되는 콜백
 */
function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);
    
    const messageElement = document.createElement('li');
    
    if (message.type === 'JOIN' || message.type === 'LEAVE') {
        // 입장/퇴장 메시지
        messageElement.classList.add('event-message');
        const textElement = document.createTextNode(message.content);
        messageElement.appendChild(textElement);
    } else {
        // 일반 채팅 메시지
        messageElement.classList.add('chat-message');
        
        // 아바타
        const avatarElement = document.createElement('div');
        avatarElement.classList.add('avatar');
        const avatarText = document.createTextNode(message.sender[0].toUpperCase());
        avatarElement.appendChild(avatarText);
        avatarElement.style.backgroundColor = getAvatarColor(message.sender);
        
        // 메시지 내용
        const messageContentElement = document.createElement('div');
        messageContentElement.classList.add('message-content');
        
        const usernameElement = document.createElement('div');
        usernameElement.classList.add('username');
        const usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        
        const textElement = document.createElement('div');
        textElement.classList.add('message-text');
        const messageText = document.createTextNode(message.content);
        textElement.appendChild(messageText);
        
        const timeElement = document.createElement('div');
        timeElement.classList.add('message-time');
        const timeText = document.createTextNode(formatTime(message.timestamp));
        timeElement.appendChild(timeText);
        
        messageContentElement.appendChild(usernameElement);
        messageContentElement.appendChild(textElement);
        messageContentElement.appendChild(timeElement);
        
        messageElement.appendChild(avatarElement);
        messageElement.appendChild(messageContentElement);
    }
    
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

/**
 * 사용자 이름을 기반으로 아바타 색상 생성
 */
function getAvatarColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = 31 * hash + username.charCodeAt(i);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
}

/**
 * 타임스탬프를 시간 형식으로 변환
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * 페이지 종료 시 WebSocket 연결 해제
 */
window.addEventListener('beforeunload', function() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
});

// 이벤트 리스너 등록
usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);
