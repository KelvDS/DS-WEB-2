export default function About() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <h1 className="section-title gradient-text">About Us</h1>
        
        <div className="max-w-4xl mx-auto">
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-gold mb-4">Our Story</h2>
            <p className="text-gray-300 mb-4">
              Da'perfect Studios was founded with a passion for capturing life's most precious moments. 
              We believe every photo tells a story, and we're dedicated to telling yours with artistry and precision.
            </p>
            <p className="text-gray-300">
              With years of experience in photography and videography, our team brings expertise, 
              creativity, and professionalism to every project.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-blue mb-4">Our Mission</h2>
            <p className="text-gray-300">
              To provide exceptional photography services that exceed expectations, delivering 
              stunning visuals that our clients will treasure for a lifetime.
            </p>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold text-gold mb-4">What We Offer</h2>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start"><span className="text-gold mr-2">•</span>Event Photography & Videography</li>
              <li className="flex items-start"><span className="text-gold mr-2">•</span>Portrait & Headshot Sessions</li>
              <li className="flex items-start"><span className="text-gold mr-2">•</span>Wedding & Engagement Photography</li>
              <li className="flex items-start"><span className="text-gold mr-2">•</span>Commercial & Product Photography</li>
              <li className="flex items-start"><span className="text-gold mr-2">•</span>Secure Online Galleries</li>
              <li className="flex items-start"><span className="text-gold mr-2">•</span>High-Resolution Image Delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}