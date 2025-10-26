import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: 'Hi! I\'m MINSU Bot 🤖 Your personal learning assistant. How can I help you today?', 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickActions = [
    { label: '📚 Submit Assignment', value: 'How do I submit an assignment?' },
    { label: '📊 View Grades', value: 'How can I view my grades?' },
    { label: '👨‍🏫 Contact Instructor', value: 'How do I contact my instructor?' },
    { label: '🗓️ Course Schedule', value: 'Show me my course schedule' },
  ];

  const knowledgeBase = {
    greetings: {
      patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      responses: [
        'Hello! How can I assist you with your learning today?',
        'Hi there! What can I help you with?',
        'Hey! I\'m here to help. What do you need?',
      ]
    },
    assignments: {
      patterns: ['submit', 'assignment', 'upload', 'homework', 'task'],
      response: '📝 **To submit an assignment:**\n\n1. Go to **Courses** → Select your course\n2. Click on the **Assignments** tab\n3. Find your assignment and click on it\n4. Click **Upload File** and select your work\n5. Review and click **Submit**\n\nNeed help with a specific assignment?'
    },
    grades: {
      patterns: ['grade', 'score', 'marks', 'result', 'performance'],
      response: '📊 **To view your grades:**\n\n• Visit your **Dashboard** and scroll to the Grades section\n• Or go to any **Course** page to see course-specific grades\n• Click on individual assignments for detailed feedback\n\nYour overall GPA is displayed on your profile!'
    },
    instructor: {
      patterns: ['instructor', 'teacher', 'professor', 'contact', 'email', 'message'],
      response: '👨‍🏫 **To contact your instructor:**\n\n• Go to the specific **Course** page\n• Click **Contact Instructor** in the sidebar\n• You can also find their email in the course details\n\nInstructors typically respond within 24-48 hours.'
    },
    password: {
      patterns: ['password', 'reset', 'forgot', 'login', 'access'],
      response: '🔐 **To reset your password:**\n\n1. Go to **Profile** → **Security** tab\n2. Click **Change Password**\n3. Enter your current password\n4. Create a new strong password\n5. Click **Update Password**\n\nForgot your current password? Use the "Forgot Password" link on the login page.'
    },
    schedule: {
      patterns: ['schedule', 'timetable', 'classes', 'calendar', 'when'],
      response: '🗓️ **Your course schedule:**\n\n• View it on your **Dashboard** (Schedule section)\n• Download as PDF from **Profile** → **Account Info**\n• Add to Google Calendar using the sync button\n• Check individual course pages for class timings\n\nWant to see your schedule for a specific day?'
    },
    courses: {
      patterns: ['course', 'enroll', 'register', 'class', 'subject'],
      response: '📚 **Managing courses:**\n\n• View all courses on your **Dashboard**\n• Browse available courses in the **Courses** section\n• Track progress with the progress bar\n• Access materials and assignments per course\n\nLooking for a specific course?'
    },
    help: {
      patterns: ['help', 'support', 'assist', 'guide', 'how'],
      response: '🆘 **I can help you with:**\n\n✓ Submitting assignments\n✓ Viewing grades\n✓ Contacting instructors\n✓ Course schedules\n✓ Account settings\n✓ Technical issues\n\nWhat would you like to know more about?'
    },
    thanks: {
      patterns: ['thank', 'thanks', 'appreciate', 'helpful'],
      responses: [
        'You\'re welcome! Happy to help! 😊',
        'Glad I could assist! Let me know if you need anything else.',
        'Anytime! That\'s what I\'m here for! 🎓',
      ]
    }
  };

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for greetings
    if (knowledgeBase.greetings.patterns.some(pattern => lowerMessage.includes(pattern))) {
      const responses = knowledgeBase.greetings.responses;
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Check for thanks
    if (knowledgeBase.thanks.patterns.some(pattern => lowerMessage.includes(pattern))) {
      const responses = knowledgeBase.thanks.responses;
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Check knowledge base
    for (const [category, data] of Object.entries(knowledgeBase)) {
      if (category === 'greetings' || category === 'thanks') continue;
      
      if (data.patterns.some(pattern => lowerMessage.includes(pattern))) {
        return data.response || data.responses[0];
      }
    }
    
    // Default response with suggestions
    return '🤔 I\'m not sure about that specific question. Here are some things I can help with:\n\n• Submitting assignments\n• Viewing grades\n• Contacting instructors\n• Course schedules\n• Account settings\n\nCould you rephrase your question or pick one of these topics?';
  };

  const handleSend = (messageText = null) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage = { 
      id: Date.now(), 
      text: textToSend, 
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    const typingDelay = Math.min(textToSend.length * 20 + 500, 2000);
    
    setTimeout(() => {
      setIsTyping(false);
      const botMessage = {
        id: Date.now() + 1,
        text: getBotResponse(textToSend),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, typingDelay);
  };

  const handleQuickAction = (actionValue) => {
    handleSend(actionValue);
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition group"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <>
            <MessageCircle size={24} className="group-hover:scale-110 transition" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-950 animate-pulse"></span>
          </>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
            style={{ height: '600px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    MINSU Bot
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  </h3>
                  <p className="text-xs opacity-90">Online • Ready to help</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.sender === 'user'
                        ? 'bg-orange-500 text-white rounded-2xl rounded-br-md'
                        : 'bg-gray-800 border border-gray-700 text-white rounded-2xl rounded-bl-md'
                    } p-3 shadow-md`}
                  >
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                    <p className="text-[10px] opacity-60 mt-1">
                      {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-md p-3 shadow-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && !isTyping && (
              <div className="p-3 bg-gray-900 border-t border-gray-800">
                <p className="text-xs text-gray-400 mb-2">Quick actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.value)}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500/50 rounded-lg text-xs text-gray-300 hover:text-orange-400 transition text-left"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-800 bg-gray-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500 text-sm"
                  disabled={isTyping}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 text-center">
                Powered by MINSU AI • Always learning
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
