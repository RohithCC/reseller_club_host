import { useState } from "react";

const guides = [
  {
    id: 1,
    term: "Robotics",
    stat: "Thumbs up 63%",
    color: "bg-cyan-400",
    desc: "Robotics is an interdisciplinary branch of engineering which combines IoT, coding, electronics, mechanical design & AI to design robots.",
    image: "https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?w=500&q=80",
  },
  {
    id: 2,
    term: "Coding",
    stat: "Kids love it 91%",
    color: "bg-green-400",
    desc: "Coding is a method for humans to communicate with machines. It drives most things around you — machines, robots, mobile apps, digital games, websites and desktop software.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&q=80",
  },
  {
    id: 3,
    term: "Artificial Intelligence",
    stat: "Future ready 88%",
    color: "bg-purple-400",
    desc: "AI enables machines to simulate human intelligence — learning, reasoning and problem-solving. It powers everything from voice assistants to self-driving cars.",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=500&q=80",
  },
  {
    id: 4,
    term: "IoT & Electronics",
    stat: "Hands-on 77%",
    color: "bg-orange-400",
    desc: "The Internet of Things connects everyday devices to the internet, allowing them to send and receive data — creating smart homes, cities and industries.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80",
  },
];

export default function GuideSlider() {
  const [active, setActive] = useState(0);
  const item = guides[active];

  return (
    <section className="bg-cyan-400 py-16 px-4 overflow-hidden relative">
      {/* Decorative doodles */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 text-white text-6xl select-none">⚙️</div>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 text-white text-6xl select-none">🤖</div>

      <div className="max-w-5xl mx-auto text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
          Your Guide to AI, Robotics Kits & Coding
        </h2>
        <p className="text-white/80 text-base md:text-lg font-medium">
          Easy explanations of common terms kickstart your child's innovation journey.
        </p>
      </div>

      {/* Slider */}
      <div className="max-w-4xl mx-auto relative flex items-center justify-center gap-4">
        {/* Prev */}
        <button
          onClick={() => setActive((a) => (a - 1 + guides.length) % guides.length)}
          className="flex-shrink-0 bg-white/30 hover:bg-white/60 text-white w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold transition-all"
        >
          ‹
        </button>

        {/* Cards row */}
        <div className="flex items-center gap-4 overflow-hidden w-full justify-center">
          {/* Side ghost card */}
          <div className="hidden md:block w-36 h-56 bg-cyan-300/50 rounded-2xl backdrop-blur-sm flex-shrink-0 opacity-60 overflow-hidden">
            <img
              src={guides[(active - 1 + guides.length) % guides.length].image}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute bottom-3 left-3">
              <span className={`${guides[(active - 1 + guides.length) % guides.length].color} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                {guides[(active - 1 + guides.length) % guides.length].stat}
              </span>
            </div>
          </div>

          {/* ACTIVE CARD */}
          <div className="flex-shrink-0 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="relative md:w-48 h-52 md:h-auto flex-shrink-0">
                <img src={item.image} alt={item.term} className="w-full h-full object-cover" />
                <span className={`absolute bottom-3 left-3 ${item.color} text-white text-xs font-bold px-3 py-1 rounded-full shadow`}>
                  {item.stat}
                </span>
              </div>
              <div className="p-6 flex flex-col justify-center">
                <h3 className="text-xl font-black text-gray-900 mb-3">{item.term}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </div>

          {/* Right ghost */}
          <div className="hidden md:block w-36 h-56 bg-cyan-300/50 rounded-2xl backdrop-blur-sm flex-shrink-0 opacity-60 overflow-hidden">
            <img
              src={guides[(active + 1) % guides.length].image}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          </div>
        </div>

        {/* Next */}
        <button
          onClick={() => setActive((a) => (a + 1) % guides.length)}
          className="flex-shrink-0 bg-white/30 hover:bg-white/60 text-white w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold transition-all"
        >
          ›
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {guides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${i === active ? "bg-white w-8" : "bg-white/40 w-2.5"}`}
          />
        ))}
      </div>
    </section>
  );
}
