import { useState } from "react";
import { useNavigate } from "react-router-dom";

const tabs = ["Using a DIY Kit", "Online Classes"];

const kits = [
  {
    title: "Robotics",
    age: "For Ages 8+",
    image: "https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?w=400&q=80",
    link: "/collection?cat=robotics",
    color: "from-blue-500 to-blue-700",
  },
  {
    title: "Mechanical Design",
    age: "For Ages 8+",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=80",
    link: "/collection?cat=mechanical",
    color: "from-orange-500 to-orange-700",
  },
  {
    title: "Coding",
    age: "For Ages 5+",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
    link: "/collection?cat=coding",
    color: "from-green-500 to-green-700",
  },
  {
    title: "IoT & Electronics",
    age: "For Ages 10+",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
    link: "/collection?cat=iot",
    color: "from-purple-500 to-purple-700",
  },
];

const courses = [
  {
    title: "AI & Machine Learning",
    age: "For Ages 12+",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80",
    link: "/collection?cat=ai",
    color: "from-cyan-500 to-cyan-700",
  },
  {
    title: "Python Programming",
    age: "For Ages 10+",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80",
    link: "/collection?cat=python",
    color: "from-yellow-500 to-yellow-700",
  },
  {
    title: "Web Development",
    age: "For Ages 12+",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80",
    link: "/collection?cat=web",
    color: "from-red-500 to-red-700",
  },
  {
    title: "Game Design",
    age: "For Ages 10+",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80",
    link: "/collection?cat=games",
    color: "from-pink-500 to-pink-700",
  },
];

export default function LearningPreference() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const items = tab === 0 ? kits : courses;

  return (
    <section className="bg-green-400 py-16 px-4 relative overflow-hidden">
      {/* Decorative doodles */}
      <div className="absolute left-4 bottom-8 opacity-15 text-6xl select-none">📱</div>
      <div className="absolute right-4 top-8 opacity-15 text-6xl select-none">🎮</div>
      <div className="absolute left-1/4 bottom-0 opacity-10 text-7xl select-none">⚙️</div>

      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-6">
          How Would Your Child Prefer to Learn?
        </h2>

        {/* Tabs */}
        <div className="flex justify-center mb-2">
          <div className="flex gap-1 border-b-2 border-white/30">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`px-6 py-2 text-sm font-bold transition-all duration-200 border-b-2 -mb-[2px] ${
                  tab === i
                    ? "border-white text-white"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-white font-bold text-lg mb-10">
          Explore our range of {tab === 0 ? "DIY STEM Kits" : "Online Courses"}!
        </p>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.link)}
              className="bg-white rounded-3xl overflow-hidden shadow-xl cursor-pointer hover:scale-105 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="relative h-44 md:h-52 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${item.color} opacity-0 group-hover:opacity-20 transition-opacity`} />
              </div>
              <div className="p-4">
                <h3 className="font-black text-gray-900 text-base md:text-lg leading-tight">{item.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{item.age}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}