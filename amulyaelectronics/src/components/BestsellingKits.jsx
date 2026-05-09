import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiHeart, FiShoppingCart, FiStar } from "react-icons/fi";

const products = [
  {
    id: 1,
    name: "MEX 5-in-1 Robotics Kit",
    price: 2499,
    mrp: 3499,
    rating: 4.8,
    reviews: 312,
    badge: "Best Seller",
    badgeColor: "bg-orange-500",
    image: "https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?w=400&q=80",
    link: "/product/mex-5in1",
  },
  {
    id: 2,
    name: "MAKE Robotic Advanced Kit",
    price: 2999,
    mrp: 3499,
    rating: 4.7,
    reviews: 198,
    badge: "New",
    badgeColor: "bg-green-500",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=80",
    link: "/product/make-robotic",
  },
  {
    id: 3,
    name: "Avishkaar Tweak Kit",
    price: 14599,
    mrp: 15000,
    rating: 4.9,
    reviews: 87,
    badge: "Premium",
    badgeColor: "bg-purple-600",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
    link: "/product/tweak-kit",
  },
  {
    id: 4,
    name: "Robotics Pro Kit",
    price: 18999,
    mrp: 19999,
    rating: 4.9,
    reviews: 54,
    badge: "Top Rated",
    badgeColor: "bg-blue-600",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80",
    link: "/product/robotics-pro",
  },
  {
    id: 5,
    name: "Starter Electronics Kit",
    price: 999,
    mrp: 1499,
    rating: 4.5,
    reviews: 423,
    badge: "Popular",
    badgeColor: "bg-cyan-500",
    image: "https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?w=400&q=80",
    link: "/product/starter-kit",
  },
  {
    id: 6,
    name: "AI & Sensor Module Kit",
    price: 4999,
    mrp: 6999,
    rating: 4.6,
    reviews: 145,
    badge: "Trending",
    badgeColor: "bg-red-500",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80",
    link: "/product/ai-sensor",
  },
  {
    id: 7,
    name: "Coding Beginner Kit",
    price: 1799,
    mrp: 2499,
    rating: 4.7,
    reviews: 267,
    badge: "Age 5+",
    badgeColor: "bg-yellow-500",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
    link: "/product/coding-beginner",
  },
  {
    id: 8,
    name: "Mechanical Design Pro",
    price: 8499,
    mrp: 9999,
    rating: 4.8,
    reviews: 92,
    badge: "Advanced",
    badgeColor: "bg-indigo-600",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80",
    link: "/product/mech-design-pro",
  },
];

export default function BestsellingKits() {
  const [wishlist, setWishlist] = useState([]);
  const [addedToCart, setAddedToCart] = useState([]);
  const navigate = useNavigate();

  const toggleWishlist = (id, e) => {
    e.stopPropagation();
    setWishlist((w) => w.includes(id) ? w.filter((i) => i !== id) : [...w, id]);
  };

  const addToCart = (id, e) => {
    e.stopPropagation();
    setAddedToCart((c) => [...c, id]);
    setTimeout(() => setAddedToCart((c) => c.filter((i) => i !== id)), 2000);
  };

  const discount = (price, mrp) => Math.round(((mrp - price) / mrp) * 100);

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-2">
            Our Bestselling DIY Kits
          </h2>
          <p className="text-gray-500 text-lg">Loved by 50,000+ young innovators across India</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(p.link)}
              className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 group relative"
            >
              {/* Badge */}
              <span className={`absolute top-3 left-3 z-10 ${p.badgeColor} text-white text-xs font-black px-2.5 py-1 rounded-full shadow`}>
                {p.badge}
              </span>

              {/* Wishlist */}
              <button
                onClick={(e) => toggleWishlist(p.id, e)}
                className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur p-1.5 rounded-full shadow hover:scale-110 transition-transform"
              >
                <FiHeart
                  className={`text-base ${wishlist.includes(p.id) ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                />
              </button>

              {/* Image */}
              <div className="h-40 md:h-48 overflow-hidden bg-gray-50">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight mb-2 line-clamp-2">{p.name}</h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className={`text-xs ${i < Math.floor(p.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">({p.reviews})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-black text-gray-900">₹{p.price.toLocaleString()} /-</span>
                  <span className="text-sm text-gray-400 line-through">₹{p.mrp.toLocaleString()}</span>
                  <span className="text-xs font-bold text-green-600">{discount(p.price, p.mrp)}% off</span>
                </div>

                {/* Cart Button */}
                <button
                  onClick={(e) => addToCart(p.id, e)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                    addedToCart.includes(p.id)
                      ? "bg-green-500 text-white scale-95"
                      : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/30"
                  }`}
                >
                  <FiShoppingCart className="text-base" />
                  {addedToCart.includes(p.id) ? "Added!" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All */}
        <div className="text-center mt-10">
          <button
            onClick={() => navigate("/collection")}
            className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-10 py-3 rounded-full font-black text-lg transition-all duration-200"
          >
            View All Products →
          </button>
        </div>
      </div>
    </section>
  );
}
