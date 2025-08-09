import React from 'react';

export interface Message {
  role: string;
  content: string;
}

interface ChatViewProps {
  messages: Message[];
}

const ChatView: React.FC<ChatViewProps> = ({ messages }) => {

  const getRoleClasses = (role: string) => {
    switch (role.toLowerCase()) {
      case 'system':
        return 'bg-gray-200 text-gray-800 border-gray-300';
      case 'user':
        return 'bg-blue-100 text-blue-900 self-end text-right';
      case 'assistant':
        return 'bg-green-100 text-green-900 self-start text-left';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  return (
    <div className="p-4 space-y-4 flex flex-col">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg max-w-xl break-words ${getRoleClasses(msg.role)}`}
        >
          <div className="font-bold text-xs mb-1">{getRoleLabel(msg.role)}</div>
          <pre className="whitespace-pre-wrap text-sm">{msg.content}</pre>
        </div>
      ))}
    </div>
  );
};

export default ChatView;
