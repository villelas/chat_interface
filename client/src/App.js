import { useState } from 'react';
import botAvatar from './images/bb8.webp'; // Import the bot image
import userAvatar from './images/user.png'; // Import the user image

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  function handleMessage(e) {
    setMessage(e.target.value);
  }

  function limitMessages(history) {
    const userMessages = history.filter((msg) => msg.type === 'user');
    const botMessages = history.filter((msg) => msg.type === 'bot');

    const limitedUserMessages = userMessages.slice(-3);
    const limitedBotMessages = botMessages.slice(-3);

    const combinedHistory = [];

    history.forEach((msg) => {
      if (msg.type === 'user' && limitedUserMessages.includes(msg)) {
        combinedHistory.push(msg);
      } else if (msg.type === 'bot' && limitedBotMessages.includes(msg)) {
        combinedHistory.push(msg);
      }
    });

    return combinedHistory;
  }

  async function sendMessage() {
    if (message === '') {
      return;
    }

    const userMessage = { type: 'user', content: message };
    setChatHistory((prev) => [...prev, userMessage]);

    // Send the message to the backend
    try {
      const response = await fetch('http://localhost:8000/query', { // Update the URL if needed
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: message }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const botResponse = { type: 'bot', content: data.response };
      setChatHistory((prev) => limitMessages([...prev, botResponse]));
    } catch (error) {
      console.error('Error:', error);
      const errorResponse = { type: 'bot', content: 'Error occurred while contacting the server.' };
      setChatHistory((prev) => limitMessages([...prev, errorResponse]));
    }

    setMessage('');
  }

  return (
    <div className="flex flex-col justify-between items-center min-h-screen p-5 bg-base-200">
      <h1 className="text-4xl font-bold mt-10 text-primary absolute top-5 left-5">
        AI Chatbot:
      </h1>
      <div className="flex flex-col w-full max-w-lg mb-10">
        <div className="flex gap-2 justify-center items-end">
          <input
            type="text"
            placeholder="Type here"
            value={message}
            className="input input-bordered input-accent w-full max-w-xs h-12 p-3 rounded-lg focus:outline-none focus:ring focus:ring-accent"
            onInput={handleMessage}
          />
          <button className="btn btn-accent h-12" onClick={sendMessage}>
            Send
          </button>
        </div>
        <div className="card mt-5 p-4 bg-base-100 shadow-md w-full">
          <h2 className="text-xl font-semibold">Chat</h2>
          <div className="mt-2 space-y-2">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`chat ${chat.type === 'user' ? 'chat-end' : 'chat-start'}`}
              >
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full">
                    <img
                      alt={chat.type === 'bot' ? 'Bot Avatar' : 'User Avatar'}
                      src={chat.type === 'bot' ? botAvatar : userAvatar}
                      className="w-10 rounded-full"
                    />
                  </div>
                </div>
                <div className="chat-header">
                  {chat.type === 'bot' ? 'Bot' : 'User'}
                  <time className="text-xs opacity-50"> {new Date().toLocaleTimeString()}</time>
                </div>
                <div
                  className={`chat-bubble ${
                    chat.type === 'user'
                      ? 'chat-bubble-info'
                      : 'chat-bubble-primary'
                  }`}
                >
                  {chat.content}
                </div>
                <div className="chat-footer opacity-50">Delivered</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
