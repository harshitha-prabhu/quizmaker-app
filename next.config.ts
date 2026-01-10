import type { NextConfig } from "next";

// Initialize OpenNext Cloudflare for development
// This must be called before the config is exported
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings
// It automatically reads from wrangler.jsonc or wrangler.toml
if (process.env.NODE_ENV === 'development') {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");

		// Initialize - this sets up the Cloudflare context for local development
		// It reads D1 database bindings from wrangler.jsonc and uses the local database
		// The local database should have all migrations applied via: 
		// npx wrangler d1 migrations apply quizmaker-demo-app-database --local
		initOpenNextCloudflareForDev();

		console.log('[OpenNext] Initialized Cloudflare dev environment');
	} catch (error) {
		console.error('[OpenNext] Failed to initialize Cloudflare dev environment:', error);
		// Don't throw - let it fail gracefully
	}
}

const nextConfig: NextConfig = {
	// Optimize build performance
	//swcMinify: true,

	// Disable image optimization due to Windows compatibility issues with resvg.wasm
	// Re-enable when deploying from Linux/WSL or CI/CD
	images: {
		unoptimized: true,
	},

	// TypeScript configuration - skip during build for speed (run separately)
	typescript: {
		// Skip type checking during build for faster builds
		// Run 'npm run type-check' separately if needed
		ignoreBuildErrors: true,
	},

	// Optimize package imports
	experimental: {
		optimizePackageImports: [
			'@radix-ui/react-dialog',
			'@radix-ui/react-dropdown-menu',
			'@radix-ui/react-label',
			'@radix-ui/react-separator',
			'@radix-ui/react-slot',
			'@radix-ui/react-tabs',
			'lucide-react',
		],
	},

	// Compiler optimizations
	compiler: {
		// Remove console logs in production
		removeConsole: process.env.NODE_ENV === 'production' ? {
			exclude: ['error', 'warn'],
		} : false,
	},
};

export default nextConfig;
