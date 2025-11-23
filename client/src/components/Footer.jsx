export default function Footer() {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-gold mb-4">Da'perfect Studios</h3>
            <p className="text-gray-400">Capturing perfect moments through the lens.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/about" className="hover:text-gold transition">About</a></li>
              <li><a href="/pricing" className="hover:text-gold transition">Pricing</a></li>
              <li><a href="/contact" className="hover:text-gold transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <p className="text-gray-400">Email: info@daperfectstudios.com</p>
            <p className="text-gray-400">Phone: +123 456 7890</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Da'perfect Studios. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}