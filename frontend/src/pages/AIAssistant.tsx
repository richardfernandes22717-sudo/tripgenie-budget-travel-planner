import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import axios from 'axios';
import {
  FaArrowRight,
  FaCalendarDays,
  FaCircleExclamation,
  FaCompass,
  FaDatabase,
  FaLightbulb,
  FaLocationDot,
  FaPaperPlane,
  FaPlus,
  FaRobot,
  FaRoute,
  FaWallet,
  FaWandMagicSparkles,
} from 'react-icons/fa6';

import api from '../api/client';
import s from '../components/ui.module.css';

type GroundedDestination = {
  id: number;
  name: string;
  city: string;
  state: string;
  country: string;
  minimum_budget: number | string;
  average_daily_cost: number | string;
  best_season: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  source?: string;
  groundedDestinations?: GroundedDestination[];
};

const starterMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text:
    'Hello! I can help you compare destinations, understand typical travel budgets, choose a travel season, or prepare ideas for your next itinerary.',
};

const quickPrompts = [
  {
    icon: FaWallet,
    title: 'Budget destination',
    prompt:
      'Suggest destinations in India for two travellers with a budget under ₹25,000.',
  },
  {
    icon: FaCalendarDays,
    title: 'Best travel season',
    prompt:
      'Which destinations are best to visit between October and February?',
  },
  {
    icon: FaRoute,
    title: 'Compare two places',
    prompt:
      'Compare Jaipur and Goa for budget, experiences and ideal trip duration.',
  },
  {
    icon: FaCompass,
    title: 'Destination inspiration',
    prompt:
      'Recommend a destination for nature, photography and local food.',
  },
];

