import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';

const INPUT_DIR = join(process.cwd(), 'src/assets/posters');
const OUTPUT_DIR = join(process.cwd(), 'public/images/posters');
const METADATA_FILE = join(process.cwd(), 'src/data/posters.json');

// Get API key from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
	console.error('❌ OPENAI_API_KEY environment variable is not set');
	console.error('   Please set it before running this script:');
	console.error('   export OPENAI_API_KEY=your-api-key-here');
	process.exit(1);
}

// Generate clean name from filename
function getCleanName(filename: string): string {
	const baseName = basename(filename, extname(filename));
	return baseName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
}

// Load existing poster data
async function loadExistingData(): Promise<any[]> {
	if (!existsSync(METADATA_FILE)) {
		return [];
	}

	try {
		const data = await readFile(METADATA_FILE, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		console.warn('Could not read existing posters.json, starting fresh');
		return [];
	}
}

// Check if metadata has already been extracted
function hasMetadata(filename: string, existingData: any[]): boolean {
	const cleanName = getCleanName(filename);
	return existingData.some((poster) => poster.filename === filename || poster.id === cleanName);
}

// Convert image to base64
async function imageToBase64(imagePath: string): Promise<string> {
	const imageBuffer = await readFile(imagePath);
	return imageBuffer.toString('base64');
}

// Get image MIME type from file extension
function getImageMimeType(filename: string): string {
	const ext = extname(filename).toLowerCase();
	const mimeTypes: Record<string, string> = {
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.png': 'image/png',
		'.webp': 'image/webp',
	};
	return mimeTypes[ext] || 'image/jpeg';
}

// Format date to "Month YYYY" format
function formatDate(dateStr: string | null): string | null {
	if (!dateStr) return null;

	// Try to parse various date formats
	const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	
	// Try to extract month and year
	const patterns = [
		/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, // DD/MM/YYYY or DD-MM-YYYY
		/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i, // Month DD, YYYY
		/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i, // DD Month YYYY
		/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i, // Full month name
	];

	for (const pattern of patterns) {
		const match = dateStr.match(pattern);
		if (match) {
			let month: string | null = null;
			let year: string | null = null;

			if (pattern === patterns[0]) {
				// DD/MM/YYYY format - assume MM is month
				const monthNum = parseInt(match[2]);
				if (monthNum >= 1 && monthNum <= 12) {
					month = monthNames[monthNum - 1];
					year = match[3].length === 2 ? `20${match[3]}` : match[3];
				}
			} else if (pattern === patterns[1] || pattern === patterns[3]) {
				// Month name first
				const monthStr = match[1].toLowerCase();
				month = monthNames.find(m => monthStr.startsWith(m.toLowerCase())) || 
				        monthNames[new Date(`${monthStr} 1, 2000`).getMonth()] || null;
				year = match[3] || match[2];
			} else if (pattern === patterns[2]) {
				// Day first, then month
				const monthStr = match[2].toLowerCase();
				month = monthNames.find(m => monthStr.startsWith(m.toLowerCase())) || null;
				year = match[3];
			}

			if (month && year) {
				return `${month} ${year}`;
			}
		}
	}

	// If we can't parse it, try to extract just year
	const yearMatch = dateStr.match(/\b(20\d{2})\b/);
	if (yearMatch) {
		return yearMatch[1];
	}

	return null;
}

// Extract metadata using AI vision
async function extractMetadataFromImage(filename: string): Promise<any | null> {
	const inputPath = join(INPUT_DIR, filename);
	const cleanName = getCleanName(filename);
	
	// Check if compressed versions exist
	const largePath = join(OUTPUT_DIR, 'large', `${cleanName}.webp`);
	const mediumPath = join(OUTPUT_DIR, 'medium', `${cleanName}.webp`);
	
	if (!existsSync(largePath) || !existsSync(mediumPath)) {
		console.log(`⚠️  Skipping ${filename} - compressed versions not found. Run compress-posters first.`);
		return null;
	}

	try {
		// Convert image to base64
		const imageBase64 = await imageToBase64(inputPath);
		const mimeType = getImageMimeType(filename);

		// Call OpenAI Vision API
		console.log(`  🤖 Analyzing ${filename} with AI...`);
		
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: 'gpt-4o',
				messages: [
					{
						role: 'user',
						content: [
							{
								type: 'text',
								text: `Analyze this gig poster and extract the following information. Return ONLY a valid JSON object with these exact keys:
{
  "artist": "string or null - The biggest or top band/artist name (prefer the largest text if sizes differ, otherwise the top one)",
  "date": "string or null - The month and year in format 'Month YYYY' (e.g., 'Feb 2025', 'Nov 2024'). Extract only month and year, not the day.",
  "location": "string - If there's a city name visible, use that. If multiple cities from different countries, determine the country and use that. If no city/country visible or unclear, default to 'UK'. Examples: 'London', 'Brighton', 'UK', 'USA', etc."
}

Important:
- For artist: Look at text size and position. The biggest text is usually the headliner. If all text is similar size, use the topmost band name.
- For date: Extract ONLY month and year, format as 'Jan 2025', 'Feb 2025', etc. Use 3-letter month abbreviations.
- For location: Prefer city names. If multiple locations, try to determine the country. Default to 'UK' if unclear.
- Return valid JSON only, no additional text.`
							},
							{
								type: 'image_url',
								image_url: {
									url: `data:${mimeType};base64,${imageBase64}`,
								},
							},
						],
					},
				],
				max_tokens: 300,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`OpenAI API error: ${response.status} - ${error}`);
		}

		const data = await response.json();
		const content = data.choices[0]?.message?.content;

		if (!content) {
			throw new Error('No content returned from OpenAI API');
		}

		// Parse JSON response (might have markdown code blocks)
		let jsonContent = content.trim();
		if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/```$/, '').trim();
		}

		const extracted = JSON.parse(jsonContent);

		// Format the date
		const formattedDate = formatDate(extracted.date);

		console.log(`✓ Extracted metadata from ${filename}`);

		return {
			id: cleanName,
			filename: filename,
			large: `/images/posters/large/${cleanName}.webp`,
			medium: `/images/posters/medium/${cleanName}.webp`,
			bandName: extracted.artist || null,
			date: formattedDate,
			venue: null, // Not extracting venue for now
			location: extracted.location || 'UK',
			rawText: null, // Not storing raw OCR text anymore
		};
	} catch (error) {
		console.error(`✗ Error extracting metadata from ${filename}:`, error);
		throw error;
	}
}

// Main metadata extraction function
async function extractPosterMetadata() {
	console.log('🔍 Extracting poster metadata with AI vision...\n');

	try {
		// Ensure data directory exists
		const dataDir = join(process.cwd(), 'src/data');
		if (!existsSync(dataDir)) {
			await mkdir(dataDir, { recursive: true });
		}

		// Load existing data
		const existingData = await loadExistingData();
		console.log(`📋 Found ${existingData.length} previously processed poster(s)\n`);

		// Read all files from input directory
		const files = await readdir(INPUT_DIR);
		
		// Filter for image files
		const imageFiles = files.filter((file) => {
			const ext = extname(file).toLowerCase();
			return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
		});

		if (imageFiles.length === 0) {
			console.log('No image files found in src/assets/posters');
			return;
		}

		// Filter out files that already have metadata
		const newFiles = imageFiles.filter((file) => !hasMetadata(file, existingData));
		const skippedCount = imageFiles.length - newFiles.length;

		if (skippedCount > 0) {
			console.log(`⏭️  Skipping ${skippedCount} already processed image(s)\n`);
		}

		if (newFiles.length === 0) {
			console.log('✅ All images have already been processed!');
			return;
		}

		console.log(`🆕 Found ${newFiles.length} new image(s) to process\n`);

		// Extract metadata from new images (process sequentially to avoid rate limits)
		const newPosterData: any[] = [];
		for (const file of newFiles) {
			try {
				const result = await extractMetadataFromImage(file);
				if (result) {
					newPosterData.push(result);
				}
				// Small delay to avoid rate limits
				await new Promise(resolve => setTimeout(resolve, 500));
			} catch (error) {
				console.error(`Failed to process ${file}, continuing...`);
			}
		}

		// Merge new data with existing data
		// Remove any existing entries that match new ones (in case of filename changes)
		const existingIds = new Set(newPosterData.map(p => p.id));
		const filteredExisting = existingData.filter(p => !existingIds.has(p.id));
		const allPosterData = [...filteredExisting, ...newPosterData];

		// Write merged metadata to JSON file
		await writeFile(
			METADATA_FILE,
			JSON.stringify(allPosterData, null, 2),
			'utf-8'
		);

		console.log(`\n✅ Successfully extracted metadata from ${newPosterData.length} image(s)`);
		console.log(`   Total posters: ${allPosterData.length}`);
		console.log(`   Metadata: src/data/posters.json`);
	} catch (error) {
		console.error('Error extracting poster metadata:', error);
		process.exit(1);
	}
}

// Run the script
extractPosterMetadata();

export default extractPosterMetadata;
