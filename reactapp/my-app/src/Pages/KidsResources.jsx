import React, { useEffect, useState } from "react";
import { FaVideo, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import KidsSidebar from "./KidsSidebar"; // <-- Add this import

const mockResources = [
  {
    id: 1,
    title: "Alphabet Exercises for Kids",
    content: "https://www.youtube.com/embed/ccEpTTZW34g",
    type: "video",
    category: "Speech Therapy",
    duration: "2 min",
    thumbnail: "https://img.youtube.com/vi/ccEpTTZW34g/hqdefault.jpg"
  },
  {
    id: 2,
    title: "Animal Name Exercises for Better Pronunciation",
    content: "https://www.youtube.com/embed/4jeHK_9NiXI",
    type: "video",
    category: "Speech Therapy",
    duration: "18 min",
    thumbnail: "https://img.youtube.com/vi/4jeHK_9NiXI/hqdefault.jpg"
  },
  {
    id: 3,
    title: "Clever Fish - English Stories For Kids",
    content: "https://www.youtube.com/embed/QUTYxwTsbiM",
    type: "video",
    category: "Speech Therapy",
    duration: "3 min",
    thumbnail: "https://img.youtube.com/vi/QUTYxwTsbiM/hqdefault.jpg"
  }
];

const KidsResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setResources(mockResources);
    setLoading(false);
  }, []);

  const categories = ["All", ...new Set(mockResources.map(res => res.category))];

  const filteredResources = resources.filter(res => {
    const matchesCategory = activeCategory === "All" || res.category === activeCategory;
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  const getIconForType = (type) => <FaVideo className="text-[#3B1E54]" />;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#EEEEEE]">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#3B1E54]"></div>
          <h4 className="mt-4 font-bold text-lg text-[#3B1E54]">Loading Resources...</h4>
          <p className="text-[#9B7EBD]">Gathering valuable information for you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#EEEEEE]">
      {/* Kids Sidebar */}
      <KidsSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="bg-[#D4BEE4] p-6 rounded-2xl shadow-lg"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-[#3B1E54] flex items-center">
                Vocacare Resources
              </h1>
              <div className="flex mt-3 md:mt-0 space-x-2">
                <input
                  type="text"
                  placeholder="Search resources..."
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B1E54]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B1E54]"
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[#3B1E54]">
              Learn more about speech therapy exercises for children.
            </p>
          </motion.div>

          {/* Resources Grid */}
          {filteredResources.length === 0 ? (
            <motion.div variants={itemVariants} className="text-center py-10">
              <div className="bg-[#9B7EBD] text-[#EEEEEE] p-4 rounded-lg">
                <h4>No resources found</h4>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(res => (
                <motion.div
                  key={res.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="bg-[#EEEEEE] rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#D4BEE4] rounded-full">
                      {getIconForType(res.type)}
                    </div>
                    <span className="bg-[#9B7EBD] text-[#EEEEEE] text-xs px-2 py-1 rounded">
                      {res.category}
                    </span>
                  </div>
                  <h5 className="font-bold text-lg mb-2 text-[#3B1E54]">{res.title}</h5>
                  {res.type === "video" && (
                    <>
                      <div className="aspect-video mb-3">
                        <iframe
                          src={res.content}
                          title={res.title}
                          allowFullScreen
                          className="w-full h-full rounded-lg"
                        ></iframe>
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-[#3B1E54] text-sm flex items-center">
                          <FaVideo className="mr-1" /> {res.duration}
                        </span>
                        <a
                          href={res.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3B1E54] font-semibold flex items-center"
                        >
                          Watch <FaArrowRight className="ml-1" />
                        </a>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Call to Action */}
          <motion.div variants={itemVariants} className="mt-10 pt-6 border-t border-[#3B1E54]">
            <div className="bg-[#3B1E54] text-[#EEEEEE] p-6 rounded-xl shadow-lg text-center">
              <h4 className="text-xl md:text-2xl font-bold flex justify-center items-center mb-3">
                Ready to Start Therapy?
              </h4>
              <p className="mb-4">Explore exercises and improve your health with guided therapy sessions.</p>
              <button
                className="bg-[#D4BEE4] text-[#3B1E54] font-bold px-6 py-2 rounded-lg hover:bg-[#9B7EBD] transition flex items-center justify-center mx-auto"
                onClick={() => navigate("/ai-assistant")}
              >
                Start Therapy <FaArrowRight className="ml-2" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default KidsResources;
