/**
 * @file check-env.js
 * Script to validate environment variables before deployment
 */

import 'dotenv/config';

/**
 * Validates if a required environment variable exists
 * @param {string} varName - Name of the environment variable
 * @returns {boolean} - True if variable exists, false otherwise
 */
function checkRequiredVar(varName) {
	const value = process.env[varName];
	if (!value) {
		console.error(`❌ ${varName} is not defined in your environment`);
		return false;
	}
	return true;
}

/**
 * Main validation function
 */
function validateEnvironment() {
	console.log('🔍 Checking environment variables before deployment...');
	let isValid = true;

	// Check if required variables exist
	const requiredVars = ['DATABASE_URL', 'PUBLIC_GOOGLE_MAPS_API_KEY'];
	for (const varName of requiredVars) {
		if (!checkRequiredVar(varName)) {
			isValid = false;
		}
	}

	if (!isValid) {
		process.exit(1);
	}

	// Check DATABASE_URL
	const databaseUrl = process.env.DATABASE_URL;
	if (databaseUrl.toLowerCase().includes('development')) {
		console.error('❌ Deployment blocked: DATABASE_URL contains "development"');
		console.error('Current DATABASE_URL:', databaseUrl);
		console.error('Please update your environment variables to use the production database URL');
		process.exit(1);
	}

	// Check Google Maps API Key
	const mapsApiKey = process.env.PUBLIC_GOOGLE_MAPS_API_KEY;
	if (mapsApiKey.includes('StQX7Q')) {
		console.error(
			'❌ Deployment blocked: PUBLIC_GOOGLE_MAPS_API_KEY contains development key pattern'
		);
		console.error(
			'Please update your environment variables to use the production Google Maps API key'
		);
		process.exit(1);
	}

	console.log('✅ Environment check passed: All variables are valid');
	process.exit(0);
}

// Run validation
validateEnvironment();
