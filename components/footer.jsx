import React from 'react';

const Footer = () => {
	return (
		<footer className="border-t border-gray-200 py-12 px-6">
			<div className="max-w-6xl mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
					<div className="flex items-center space-x-2">
						<span className="text-lg max-sm:hidden text-gray-900">Bus Sync</span>
					</div>
					<div className="text-center text-sm text-gray-500">
						© 2026 Bus Sync. All rights reserved.
					</div>
				</div>
			
			</div>
		</footer>
	);
};

export default Footer;