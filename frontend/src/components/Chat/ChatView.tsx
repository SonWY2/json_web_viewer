import React from 'react';

interface ChatViewProps {
  content: string;
}

interface Message {
  role: string;
  content: string;
}

const parseChatML = (content: string): Message[] => {
  const messages: Message[] = [];
  const regex = /<\|im_start\|>(\w+)\n([\s\S]*?)<\|im_end\|>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    messages.push({
      role: match[1],
      content: match[2].trim(),
    });
  }

  return messages;
};

const ChatView: React.FC<ChatViewProps> = ({ content }) => {
  const messages = parseChatML(content);

  if (messages.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        Could not parse ChatML content. Displaying raw text instead.
        <pre className="whitespace-pre-wrap mt-2 text-sm bg-gray-50 p-4 rounded border">{content}</pre>
      </div>
    );
  }

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
