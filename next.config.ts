import type { NextConfig } from "next";

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

// Enable calling `getCloudflareContext()` in `next dev` only.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
// Only initialize in development mode, not during build
// Use require() with try-catch to avoid loading during build
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PHASE !== 'phase-production-build') {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
		initOpenNextCloudflareForDev();
	} catch {
		// Silently fail if not available during build
		// This is expected during build phase
	}
}

export default nextConfig;
