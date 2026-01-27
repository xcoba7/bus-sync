import React from 'react';

const Loader = () => {
	return (
		<div className="min-h-screen  text-black flex items-center justify-center">
			<div className="flex flex-col items-center">
				<div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
				<p className="mt-8 text-5xl tracking-widest uppercase">Bus Sync</p>
			</div>
		</div>
	);
};

export default Loader;