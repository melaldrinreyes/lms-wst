import { useState } from 'react';
import { MessageSquare, Plus, User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

export default function Forums() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', category: 'general' });

  const threads = [
    {
      id: 1,
      title: 'How to deploy React app to production?',
      author: 'John Doe',
      category: 'Web Development',
      replies: 12,
      views: 145,
      timestamp: '2 hours ago',
      lastReply: '30 mins ago',
    },
    {
      id: 2,
      title: 'Understanding Big O Notation',
      author: 'Jane Smith',
      category: 'Data Structures',
      replies: 8,
      views: 89,
      timestamp: '5 hours ago',
      lastReply: '1 hour ago',
    },
    {
      id: 3,
      title: 'SQL JOIN vs UNION - When to use which?',
      author: 'Mike Johnson',
      category: 'Database Systems',
      replies: 15,
      views: 234,
      timestamp: '1 day ago',
      lastReply: '3 hours ago',
    },
    {
      id: 4,
      title: 'Best practices for React State Management',
      author: 'Sarah Williams',
      category: 'Web Development',
      replies: 20,
      views: 312,
      timestamp: '2 days ago',
      lastReply: '5 hours ago',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setToast({ message: 'Topic created successfully!', type: 'success' });
    setIsModalOpen(false);
    setNewTopic({ title: '', content: '', category: 'general' });
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Discussion Forums</h1>
            <p className="text-sm text-gray-400 mt-1">Engage with peers and instructors</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
          >
            <Plus size={20} />
            New Topic
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Threads', value: '156' },
          { label: 'Your Posts', value: '23' },
          { label: 'Unread', value: '8' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Thread List */}
      <div className="space-y-4">
        {threads.map((thread, index) => (
          <motion.div
            key={thread.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800 hover:border-orange-500/50 cursor-pointer transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-2 hover:text-orange-500 transition">
                  {thread.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    {thread.author}
                  </span>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/20">
                    {thread.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {thread.timestamp}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    {thread.replies} replies
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* New Topic Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Topic"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={newTopic.category}
              onChange={(e) => setNewTopic({ ...newTopic, category: e.target.value })}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="general">General</option>
              <option value="web-development">Web Development</option>
              <option value="data-structures">Data Structures</option>
              <option value="database-systems">Database Systems</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              required
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter topic title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              required
              rows={6}
              value={newTopic.content}
              onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Write your question or discussion topic..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Create Topic
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
