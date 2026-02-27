/**
 * WebSocket 실시간 채팅 클라이언트
 * 대본에 맞게 구현된 백엔드와 연동
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
const roomList = document.querySelector('#roomList');
const onlineUsersList = document.querySelector('#onlineUsersList');
const createRoomBtn = document.querySelector('#createRoomBtn');
const createRoomModal = document.querySelector('#createRoomModal');

// 전역 변수
let stompClient = null;
let username = null;
let currentRoomId = null;
let currentSubscription = null;
let roomListSubscription = null;
let privateMessageSubscription = null;
let rooms = [];
let onlineUsers = new Set();

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
        
        // 디버그 로그
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
    
    // 온라인 사용자 정보 구독
    stompClient.subscribe('/topic/users', onUserCountUpdate);
    
    // 채팅방 목록 실시간 업데이트 구독
    roomListSubscription = stompClient.subscribe('/topic/rooms', onRoomListUpdate);
    
    // 개인 메시지 구독
    privateMessageSubscription = stompClient.subscribe('/user/queue/messages', onPrivateMessageReceived);
    
    // 연결 중 표시 숨기기
    connectingElement.classList.remove('show');
    
    // 채팅방 목록 로드
    loadRooms();
}

/**
 * 연결 실패 시 호출되는 콜백
 */
function onError(error) {
    console.error('WebSocket 연결 실패:', error);
    connectingElement.textContent = '연결에 실패했습니다. 페이지를 새로고침해주세요.';
    connectingElement.style.color = 'red';
    
    // 5초 후 재연결 시도
    setTimeout(() => {
        console.log('재연결 시도 중...');
        location.reload();
    }, 5000);
}

/**
 * 채팅방 목록 로드
 */
async function loadRooms() {
    try {
        const response = await fetch('/api/rooms');
        rooms = await response.json();
        
        console.log('채팅방 목록:', rooms);
        displayRooms();
        
        // 첫 번째 채팅방에 자동 입장
        if (rooms.length > 0) {
            joinRoom(rooms[0].id);
        } else {
            // 채팅방이 없으면 기본 채팅방 생성
            await createDefaultRoom();
        }
    } catch (error) {
        console.error('채팅방 목록 로드 실패:', error);
    }
}

/**
 * 기본 채팅방 생성
 */
async function createDefaultRoom() {
    try {
        const response = await fetch('/api/rooms?name=일반', {
            method: 'POST'
        });
        const room = await response.json();
        rooms.push(room);
        displayRooms();
        joinRoom(room.id);
    } catch (error) {
        console.error('기본 채팅방 생성 실패:', error);
    }
}

/**
 * 채팅방 목록 표시
 */
function displayRooms() {
    roomList.innerHTML = '';
    
    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.className = 'room-item';
        roomElement.dataset.roomId = room.id;
        
        if (room.id === currentRoomId) {
            roomElement.classList.add('active');
        }
        
        roomElement.innerHTML = `
            <div class="room-item-name">${room.name}</div>
            <div class="room-item-info">${room.userCount}명 접속 중</div>
        `;
        
        roomElement.addEventListener('click', () => joinRoom(room.id));
        roomList.appendChild(roomElement);
    });
}

/**
 * 채팅방 목록 실시간 업데이트
 */
function onRoomListUpdate(payload) {
    rooms = JSON.parse(payload.body);
    console.log('채팅방 목록 업데이트:', rooms);
    displayRooms();
}

/**
 * 채팅방 입장
 */
async function joinRoom(roomId) {
    console.log('채팅방 입장 시도:', roomId);
    
    // 이전 구독 해제
    if (currentSubscription) {
        currentSubscription.unsubscribe();
        console.log('이전 구독 해제');
    }
    
    // 현재 채팅방 설정
    currentRoomId = roomId;
    
    // 채팅방 정보 가져오기
    const room = rooms.find(r => r.id === roomId);
    if (room) {
        document.querySelector('#currentRoomName').textContent = '💬 ' + room.name;
    }
    
    // 채팅방 구독 (대본 방식: /topic/room.{roomId})
    const destination = '/topic/room.' + roomId;
    console.log('구독 시작:', destination);
    currentSubscription = stompClient.subscribe(destination, onMessageReceived);
    
    // 활성 채팅방 표시
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.roomId === roomId) {
            item.classList.add('active');
        }
    });
    
    // 메시지 히스토리 로드
    await loadRoomMessages(roomId);
    
    // 입장 메시지 전송 (대본 방식: /app/chat.addUser/{roomId})
    sendRoomJoinMessage(roomId);
}

