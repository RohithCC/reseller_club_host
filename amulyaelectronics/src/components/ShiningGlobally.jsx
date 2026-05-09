const awards = [
  {
    label: "Smart Toys Award 2.0",
    image: null,
    emoji: "🏆",
    color: "bg-yellow-50 border-yellow-200",
    textColor: "text-yellow-700",
  },
  {
    label: "STEM Accredited Experience",
    image: null,
    emoji: "🛡️",
    color: "bg-red-50 border-red-200",
    textColor: "text-red-700",
  },
  {
    label: "STEM Authenticated Product",
    image: null,
    emoji: "✅",
    color: "bg-orange-50 border-orange-200",
    textColor: "text-orange-700",
  },
  {
    label: "BW Education Award",
    image: null,
    emoji: "🎓",
    color: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
  },
  {
    label: "CII Design Award",
    image: null,
    emoji: "🏅",
    color: "bg-indigo-50 border-indigo-200",
    textColor: "text-indigo-700",
  },
];

const institutions = [
  { name: "IIT Delhi", emoji: "🏛️" },
  { name: "CBSE Schools", emoji: "📚" },
  { name: "Kendriya Vidyalaya", emoji: "🏫" },
  { name: "Delhi Public School", emoji: "🎒" },
  { name: "Ryan International", emoji: "🌟" },
  { name: "The Orchid School", emoji: "🌸" },
  { name: "MIT School", emoji: "🔬" },
  { name: "Amity Schools", emoji: "🎯" },
];

const stats = [
  { value: "50,000+", label: "Happy Kids" },
  { value: "1,200+", label: "Schools" },
  { value: "28+", label: "States" },
  { value: "15+", label: "Awards" },
];

export default function ShiningGlobally() {
  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-[1400px] mx-auto">

        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-cyan-500 mb-2">Shining Globally</h2>
          <p className="text-cyan-600 font-medium text-base md:text-lg max-w-2xl mx-auto">
            Honored for Excellence in AI & Innovation Labs, Robotics Kits & STEM Learning
          </p>
        </div>

        {/* Awards strip */}
        <div className="flex flex-wrap justify-center gap-4 mb-14">
          {awards.map((a) => (
            <div
              key={a.label}
              className={`flex items-center gap-3 border-2 ${a.color} rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-shadow`}
            >
              <span className="text-3xl">{a.emoji}</span>
              <span className={`font-black text-sm ${a.textColor} max-w-[120px] leading-tight`}>{a.label}</span>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl p-8 mb-14 grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-black mb-1">{s.value}</div>
              <div className="text-white/80 font-medium text-sm md:text-base">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Trusted Institutions */}
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-4xl font-black text-orange-500 mb-1">
            Trusted by Renowned Institutions
          </h3>
          <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full mb-8" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {institutions.map((inst) => (
            <div
              key={inst.name}
              className="flex items-center gap-3 bg-gray-50 hover:bg-cyan-50 border border-gray-100 hover:border-cyan-200 rounded-2xl px-4 py-3 transition-all duration-200 hover:shadow-md"
            >
              <span className="text-2xl">{inst.emoji}</span>
              <span className="font-bold text-gray-700 text-sm">{inst.name}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
