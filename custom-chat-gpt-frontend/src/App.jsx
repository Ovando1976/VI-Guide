import React, { useState, useEffect } from 'react';
import { Widget, addResponseMessage, setTyping } from 'react-chat-widget';

import 'react-chat-widget/lib/styles.css';

const App = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    addResponseMessage('Welcome to this awesome chat!');
  }, []);

  const handleNewUserMessage = (newMessage) => {
    setLoading(true);
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({message: newMessage}),
    })
    .then(response => response.json())
    .then(data => {
      addResponseMessage(data);
      setLoading(false);
    })
    .catch((error) => {
      console.error('Error:', error);
      addResponseMessage("Sorry, I didn't understand that. Can you rephrase?");
      setLoading(false);
    });
  }

  return (
    <div className="App">
      <Widget
        handleNewUserMessage={handleNewUserMessage}
        title="My new awesome title"
        subtitle="And my cool subtitle"
        senderPlaceHolder="Type a message..."
        profileAvatar={urlToYourAvatarImage}
        showCloseButton
        fullScreenMode
        autofocus
        loading={loading}
      />
    </div>
  );
}

export default App;
