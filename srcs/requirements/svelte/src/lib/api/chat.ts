import { io, Socket } from 'socket.io-client';

let chatSocket: Socket | null = null;

export function initChatSocket() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (chatSocket?.connected) {
    return chatSocket;
  }

  chatSocket = io('https://localhost:3000/chat', {
    auth: { token },
    transports: ['websocket'],
  });

  chatSocket.on('connect', () => {
    console.log('Chat socket connected');
  });

  chatSocket.on('disconnect', () => {
    console.log('Chat socket disconnected');
  });

  chatSocket.on('newMessage', (data) => {
    window.dispatchEvent(new CustomEvent('chat:newMessage', { detail: data }));
  });

  chatSocket.on('messageSent', (data) => {
    window.dispatchEvent(new CustomEvent('chat:messageSent', { detail: data }));
  });

  chatSocket.on('friends:refresh', (data) => {
    window.dispatchEvent(new CustomEvent('friends:refresh', { detail: data }));
  });

  return chatSocket;
}

export function getChatSocket(): Socket | null {
  return chatSocket;
}

export function sendMessage(recipientId: number, content: string) {
  if (!chatSocket?.connected) {
    console.error('Chat socket not connected');
    return;
  }

  chatSocket.emit('sendMessage', { recipientId, content });
}

export function getConversation(friendId: number, limit?: number, beforeId?: number) {
  if (!chatSocket?.connected) {
    console.error('Chat socket not connected');
    return;
  }

  return new Promise((resolve, reject) => {
    chatSocket!.emit('getConversation', { friendId, limit, beforeId }, (response: any) => {
      if (response.success) {
        resolve(response.messages);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

export function markRead(messageId: number) {
  if (!chatSocket?.connected) {
    console.error('Chat socket not connected');
    return;
  }

  chatSocket.emit('markRead', { messageId });
}

export function disconnectChat() {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }

  
}

export function getUnreads(): Promise<Record<number, boolean>> {
  return new Promise((resolve) => {
    if (!chatSocket) {
      resolve({});
      return;
    }

    const emit = () => {
      chatSocket!.emit('getUnreads', {}, (response: any) => {
        if (response?.success) {
          resolve(response.unreads);
        } else {
          resolve({});
        }
      });
    };

    if (chatSocket.connected) {
      emit();
    } else {
      chatSocket.once('connect', emit);
    }
  });
}
