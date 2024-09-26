import React, { useState } from 'react';
import { VegaLite } from 'react-vega'; // Ensure this is installed
import DataVisualizer from './Data_Visualizer'; // Ensure correct naming
import userAvatar from './images/user.png'; // Path to user avatar
import botAvatar from './images/bb8.webp'; // Path to bot avatar

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [csvData, setCsvData] = useState(null);

  // Function to handle input message
  function handleMessage(e) {
    setMessage(e.target.value);
  }

  // Function to limit messages in chat
  function limitMessages(history) {
    const limitedUserMessages = history.filter(msg => msg.type === 'user').slice(-3);
    const limitedBotMessages = history.filter(msg => msg.type === 'bot' || msg.type === 'vega').slice(-3);
    const combinedHistory = [];

    history.forEach((msg) => {
      if (msg.type === 'user' && limitedUserMessages.includes(msg)) {
        combinedHistory.push(msg);
      } else if ((msg.type === 'bot' || msg.type === 'vega') && limitedBotMessages.includes(msg)) {
        combinedHistory.push(msg);
      }
    });

    return combinedHistory;
  }

  // Function to send messages to the backend
  async function sendMessage() {
    if (message.toLowerCase() === 'how are you') {
                const botResponse = { type: 'bot', content: 'Please enter something relevant to the dataset.' };
                setChatHistory((prev) => limitMessages([...prev, botResponse]));
                setMessage(''); // Clear the input field
                return;
        }

    if (message === '') {
      return;
    }

    const userMessage = { type: 'user', content: message };
    setChatHistory((prev) => [...prev, userMessage]);

    // Send the message to the backend
    try {
      if (!csvData) {
        // If no CSV data is uploaded
        const errorResponse = { type: 'bot', content: 'Please upload a dataset for me to work with.' };
        setChatHistory((prev) => limitMessages([...prev, errorResponse]));
        setMessage(''); // Clear the input field
        return;
      }

      const response = await fetch('https://chat-interface-9y9w.onrender.com/query', {
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
      let botResponse;

      if (data.visualization) {
        // Log the raw data received for debugging
        console.log('Received data:', data);

        const description = data.description;

        botResponse = {
          type: 'vega',
          content: data.visualization,
          description: description, // Always set a description
        };
      } else {
        botResponse = { type: 'bot', content: data.response || "I couldn't generate a visualization." };
      }

      setChatHistory((prev) => limitMessages([...prev, botResponse]));
    } catch (error) {
      console.error('Error:', error);
      const errorResponse = { type: 'bot', content: 'Error occurred while contacting the server.' };
      setChatHistory((prev) => limitMessages([...prev, errorResponse]));
    }

    setMessage(''); // Clear the input field
  }

  return (
    <div className="flex flex-col justify-between items-center min-h-screen p-5 bg-base-200">
      <h1 style={{ fontSize: '1.75rem' }} className="font-bold mt-6 text-primary absolute top-1 left-3">
        Data Visualization AI
      </h1>
      <div className="w-full max-w-lg mb-4">
        <DataVisualizer setCsvData={setCsvData} />
      </div>
      <div className="flex flex-col w-full max-w-full md:max-w-2xl lg:max-w-[800px] flex-grow mb-10">
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
        <div className="card mt-5 p-4 bg-base-100 shadow-md w-full h-[500px] overflow-y-auto">
          <h2 className="text-xl font-semibold">Chat</h2>
          <div className="mt-2 space-y-2">
            {chatHistory.map((chat, index) => (
              <div key={index} className={`chat ${chat.type === 'user' ? 'chat-end' : 'chat-start'}`}>
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full">
                    <img
                      alt={chat.type === 'bot' ? 'Bot Avatar' : 'User Avatar'}
                      src={chat.type === 'bot' || chat.type === 'vega' ? botAvatar : userAvatar}
                      className="w-10 rounded-full"
                    />
                  </div>
                </div>
                <div className="chat-header">
                  {chat.type === 'bot' || chat.type === 'vega' ? 'Bot' : 'User'}
                  <time className="text-xs opacity-50"> {new Date().toLocaleTimeString()}</time>
                </div>
                <div className={`chat-bubble ${chat.type === 'bot' || chat.type === 'vega' ? 'chat-bubble-info' : 'chat-bubble-primary'}`}>
                  {chat.type === 'vega' ? (
                    <div>
                      <p className="text-sm">{chat.description}</p>
                      {chat.content ? (
                        <>
                          {/* Debugging log to check the content */}
                          {console.log("Vega-Lite Spec:", chat.content)}
                          <VegaLite spec={JSON.parse(chat.content)} width={400} height={300} />
                        </>
                      ) : (
                        <p>No valid visualization was generated.</p>
                      )}
                    </div>
                  ) : (
                    chat.content
                  )}
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