const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatMoney = (value: number | string) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function AIAssistant() {
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<
    number | undefined
  >(() => {
    const value = sessionStorage.getItem(
      'tripgenie_ai_conversation_id',
    );

    return value ? Number(value) : undefined;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(
        'tripgenie_ai_messages',
      );

      return saved ? JSON.parse(saved) : [starterMessage];
    } catch {
      return [starterMessage];
    }
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    sessionStorage.setItem(
      'tripgenie_ai_messages',
      JSON.stringify(messages),
    );

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      sessionStorage.setItem(
        'tripgenie_ai_conversation_id',
        String(conversationId),
      );
    }
  }, [conversationId]);

  const assistantCount = useMemo(
    () =>
      messages.filter((chatMessage) => chatMessage.role === 'assistant')
        .length,
    [messages],
  );

  const startNewConversation = () => {
    setConversationId(undefined);
    setMessages([starterMessage]);
    setMessage('');
    setError('');

    sessionStorage.removeItem('tripgenie_ai_conversation_id');
    sessionStorage.removeItem('tripgenie_ai_messages');
  };

  const submitMessage = async (event?: FormEvent) => {
    event?.preventDefault();

    const text = message.trim();

    if (!text || busy) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      text,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage('');
    setBusy(true);
    setError('');

    try {
      const response = await api.post('/ai/chat', {
        message: text,
        conversationId,
      });

      const result = response.data.data;

      setConversationId(result.conversationId);

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          text: result.answer,
          source: result.source,
          groundedDestinations:
            result.groundedDestinations || [],
        },
      ]);
    } catch (requestError: unknown) {
      const requestMessage = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : null;

      const errorText =
        requestMessage ||
        'The travel assistant is unavailable right now. Confirm that your backend is running and try again.';

      setError(errorText);

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          text: errorText,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const usePrompt = (prompt: string) => {
    setMessage(prompt);
  };

  return (
    <div className={s.assistantPage}>
      <section className={s.assistantHeader}>
        <div className={s.assistantHeaderCopy}>
          <span className={s.assistantEyebrow}>
            <FaWandMagicSparkles />
            TripGenie travel assistant
          </span>

          <h1>Ask better questions. Plan better journeys.</h1>

          <p>
            Compare destinations, understand estimated budgets and
            discover travel ideas using information from the TripGenie
            catalogue.
          </p>
        </div>

        <div className={s.assistantStatus}>
          <span>
            <FaRobot />
          </span>

          <div>
            <small>Assistant status</small>
            <strong>{busy ? 'Thinking...' : 'Ready to help'}</strong>
            <p>
              {assistantCount} assistant{' '}
              {assistantCount === 1 ? 'response' : 'responses'} in this
              conversation
            </p>
          </div>
        </div>
      </section>

      <section className={s.assistantWorkspace}>
        <aside className={s.assistantSidebar}>
          <div className={s.assistantSidebarHeader}>
            <span>
              <FaLightbulb />
            </span>

            <div>
              <h2>Start with an idea</h2>
              <p>Choose a suggestion or write your own question.</p>
            </div>
          </div>

          <div className={s.assistantPromptList}>
            {quickPrompts.map((prompt) => {
              const Icon = prompt.icon;

              return (
                <button
                  type="button"
                  onClick={() => usePrompt(prompt.prompt)}
                  key={prompt.title}
                >
                  <span>
                    <Icon />
                  </span>

                  <div>
                    <strong>{prompt.title}</strong>
                    <small>{prompt.prompt}</small>
                  </div>

                  <FaArrowRight />
                </button>
              );
            })}
          </div>

          <div className={s.assistantGuide}>
            <span>
              <FaDatabase />
            </span>

            <div>
              <strong>Catalogue-grounded answers</strong>

              <p>
                The assistant uses TripGenie destination records when
                answering questions about budgets, seasons and places.
              </p>
            </div>
          </div>
        </aside>

        <article className={s.assistantMain}>
          <header className={s.assistantConversationHeader}>
            <div>
              <span className={s.assistantConversationIcon}>
                <FaRobot />
              </span>

              <div>
                <h2>Travel conversation</h2>

                <p>
                  Ask about destinations, costs, seasons and planning
                  ideas.
                </p>
              </div>
            </div>

            <button
              type="button"
              className={s.assistantNewButton}
              onClick={startNewConversation}
            >
              <FaPlus />
              New conversation
            </button>
          </header>

          {error && (
            <div className={s.assistantError}>
              <FaCircleExclamation />
              <span>{error}</span>
            </div>
          )}

          <div className={s.assistantMessages}>
            {messages.map((chatMessage) => (
              <div
                className={`${s.assistantMessageRow} ${
                  chatMessage.role === 'user'
                    ? s.assistantUserRow
                    : ''
                }`}
                key={chatMessage.id}
              >
                <span className={s.assistantAvatar}>
                  {chatMessage.role === 'assistant' ? (
                    <FaRobot />
                  ) : (
                    <span>Y</span>
                  )}
                </span>

                <div className={s.assistantMessageContent}>
                  <div className={s.assistantMessageLabel}>
                    <strong>
                      {chatMessage.role === 'assistant'
                        ? 'TripGenie'
                        : 'You'}
                    </strong>

                    {chatMessage.source && (
                      <span
                        className={
                          chatMessage.source === 'groq'
                            ? s.assistantSourceAI
                            : s.assistantSourceFallback
                        }
                      >
                        {chatMessage.source === 'groq'
                          ? 'AI assisted'
                          : 'Catalogue response'}
                      </span>
                    )}
                  </div>

                  <div className={s.assistantBubble}>
                    {chatMessage.text}
                  </div>

                  {chatMessage.groundedDestinations &&
                    chatMessage.groundedDestinations.length > 0 && (
                      <div className={s.assistantGrounding}>
                        <div className={s.assistantGroundingHeader}>
                          <FaCompass />
                          <span>Destinations used for this answer</span>
                        </div>

                        <div className={s.assistantGroundingGrid}>
                          {chatMessage.groundedDestinations
                            .slice(0, 3)
                            .map((destination) => (
                              <article key={destination.id}>
                                <span>
                                  <FaLocationDot />
                                  {destination.city},{' '}
                                  {destination.state}
                                </span>

                                <h3>{destination.name}</h3>

                                <div>
                                  <small>Starting budget</small>
                                  <strong>
                                    {formatMoney(
                                      destination.minimum_budget,
                                    )}
                                  </strong>
                                </div>

                                <p>
                                  Best season:{' '}
                                  {destination.best_season}
                                </p>
                              </article>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}

            {busy && (
              <div className={s.assistantMessageRow}>
                <span className={s.assistantAvatar}>
                  <FaRobot />
                </span>

                <div className={s.assistantMessageContent}>
                  <div className={s.assistantMessageLabel}>
                    <strong>TripGenie</strong>
                  </div>

                  <div
                    className={`${s.assistantBubble} ${s.assistantTyping}`}
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            className={s.assistantComposer}
            onSubmit={submitMessage}
          >
            <div className={s.assistantInputWrap}>
              <textarea
                rows={3}
                maxLength={2000}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask TripGenie about a destination, travel budget or the best season..."
                disabled={busy}
              />

              <div className={s.assistantComposerFooter}>
                <span>{message.length}/2000 characters</span>

                <small>
                  Travel estimates should be reviewed before booking.
                </small>
              </div>
            </div>

            <button
              type="submit"
              className={s.assistantSendButton}
              disabled={busy || !message.trim()}
              aria-label="Send message"
            >
              <FaPaperPlane />
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}