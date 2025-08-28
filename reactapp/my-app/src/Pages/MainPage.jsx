import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from './photos/icon1.png';
import heroImg from './photos/photo2.jpg';
import whyUsImg from './photos/photo3.jpg';
import featuresImg from './photos/photo4.jpg';
import faqImg from './photos/photo4.jpg';
import contactImg from './photos/photo5.jpg';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-[#3B1E54] shadow-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="VocaCare Logo" className="w-12 h-12 rounded-full border-2 border-white" />
          <h1 className="text-xl font-bold text-[#EEEEEE]">VocaCare</h1>
        </div>
        <div className="hidden md:flex space-x-6 items-center">
          <a href="#features" className="hover:text-[#9B7EBD] text-[#EEEEEE] transition">Features</a>
          <a href="#faq" className="hover:text-[#9B7EBD] text-[#EEEEEE] transition">FAQ</a>
          <a href="#contact" className="hover:text-[#9B7EBD] text-[#EEEEEE] transition">Contact</a>
          <button className="px-4 py-2 border border-[#EEEEEE] rounded-lg text-[#EEEEEE] hover:bg-[#9B7EBD] transition" onClick={() => navigate('/login')}>Login</button>
          <button className="px-4 py-2 bg-[#EEEEEE] text-[#3B2F2F] rounded-lg hover:bg-[#9B7EBD] transition" onClick={() => navigate('/signup')}>Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative h-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 z-10" />
        <div className="relative z-20 text-center text-white px-6">
          <motion.h1
            className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Welcome to VocaCare
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl mb-6 drop-shadow-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            Empowering voices with AI-powered speech therapy. Personalized, engaging, and effective for all ages.
          </motion.p>
          <button
            className="px-6 py-3 bg-[#3B1E54] rounded-2xl hover:bg-[#9B7EBD] transition"
            onClick={() => navigate('/signup')}
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-20 bg-[#EEEEEE]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
          <motion.img
            src={whyUsImg}
            alt="Why Choose Us"
            className="md:w-1/2 rounded-xl shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          />
          <motion.div
            className="md:w-1/2 text-center md:text-left"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-[#3B1E54]">Why Choose VocaCare?</h2>
            <p className="text-lg text-[#3B1E54]">
              We combine AI, expert-designed exercises, and interactive tools to make speech therapy simple, effective, and fun.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#D4BEE4]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12 text-[#3B1E54]">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="bg-[#EEEEEE] rounded-2xl p-8 shadow hover:shadow-xl transition transform hover:-translate-y-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h3 className="text-xl font-semibold mb-3 text-[#3B1E54]">Real-Time Feedback</h3>
              <p className="text-[#3B1E54]">Receive instant AI-powered feedback to improve your pronunciation and articulation effectively.</p>
            </motion.div>
            <motion.div
              className="bg-[#EEEEEE] rounded-2xl p-8 shadow hover:shadow-xl transition transform hover:-translate-y-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-3 text-[#3B1E54]">Interactive Exercises</h3>
              <p className="text-[#3B1E54]">Engage with fun, adaptive, and interactive activities tailored to your speech goals.</p>
            </motion.div>
            <motion.div
              className="bg-[#EEEEEE] rounded-2xl p-8 shadow hover:shadow-xl transition transform hover:-translate-y-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <h3 className="text-xl font-semibold mb-3 text-[#3B1E54]">Progress Tracking</h3>
              <p className="text-[#3B1E54]">Visual analytics and progress charts help you monitor your improvements over time.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-[#9B7EBD] text-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-10">
          <div className="md:w-1/2 space-y-4">
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <details className="bg-white/20 p-4 rounded-lg">
              <summary className="font-semibold cursor-pointer">Is this app suitable for children?</summary>
              <p className="mt-2 text-white">Yes! VocaCare is designed for children (ages 0–5) and older users as well.</p>
            </details>
            <details className="bg-white/20 p-4 rounded-lg">
              <summary className="font-semibold cursor-pointer">Do I need a therapist?</summary>
              <p className="mt-2 text-white">No, the AI guides you through exercises, but therapists can also use it as a companion tool.</p>
            </details>
            <details className="bg-white/20 p-4 rounded-lg">
              <summary className="font-semibold cursor-pointer">Can I track my progress?</summary>
              <p className="mt-2 text-white">Absolutely! Detailed analytics and progress charts are available anytime.</p>
            </details>
          </div>
          <motion.img
            src={faqImg}
            alt="FAQ"
            className="md:w-1/2 rounded-xl shadow-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />
        </div>
      </section>

     {/* Contact Section */}
<section id="contact" className="py-20 bg-[#D4BEE4]">
  <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
    
    {/* Image Side */}
    <motion.img
      src={contactImg}
      alt="Contact"
      className="md:w-1/2 rounded-xl shadow-lg"
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 1 }}
    />

    {/* Form Side */}
    <motion.div
      className="md:w-1/2 bg-white/90 p-8 rounded-2xl shadow-lg"
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 1 }}
    >
      <h2 className="text-3xl font-bold mb-6 text-[#3B1E54]">Contact Us</h2>
      <p className="mb-6 text-[#3B1E54]">Have questions? We'd love to hear from you!</p>
      <form className="space-y-4">
        <input type="text" placeholder="Your Name" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B1E54]" />
        <input type="email" placeholder="Your Email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B1E54]" />
        <textarea placeholder="Your Message" rows="4" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B1E54]"></textarea>
        <button type="submit" className="w-full px-6 py-3 bg-[#3B1E54] text-[#EEEEEE] rounded-2xl hover:bg-[#9B7EBD] transition">
          Send Message
        </button>
      </form>
    </motion.div>
  </div>
</section>

    </div>
  );
}