/**
 * 채팅방 메시지 히스토리 로드
 */
async function loadRoomMessages(roomId) {
    try {
        const response = await fetch(`/api/rooms/${roomId}/messages`);
        const messages = await response.json();
        
        console.log(`채팅방 ${roomId} 메시지 히스토리:`, messages);
        
        // 메시지 영역 초기화
        messageArea.innerHTML = '';
        
        // 히스토리 메시지 표시
        messages.forEach(message => {
            displayMessage(message);
        });
        
        // 스크롤을 맨 아래로
        messageArea.scrollTop = messageArea.scrollHeight;
    } catch (error) {
        console.error('메시지 히스토리 로드 실패:', error);
        // 실패해도 메시지 영역은 초기화
        messageArea.innerHTML = '';
    }
}

/**
 * 채팅방 입장 메시지 전송
 */
function sendRoomJoinMessage(roomId) {
    const joinMessage = {
        type: 'JOIN',
        sender: username,
        content: username + '님이 입장했습니다.'
    };
    
    const destination = "/app/chat.addUser/" + roomId;
    console.log('입장 메시지 전송:', destination, joinMessage);
    stompClient.send(destination, {}, JSON.stringify(joinMessage));
}

/**
 * 메시지 전송
 */
function sendMessage(event) {
    event.preventDefault();
    
    const messageContent = messageInput.value.trim();
    
    if (messageContent && stompClient && currentRoomId) {
        const chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT'
        };
        
        // 대본 방식: /app/chat.sendMessage/{roomId}
        const destination = "/app/chat.sendMessage/" + currentRoomId;
        console.log('메시지 전송:', destination, chatMessage);
        stompClient.send(destination, {}, JSON.stringify(chatMessage));
        
        // 입력 필드 초기화
        messageInput.value = '';
    }
}

/**
 * 메시지 수신 시 호출되는 콜백
 */
function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);
    console.log('메시지 수신:', message);
    displayMessage(message);
}

/**
 * 메시지 표시
 */
function displayMessage(message) {
    const messageElement = document.createElement('li');
    
    if (message.type === 'JOIN' || message.type === 'LEAVE') {
        // 입장/퇴장 메시지
        messageElement.classList.add('event-message');
        
        const emoji = message.type === 'JOIN' ? '👋' : '👋';
        const icon = document.createElement('span');
        icon.classList.add('event-icon');
        icon.textContent = emoji;
        
        const textElement = document.createElement('span');
        textElement.textContent = ' ' + message.content;
        
        const timeElement = document.createElement('span');
        timeElement.classList.add('event-time');
        timeElement.textContent = ' • ' + formatTime(message.timestamp);
        
        messageElement.appendChild(icon);
        messageElement.appendChild(textElement);
        messageElement.appendChild(timeElement);
    } else {
        // 일반 채팅 메시지
        messageElement.classList.add('chat-message');
        
        // 내가 보낸 메시지인지 확인
        if (message.sender === username) {
            messageElement.classList.add('my-message');
        }
        
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
    
    // 알림음 효과 (내가 보낸 메시지가 아닐 때만)
    if (message.sender !== username) {
        playNotificationSound();
    }
}

/**
 * 개인 메시지 수신
 */
function onPrivateMessageReceived(payload) {
    const message = JSON.parse(payload.body);
    console.log('개인 메시지 수신:', message);
    
    // 개인 메시지 알림 표시
    showPrivateMessageNotification(message);
}

/**
 * 개인 메시지 알림 표시
 */
function showPrivateMessageNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'private-message-notification';
    notification.innerHTML = `
        <div class="notification-header">
            <strong>💌 ${message.sender}님의 개인 메시지</strong>
            <button class="notification-close">×</button>
        </div>
        <div class="notification-body">${message.content}</div>
        <div class="notification-time">${formatTime(message.timestamp)}</div>
    `;
    
    document.body.appendChild(notification);
    
    // 닫기 버튼 이벤트
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    // 알림음
    playNotificationSound();
}

