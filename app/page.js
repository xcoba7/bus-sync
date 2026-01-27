"use client"
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, MapPin, ArrowRight, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAnimateOnce } from '@/lib/useAnimateOnce';
import Footer from "@/components/footer";
import Loader from "@/components/Loader";

export default function BusSyncHomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const shouldAnimate = useAnimateOnce('bus-sync-homepage');

  // Refs for animation targets
  const heroRef = useRef(null);
  const heroTextRef = useRef(null);
  const heroImageRef = useRef(null);
  const featuresRef = useRef(null);
  const parentsRef = useRef(null);
  const driversRef = useRef(null);
  const adminsRef = useRef(null);
  const pricingRef = useRef(null);
  const ctaRef = useRef(null);

  const handleNavigation = (e, path, role) => {
    e.preventDefault();
    if (status === 'authenticated' && session?.user?.role === role) {
      router.push(path);
    } else {
      router.push(path.replace('dashboard', 'login'));
    }
  };

  // Loading screen effect - only show once per session
  useEffect(() => {
    const hasSeenLoader = sessionStorage.getItem('bus-sync-loader-shown');

    if (hasSeenLoader) {
      // Skip loader if already shown in this session
      setIsLoading(false);
      return;
    }

    // Mark loader as shown
    sessionStorage.setItem('bus-sync-loader-shown', 'true');

    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2500);

    // Remove loader completely after fade animation (3 seconds total)
    const removeTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    if (shouldAnimate) {
      // Set initial states
      gsap.set(heroTextRef.current, { opacity: 0, y: 30 });
      gsap.set(heroImageRef.current, { opacity: 0, y: 50 });

      // Hero section fade in animation
      const heroTimeline = gsap.timeline({
        defaults: { ease: 'power3.out' }
      });

      heroTimeline
        .to(heroTextRef.current, {
          opacity: 1,
          y: 0,
          duration: 1.2,
          delay: 0.2
        })
        .to(heroImageRef.current, {
          opacity: 1,
          y: 0,
          duration: 1,
        }, '-=0.6');

      // Features section - translate in from left
      gsap.fromTo(
        featuresRef.current,
        {
          opacity: 0,
          x: -60
        },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Parents section - translate in from right
      gsap.fromTo(
        parentsRef.current,
        {
          opacity: 0,
          x: 60
        },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: parentsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Drivers section - translate in from left
      gsap.fromTo(
        driversRef.current,
        {
          opacity: 0,
          x: -60
        },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: driversRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Admins section - translate in from right
      gsap.fromTo(
        adminsRef.current,
        {
          opacity: 0,
          x: 60
        },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: adminsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Pricing section - fade in and scale
      gsap.fromTo(
        pricingRef.current,
        {
          opacity: 0,
          y: 40,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: pricingRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );

      // CTA section - fade in from bottom
      gsap.fromTo(
        ctaRef.current,
        {
          opacity: 0,
          y: 30
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [shouldAnimate]);

  const features = [
    "Real-time GPS tracking",
    "Digital attendance with QR codes",
    "Automated notifications",
    "Route optimization",
    "Complete safety tracking",
    "Advanced analytics"
  ];

  const pricing = [
    {
      name: "Basic",
      price: "99",
      buses: "10 buses",
      passengers: "500 passengers"
    },
    {
      name: "Professional",
      price: "299",
      buses: "25 buses",
      passengers: "1,500 passengers",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      buses: "Unlimited",
      passengers: "Unlimited"
    }
  ];

  return (
    <>
      {/* Loading Screen with Fade Out */}
      {isLoading && (
        <div
          className={`fixed inset-0 z-[100] bg-white transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
            }`}
        >
          <Loader />
        </div>
      )}

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'
          }`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo */}
              <span className="text-xl text-gray-900">Bus Sync</span>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                <button onClick={(e) => handleNavigation(e, '/parent/dashboard', 'PARENT')} className="px-4 py-2 text-sm cursor-pointer border border-transparent hover:border-slate-200 active:border-black rounded-lg  text-gray-600 hover:text-gray-900 transition">
                  Parents
                </button>
                <button onClick={(e) => handleNavigation(e, '/driver/dashboard', 'DRIVER')} className="px-4 py-2 text-sm cursor-pointer border border-transparent hover:border-slate-200 active:border-black rounded-lg text-gray-600 hover:text-gray-900 transition">
                  Drivers
                </button>
                <button onClick={(e) => handleNavigation(e, '/admin/dashboard', 'ADMIN')} className="px-4 py-2 text-sm cursor-pointer border border-transparent hover:border-slate-200 active:border-black rounded-lg text-gray-600 hover:text-gray-900 transition">
                  Admins
                </button>
                <div className="w-px h-6 bg-gray-200 mx-6"></div>
                <Link href="/contact" className="ml-6 bg-black text-white px-5 py-2.5 cursor-pointer rounded-lg text-sm font-medium hover:bg-slate-800 transition">
                  Contact Us
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t">
              <div className="px-6 py-6 space-y-4">
                <a href="/parent/dashboard" className="block text-gray-600 hover:text-gray-900">Parents</a>
                <a href="/driver/dashboard" className="block text-gray-600 hover:text-gray-900">Drivers</a>
                <a href="/admin/dashboard" className="block text-gray-600 hover:text-gray-900">Admins</a>
                <div className="border-t pt-4 w-full">
                  <button className="w-full bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800">
                    <Link href='/contact'>Contact Us</Link>
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div ref={heroTextRef} className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-7xl  text-gray-900 mb-6 leading-tight">
                Modern transport management system for schools
              </h1>
              <p className="text-lg md:text-2xl text-gray-600 mb-12 leading-relaxed">
                Real-time tracking, digital attendance, and smart notifications.
                Built for schools, companies, and communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact" className="bg-black text-white px-8 py-4 rounded-lg hover:bg-slate-800 transition flex items-center justify-center space-x-2 text-base font-medium">
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/contact" className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-gray-400 transition text-base font-medium">
                  Schedule Demo
                </Link>
              </div>
              {/*<p className="text-sm text-gray-500 mt-6">*/}
              {/*  14-day free trial · No credit card required*/}
              {/*</p>*/}
            </div>

            {/* Hero Visual */}
            <div ref={heroImageRef} className="rounded-4xl overflow-clip mt-24 shadow-2xl border border-gray-100">
              <img src="/home.png" alt="Bus Sync Platform" className="w-full h-auto object-cover" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div ref={featuresRef} className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl  text-gray-900 mb-6">
                  Everything you need to manage transportation
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Powerful features that make bus management simple, safe, and efficient.
                </p>
                <ul className="space-y-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-black flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="overflow-clip rounded-2xl h-96">
                <img src="/home_overview.jpg" alt="Overview" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* User Sections */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto space-y-32">
            {/* Parents */}
            <div ref={parentsRef} id="parents" className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 overflow-clip rounded-2xl h-80 shadow-lg border border-gray-100">
                <img src="/home_parent.png" alt="Parent Experience" className="w-full h-full object-cover" />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-3xl md:text-4xl  text-gray-900 mb-4">For Parents</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Track your child's bus in real-time and receive instant notifications when they board or arrive.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Live GPS tracking</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Arrival notifications</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Trip history</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Drivers */}
            <div ref={driversRef} id="drivers" className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl  text-gray-900 mb-4">For Drivers</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Simple tools for route navigation, student attendance, and trip management.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-black flex-shrink-0" />
                    <span>QR code attendance</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-black flex-shrink-0" />
                    <span>Route guidance</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-black flex-shrink-0" />
                    <span>Emergency alerts</span>
                  </li>
                </ul>
              </div>
              <div className="overflow-clip rounded-2xl h-80 shadow-lg border border-gray-100">
                <img src="/home_driver.png" alt="Driver App" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Admins */}
            <div ref={adminsRef} id="admin" className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 overflow-clip rounded-2xl h-80 shadow-lg border border-gray-100">
                <img src="/home_admin.png" alt="Admin Dashboard" className="w-full h-full object-cover" />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-3xl md:text-4xl  text-gray-900 mb-4">For Admins</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Complete control over your fleet, routes, and operations from one dashboard.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span>Fleet management</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span>Route planning</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span>Analytics & reports</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/*/!* Pricing Section *!/*/}
        {/*<section className="py-24 px-6 bg-gray-50">*/}
        {/*  <div ref={pricingRef} className="max-w-6xl mx-auto">*/}
        {/*    <div className="text-center mb-16">*/}
        {/*      <h2 className="text-4xl md:text-5xl  text-gray-900 mb-4">*/}
        {/*        Simple pricing*/}
        {/*      </h2>*/}
        {/*      <p className="text-xl text-gray-600">*/}
        {/*        Start free, scale as you grow*/}
        {/*      </p>*/}
        {/*    </div>*/}
        
        {/*    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">*/}
        {/*      {pricing.map((plan, index) => (*/}
        {/*        <div*/}
        {/*          key={index}*/}
        {/*          className={`rounded-2xl p-8 ${plan.popular*/}
        {/*            ? 'bg-black text-white ring-4 ring-black ring-offset-4'*/}
        {/*            : 'bg-white border border-gray-200'*/}
        {/*            }`}*/}
        {/*        >*/}
        {/*          <h3 className={`text-xl font-semibold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>*/}
        {/*            {plan.name}*/}
        {/*          </h3>*/}
        {/*          <div className="mb-6">*/}
        {/*            {plan.price === 'Custom' ? (*/}
        {/*              <div className={`text-4xl  ${plan.popular ? 'text-white' : 'text-gray-900'}`}>*/}
        {/*                Custom*/}
        {/*              </div>*/}
        {/*            ) : (*/}
        {/*              <>*/}
        {/*                <span className={`text-5xl  ${plan.popular ? 'text-white' : 'text-gray-900'}`}>*/}
        {/*                  ${plan.price}*/}
        {/*                </span>*/}
        {/*                <span className={plan.popular ? 'text-blue-100' : 'text-gray-600'}>/mo</span>*/}
        {/*              </>*/}
        {/*            )}*/}
        {/*          </div>*/}
        {/*          <div className={`space-y-2 mb-8 text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>*/}
        {/*            <p>{plan.buses}</p>*/}
        {/*            <p>{plan.passengers}</p>*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*      ))}*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</section>*/}

        {/* CTA Section */}
        <section className="py-24 px-6">
          <div ref={ctaRef} className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl  text-gray-900 mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join hundreds of organizations using Bus Sync
            </p>
            <Link href="/contact" className="bg-black text-white px-8 py-4 rounded-lg hover:bg-slate-800 transition text-base font-medium inline-flex items-center space-x-2">
              <span>Start Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}

