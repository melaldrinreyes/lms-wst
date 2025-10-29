import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Bot, User, Home, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ChatbotPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    { label: '💬 Discussion Forums', value: 'How do I use discussion forums?' },
    { label: '🔐 Reset Password', value: 'How do I reset my password?' },
  ];

  const knowledgeBase = {
    greetings: {
      patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo'],
      responses: [
        'Hello! How can I assist you with your learning today?',
        'Hi there! What can I help you with?',
        'Hey! I\'m here to help. What do you need?',
        'Good to see you! How can I help?',
      ]
    },
    assignments: {
      patterns: ['submit', 'assignment', 'upload', 'homework', 'task', 'due'],
      response: '📝 **To submit an assignment:**\n\n1. Go to **Courses** → Select your course\n2. Click on the **Assignments** tab\n3. Find your assignment and click on it\n4. Click **Upload File** and select your work\n5. Review and click **Submit**\n\n💡 **Tips:**\n• Check the due date before submitting\n• Make sure your file is in the correct format\n• You can resubmit before the deadline\n\nNeed help with a specific assignment?'
    },
    grades: {
      patterns: ['grade', 'score', 'marks', 'result', 'performance', 'gpa'],
      response: '📊 **To view your grades:**\n\n• Visit your **Dashboard** and scroll to the Grades section\n• Or go to any **Course** page to see course-specific grades\n• Click on individual assignments for detailed feedback\n• Your overall GPA is displayed on your profile\n\n📈 **Grade breakdown:**\n• Assignments: 40%\n• Midterm: 30%\n• Final: 30%\n\nWant to know how to improve your grades?'
    },
    instructor: {
      patterns: ['instructor', 'teacher', 'professor', 'contact', 'email', 'message', 'reach'],
      response: '👨‍🏫 **To contact your instructor:**\n\n• Go to the specific **Course** page\n• Click **Contact Instructor** in the sidebar\n• You can also find their email in the course details\n• Office hours are listed on each course page\n\n⏰ **Response time:**\nInstructors typically respond within 24-48 hours.\n\nNeed help with a specific question for your instructor?'
    },
    password: {
      patterns: ['password', 'reset', 'forgot', 'login', 'access', 'locked', 'unlock'],
      response: '🔐 **To reset your password:**\n\n1. Go to **Profile** → **Security** tab\n2. Click **Change Password**\n3. Enter your current password\n4. Create a new strong password\n5. Click **Update Password**\n\n**Forgot your current password?**\nUse the "Forgot Password" link on the login page.\n\n💡 **Password tips:**\n• Use at least 8 characters\n• Include numbers and symbols\n• Don\'t reuse old passwords'
    },
    schedule: {
      patterns: ['schedule', 'timetable', 'classes', 'calendar', 'when', 'timing', 'time'],
      response: '🗓️ **Your course schedule:**\n\n• View it on your **Dashboard** (Schedule section)\n• Download as PDF from **Profile** → **Account Info**\n• Add to Google Calendar using the sync button\n• Check individual course pages for class timings\n\nWant to see your schedule for a specific day?'
    },
    courses: {
      patterns: ['course', 'enroll', 'register', 'class', 'subject', 'module'],
      response: '📚 **Managing courses:**\n\n• View all courses on your **Dashboard**\n• Browse available courses in the **Courses** section\n• Track progress with the progress bar\n• Access materials and assignments per course\n• Download course resources anytime\n\n🎓 **Course features:**\n• Video lectures\n• Reading materials\n• Quizzes and assignments\n\nLooking for a specific course?'
    },
    help: {
      patterns: ['help', 'support', 'assist', 'guide', 'how', 'what', 'explain'],
      response: '🆘 **I can help you with:**\n\n✓ Submitting assignments\n✓ Viewing grades\n✓ Contacting instructors\n✓ Course schedules\n✓ Account settings\n✓ Password resets\n✓ Technical issues\n✓ Navigation tips\n\n💡 Use the quick action buttons below for common questions!\n\nWhat would you like to know more about?'
    },
    thanks: {
      patterns: ['thank', 'thanks', 'appreciate', 'helpful', 'great', 'awesome', 'perfect'],
      responses: [
        'You\'re welcome! Happy to help! 😊',
        'Glad I could assist! Let me know if you need anything else.',
        'Anytime! That\'s what I\'m here for! 🎓',
        'My pleasure! Feel free to ask more questions.',
      ]
    },
    navigation: {
      patterns: ['where', 'find', 'locate', 'navigate', 'go to', 'access'],
      response: '🧭 **Navigation help:**\n\n**Main sections:**\n• Dashboard - Overview and quick access\n• Courses - All your enrolled courses\n• Assignments - Pending and completed tasks\n• Profile - Your account settings\n\n💡 Use the sidebar menu to navigate quickly!\n\nWhat are you trying to find?'
    },
    technical: {
      patterns: ['error', 'bug', 'problem', 'issue', 'not working', 'broken', 'crash'],
      response: '🔧 **Technical issues:**\n\n**Quick fixes:**\n1. Refresh the page (F5)\n2. Clear your browser cache\n3. Try a different browser\n4. Check your internet connection\n5. Log out and log back in\n\n**Still having issues?**\nContact technical support at support@minsuelearn.com\n\nDescribe your issue and I\'ll try to help!'
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
    return '🤔 I\'m not sure about that specific question. Here are some things I can help with:\n\n• Submitting assignments\n• Viewing grades\n• Contacting instructors\n• Course schedules\n• Account settings\n• Technical support\n\n💡 Try using the quick action buttons or rephrase your question!';
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
    <div className="min-h-screen bg-gray-950 flex flex-col pb-20 md:pb-0 overflow-x-hidden">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(user ? `/${user.role}` : '/')}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <ArrowLeft size={20} className="text-gray-400" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    MINSU Bot
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  </h1>
                  <p className="text-sm text-gray-400">AI Learning Assistant</p>
                </div>
              </div>
            </div>
            <Link
              to={user ? `/${user.role}` : '/'}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition border border-gray-700 flex items-center gap-2"
            >
              <Home size={18} />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col">
        {/* Messages Container */}
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user' 
                    ? 'bg-orange-500/10 border border-orange-500/20' 
                    : 'bg-gray-800 border border-gray-700'
                }`}>
                  {message.sender === 'user' ? (
                    <User size={20} className="text-orange-500" />
                  ) : (
                    <Bot size={20} className="text-orange-400" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col max-w-[70%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`${
                      message.sender === 'user'
                        ? 'bg-orange-500 text-white rounded-2xl rounded-br-md'
                        : 'bg-gray-800 border border-gray-700 text-white rounded-2xl rounded-bl-md'
                    } p-4 shadow-lg`}
                  >
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 px-2">
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
                className="flex gap-3"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-800 border border-gray-700">
                  <Bot size={20} className="text-orange-400" />
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-md p-4 shadow-lg">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 3 && !isTyping && (
            <div className="px-6 py-4 bg-gray-900 border-t border-gray-800">
              <p className="text-xs text-gray-400 mb-3 font-medium">Quick actions:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.value)}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500/50 rounded-lg text-sm text-gray-300 hover:text-orange-400 transition text-left"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-gray-800 bg-gray-900">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything about your courses, assignments, grades..."
                className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500 text-sm"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="px-6 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                <Send size={20} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-3 text-center">
              Powered by MINSU AI • Always learning to serve you better
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