/**
 * 온라인 사용자 수 업데이트
 */
function onUserCountUpdate(payload) {
    const userInfo = JSON.parse(payload.body);
    console.log('온라인 사용자 정보:', userInfo);
    
    // 헤더에 온라인 사용자 수 표시
    document.querySelector('#onlineCount').textContent = userInfo.count;
    
    // 온라인 사용자 목록 업데이트
    onlineUsers = new Set(userInfo.users);
    displayOnlineUsers();
}

/**
 * 온라인 사용자 목록 표시
 */
function displayOnlineUsers() {
    onlineUsersList.innerHTML = '';
    
    onlineUsers.forEach(user => {
        if (user === username) return; // 자기 자신 제외
        
        const userElement = document.createElement('div');
        userElement.className = 'online-user-item';
        userElement.innerHTML = `
            <span class="online-indicator"></span>
            <span class="user-name">${user}</span>
            <button class="btn-dm" data-username="${user}" title="개인 메시지 보내기">💌</button>
        `;
        
        // 개인 메시지 버튼 이벤트
        userElement.querySelector('.btn-dm').addEventListener('click', (e) => {
            e.stopPropagation();
            openPrivateMessageModal(user);
        });
        
        onlineUsersList.appendChild(userElement);
    });
}

/**
 * 개인 메시지 모달 열기
 */
function openPrivateMessageModal(recipient) {
    const content = prompt(`${recipient}님에게 보낼 메시지를 입력하세요:`);
    
    if (content && content.trim()) {
        sendPrivateMessage(recipient, content.trim());
    }
}

/**
 * 개인 메시지 전송
 */
function sendPrivateMessage(recipient, content) {
    const privateMessage = {
        recipient: recipient,
        content: content
    };
    
    console.log('개인 메시지 전송:', privateMessage);
    stompClient.send('/app/chat.private', {}, JSON.stringify(privateMessage));
    
    // 전송 완료 알림
    alert(`${recipient}님에게 개인 메시지를 보냈습니다!`);
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
 * 알림음 재생
 */
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('알림음 재생 실패:', error);
    }
}

/**
 * 채팅방 생성 모달 열기
 */
function openCreateRoomModal() {
    createRoomModal.classList.remove('hidden');
}

/**
 * 채팅방 생성 모달 닫기
 */
function closeCreateRoomModal() {
    createRoomModal.classList.add('hidden');
    document.querySelector('#roomName').value = '';
}

/**
 * 채팅방 생성
 */
async function createRoom() {
    const name = document.querySelector('#roomName').value.trim();
    
    if (!name) {
        alert('채팅방 이름을 입력해주세요.');
        return;
    }
    
    try {
        // 대본 방식: POST /api/rooms?name=xxx
        const response = await fetch('/api/rooms?name=' + encodeURIComponent(name), {
            method: 'POST'
        });
        
        if (response.ok) {
            const newRoom = await response.json();
            console.log('채팅방 생성 성공:', newRoom);
            closeCreateRoomModal();
            
            // 서버에서 브로드캐스트로 목록이 업데이트되므로
            // 여기서는 모달만 닫고 자동으로 목록이 갱신됨
        }
    } catch (error) {
        console.error('채팅방 생성 실패:', error);
        alert('채팅방 생성에 실패했습니다.');
    }
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

// 채팅방 생성 관련 이벤트
createRoomBtn.addEventListener('click', openCreateRoomModal);
document.querySelector('.modal-close').addEventListener('click', closeCreateRoomModal);
document.querySelector('#cancelCreateRoom').addEventListener('click', closeCreateRoomModal);
document.querySelector('#confirmCreateRoom').addEventListener('click', createRoom);

// 모달 외부 클릭 시 닫기
createRoomModal.addEventListener('click', function(e) {
    if (e.target === createRoomModal) {
        closeCreateRoomModal();
    }
});
