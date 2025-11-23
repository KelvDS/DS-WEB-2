export default function Pricing() {
  const plans = [
    {
      name: 'Basic',
      price: '$299',
      features: ['2 hours coverage', '50 edited photos', 'Online gallery', 'Watermarked previews', 'Digital downloads']
    },
    {
      name: 'Professional',
      price: '$599',
      popular: true,
      features: ['4 hours coverage', '150 edited photos', 'Online gallery', 'Watermarked previews', 'Digital downloads', 'Print release', '1 photographer']
    },
    {
      name: 'Premium',
      price: '$999',
      features: ['8 hours coverage', '300+ edited photos', 'Online gallery', 'Watermarked previews', 'Digital downloads', 'Print release', '2 photographers', 'Same-day preview']
    }
  ];

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <h1 className="section-title gradient-text">Pricing Plans</h1>
        <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
          Choose the perfect package for your photography needs
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <div key={idx} className={`card relative ${plan.popular ? 'border-2 border-gold' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gold text-gray-900 px-4 py-1 rounded-full text-sm font-bold">POPULAR</span>
                </div>
              )}

              <h3 className="text-2xl font-bold text-center mb-4">{plan.name}</h3>
              <p className="text-4xl font-bold text-center text-gold mb-6">{plan.price}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-gray-300">
                    <svg className="w-5 h-5 text-gold mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={plan.popular ? 'btn-primary w-full' : 'btn-outline w-full'}>Choose Plan</button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">Need a custom package?</p>
          <a href="/contact" className="btn-secondary">Contact Us</a>
        </div>
      </div>
    </div>
  );
}