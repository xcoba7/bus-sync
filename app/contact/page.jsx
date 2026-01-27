'use client'
import React, { useState } from 'react';
import { MapPin, Mail, Phone, MessageSquare, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Footer from "@/components/footer";
export default function ContactPage() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		organizationType: '',
		message: ''
	});
	const [submitted, setSubmitted] = useState(false);
	
	const handleSubmit = (e) => {
		e.preventDefault();
		// Simulate form submission
		setSubmitted(true);
		setTimeout(() => {
			setSubmitted(false);
			setFormData({ name: '', email: '', organizationType: '', message: '' });
		}, 3000);
	};
	
	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	};
	
	return (
		<div className="min-h-screen bg-white">
			{/* Navigation */}
			<nav className="bg-white border-b border-gray-200 sticky top-0">
				<div className="max-w-7xl mx-auto px-6 lg:px-8">
					<div className="flex items-center justify-between h-20">
						<Link href="/" className="flex items-center space-x-2">
							<span className="text-xl  text-gray-900">Bus Sync</span>
						</Link>
						<Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition">
							Back to Home
						</Link>
					</div>
				</div>
			</nav>
			
			{/* Hero Section */}
			<section className="pt-20 pb-12 px-6">
				<div className="max-w-6xl mx-auto text-center">
					<h1 className="text-5xl md:text-6xl  text-gray-900 mb-6">
						Get in touch
					</h1>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						Interested in our services, seeking support, exploring career opportunities, or need to file a complaint? We're here to listen.
					</p>
				</div>
			</section>
			
			{/* Contact Section */}
			<section className="py-12 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="grid md:grid-cols-2 gap-12">
						{/* Contact Form */}
						<div className="bg-gray-50 rounded-2xl p-8 md:p-12">
							<h2 className="text-3xl  text-gray-900 mb-6">Send us a message</h2>
							
							{submitted ? (
								<div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
									<CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
									<h3 className="text-2xl  text-gray-900 mb-2">Message sent!</h3>
									<p className="text-gray-600">
										Thank you for contacting us. We'll get back to you within 24 hours.
									</p>
								</div>
							) : (
								<div className="space-y-6">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Full Name
										</label>
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleChange}
											className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
											placeholder="John Smith"
										/>
									</div>
									
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Email Address
										</label>
										<input
											type="email"
											name="email"
											value={formData.email}
											onChange={handleChange}
											className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
											placeholder="john@example.com"
										/>
									</div>
									
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											What can we help you with?
										</label>
										<select
											name="organizationType"
											value={formData.organizationType}
											onChange={handleChange}
											className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
										>
											<option value="">Select a topic</option>
											<option value="sales">Sales & Pricing</option>
											<option value="support">Technical Support</option>
											<option value="demo">Request a Demo</option>
											<option value="careers">Careers & Employment</option>
											<option value="complaint">File a Complaint</option>
											<option value="feedback">Product Feedback</option>
											<option value="partnership">Partnership Inquiry</option>
											<option value="other">Other</option>
										</select>
									</div>
									
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Message
										</label>
										<textarea
											name="message"
											value={formData.message}
											onChange={handleChange}
											rows="5"
											className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
											placeholder="Tell us about your transportation needs..."
										/>
									</div>
									
									<button
										onClick={handleSubmit}
										className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-slate-800 transition font-medium flex items-center justify-center space-x-2"
									>
										<span>Send Message</span>
										<Send className="w-5 h-5" />
									</button>
								</div>
							)}
						</div>
						
						{/* Contact Information */}
						<div className="space-y-8">
							<div>
								<h2 className="text-3xl  text-gray-900 mb-6">Contact Information</h2>
								<p className="text-lg text-gray-600 mb-8">
									Choose the best way to reach us. We're available Monday to Friday, 9 AM - 6 PM (EST).
								</p>
							</div>
							
							{/* Contact Methods */}
							<div className="space-y-6">
								<div className="flex items-start space-x-4">
									<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
										<Mail className="w-6 h-6 text-black" />
									</div>
									<div>
										<h3 className=" text-gray-900 mb-1">General Inquiries</h3>
										<p className="text-gray-600 mb-2">Sales, support, and general questions</p>
										<Link href="mailto:hello@bussync.com" className="text-black hover:text-slate-800 font-medium">
											hello@bussync.com
										</Link>
									</div>
								</div>
								
								<div className="flex items-start space-x-4">
									<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
										<Phone className="w-6 h-6 text-black" />
									</div>
									<div>
										<h3 className=" text-gray-900 mb-1">Phone Support</h3>
										<p className="text-gray-600 mb-2">Mon-Fri from 9am to 6pm EST</p>
										<Link href="tel:+1234567890" className="text-black hover:text-slate-800 font-medium">
											+1 (234) 567-890
										</Link>
									</div>
								</div>
								
								<div className="flex items-start space-x-4">
									<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
										<MessageSquare className="w-6 h-6 text-black" />
									</div>
									<div>
										<h3 className=" text-gray-900 mb-1">Live Chat</h3>
										<p className="text-gray-600 mb-2">Get instant help from our team</p>
										<button className="text-black hover:text-slate-800 font-medium">
											Start a chat →
										</button>
									</div>
								</div>
							</div>
							
							{/* Additional Contact Info */}
							<div className="pt-8 border-t border-gray-200">
								<h3 className=" text-gray-900 mb-4 font-semibold">Other Ways to Reach Us</h3>
								<div className="space-y-3 text-sm">
									<div>
										<span className="font-medium text-gray-900">Careers:</span>
										<Link href="mailto:careers@bussync.com" className="text-black hover:text-slate-800 ml-2">
											careers@bussync.com
										</Link>
									</div>
									<div>
										<span className="font-medium text-gray-900">Support:</span>
										<Link href="mailto:support@bussync.com" className="text-black hover:text-slate-800 ml-2">
											support@bussync.com
										</Link>
									</div>
									<div>
										<span className="font-medium text-gray-900">Complaints:</span>
										<Link href="mailto:complaints@bussync.com" className="text-black hover:text-slate-800 ml-2">
											complaints@bussync.com
										</Link>
									</div>
								</div>
							</div>
							
							
						</div>
					</div>
				</div>
			</section>
			
			{/* FAQ Section */}
			<section className="py-20 px-6 bg-gray-50">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl md:text-4xl  text-gray-900 mb-4 text-center">
						Frequently Asked Questions
					</h2>
					<p className="text-lg text-gray-600 text-center mb-12">
						Find quick answers to common questions
					</p>
					
					<div className="space-y-6">
						<details className="bg-white rounded-xl p-6 border border-gray-200 group">
							<summary className=" text-gray-900 cursor-pointer list-none flex justify-between items-center">
								How long does setup take?
								<span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
							</summary>
							<p className="text-gray-600 mt-4">
								Most organizations can be up and running within 24-48 hours. We provide full onboarding support including data migration, training, and setup assistance.
							</p>
						</details>
						
						<details className="bg-white rounded-xl p-6 border border-gray-200 group">
							<summary className=" text-gray-900 cursor-pointer list-none flex justify-between items-center">
								What support do you offer?
								<span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
							</summary>
							<p className="text-gray-600 mt-4">
								All plans include email support with 24-hour response time. Professional and Enterprise plans include priority support, phone support, and dedicated account management.
							</p>
						</details>
						
						<details className="bg-white rounded-xl p-6 border border-gray-200 group">
							<summary className=" text-gray-900 cursor-pointer list-none flex justify-between items-center">
								Can I try before buying?
								<span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
							</summary>
							<p className="text-gray-600 mt-4">
								Yes! We offer a 14-day free trial with full access to all features. No credit card required. You can also schedule a personalized demo with our team.
							</p>
						</details>
						
						<details className="bg-white rounded-xl p-6 border border-gray-200 group">
							<summary className=" text-gray-900 cursor-pointer list-none flex justify-between items-center">
								Do you offer custom pricing for large organizations?
								<span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
							</summary>
							<p className="text-gray-600 mt-4">
								Yes. For organizations with 30+ buses or special requirements, we offer custom Enterprise plans with flexible pricing, dedicated support, and custom integrations. Contact our sales team for details.
							</p>
						</details>
						
						<details className="bg-white rounded-xl p-6 border border-gray-200 group">
							<summary className=" text-gray-900 cursor-pointer list-none flex justify-between items-center">
								Is my data secure?
								<span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
							</summary>
							<p className="text-gray-600 mt-4">
								Absolutely. We use bank-level encryption, secure cloud infrastructure, and comply with all major data protection regulations including GDPR and COPPA. Your data is backed up daily and we never share it with third parties.
							</p>
						</details>
					</div>
				</div>
			</section>
			
			{/* Footer */}
			<Footer />
		</div>
	);
}