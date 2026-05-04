import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Camera, Zap, Share2, BarChart3 } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">
            📸 Driveway Estimator Pro
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Link href="/estimator">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    New Estimate
                  </Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Sign In
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20 md:py-32">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Measure Your Driveway in Seconds
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Take a photo, get AI-powered measurements, visualize materials, and
            share estimates with contractors—all from your phone.
          </p>

          {isAuthenticated ? (
            <Link href="/estimator">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
              >
                Start Estimating Now
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
              >
                Get Started Free
              </Button>
            </a>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Camera className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Capture Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Take photos of your driveway using your device camera or upload
                existing images.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Zap className="w-8 h-8 text-yellow-400 mb-2" />
              <CardTitle className="text-white">AI Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Automatically detect driveway boundaries and calculate square
                footage with AI vision.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-green-400 mb-2" />
              <CardTitle className="text-white">Real Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Get accurate material costs based on your location and current
                regional prices.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Share2 className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Share Easily</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Generate shareable links and send estimates to contractors with
                a single click.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 mb-16">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              {
                step: 1,
                title: "Capture",
                desc: "Take a photo of your driveway",
              },
              {
                step: 2,
                title: "Adjust",
                desc: "Refine corner points if needed",
              },
              { step: 3, title: "Select", desc: "Choose your material type" },
              { step: 4, title: "Preview", desc: "See the finished result" },
              {
                step: 5,
                title: "Share",
                desc: "Send to contractors instantly",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Supported Materials
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🛣️", name: "Hot Mix Asphalt" },
              { icon: "♻️", name: "Asphalt Millings" },
              { icon: "🪨", name: "Tar & Chip" },
              { icon: "⚫", name: "Gravel" },
            ].map((material, i) => (
              <Card
                key={i}
                className="bg-slate-800 border-slate-700 text-center"
              >
                <CardContent className="pt-6">
                  <div className="text-4xl mb-2">{material.icon}</div>
                  <p className="text-white font-semibold">{material.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Create your first driveway estimate today and see how easy it is to
            measure and visualize your project.
          </p>
          {isAuthenticated ? (
            <Link href="/estimator">
              <Button
                size="lg"
                className="bg-white hover:bg-slate-100 text-blue-600 font-semibold px-8 py-6"
              >
                Start Estimating
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button
                size="lg"
                className="bg-white hover:bg-slate-100 text-blue-600 font-semibold px-8 py-6"
              >
                Sign Up Free
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 mt-20 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400">
          <p>&copy; 2026 Driveway Estimator Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
