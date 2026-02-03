import { Inspector } from '@/components/inspector';
import { DemoCard, DemoForm, DemoStats } from '@/demo';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Natural UI Editor
          </h1>
          <p className="text-gray-600">
            Click "Edit UI" and select any element to modify it with natural language
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Dashboard Stats</h2>
          <DemoStats />
        </section>

        {/* Cards and form section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DemoCard
                title="Wireless Headphones"
                description="High-quality wireless headphones with noise cancellation and 30-hour battery life."
                image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"
                price={199.99}
                tags={['Electronics', 'Audio', 'Wireless']}
              />
              <DemoCard
                title="Smart Watch"
                description="Track your fitness, receive notifications, and more with this stylish smart watch."
                image="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop"
                price={299.99}
                tags={['Electronics', 'Wearable']}
              />
              <DemoCard
                title="Laptop Stand"
                description="Ergonomic aluminum laptop stand for better posture and improved airflow."
                image="https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop"
                price={49.99}
                tags={['Accessories', 'Office']}
              />
              <DemoCard
                title="Mechanical Keyboard"
                description="Premium mechanical keyboard with RGB backlighting and hot-swappable switches."
                image="https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400&h=300&fit=crop"
                price={149.99}
                tags={['Electronics', 'Gaming']}
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact</h2>
            <DemoForm />
          </div>
        </section>

        {/* Info section */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">How it Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Click the <strong>"Edit UI"</strong> button in the bottom right corner</li>
            <li>Hover over any element to see its source location</li>
            <li>Click an element to open the editor panel</li>
            <li>Describe what you want to change in natural language</li>
            <li>Review the AI-generated code changes</li>
          </ol>
        </section>
      </main>

      {/* Inspector overlay and toolbar */}
      <Inspector />
    </div>
  );
}

export default App;
