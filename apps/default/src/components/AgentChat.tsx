import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

const PUBLIC_AGENT_ID = '01KTMTG6RCTPD53V99QX1ST67T';

export default function AgentChat() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.taskade.com/embeds/latest/taskade-embed.min.js';
    script.async = true;
    document.body.appendChild(script);
    script.onload = () => {
      if ((window as unknown as { TaskadeEmbed?: { AgentPublicChatPopup?: { init: (opts: unknown) => void } } }).TaskadeEmbed?.AgentPublicChatPopup) {
        (window as unknown as { TaskadeEmbed: { AgentPublicChatPopup: { init: (opts: unknown) => void } } }).TaskadeEmbed.AgentPublicChatPopup.init({
          publicAgentId: PUBLIC_AGENT_ID,
          position: 'bottom-right',
          theme: 'auto',
        });
      }
    };
    return () => { document.body.removeChild(script); };
  }, []);

  return null;
}
