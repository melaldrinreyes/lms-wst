import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">MINSU E-LEARN</h3>
            <p className="text-sm mb-4">
              Empowering Digital Collaboration in Education through innovative learning solutions.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-orange-500 transition">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-orange-500 transition">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-orange-500 transition">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-orange-500 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-sm hover:text-orange-500 transition">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-orange-500 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm hover:text-orange-500 transition">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                <span>Mindanao State University, Marawi City, Philippines</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone size={18} />
                <span>+63 XXX XXX XXXX</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail size={18} />
                <span>info@minsu-elearn.edu.ph</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} MINSU E-LEARN. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
