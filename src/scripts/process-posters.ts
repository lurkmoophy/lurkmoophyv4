import sharp from 'sharp';
import { readdir, mkdir, writeFile, readFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';
import { createWorker } from 'tesseract.js';

const INPUT_DIR = join(process.cwd(), 'src/assets/posters');
const OUTPUT_DIR = join(process.cwd(), 'public/images/posters');
const METADATA_FILE = join(process.cwd(), 'src/data/posters.json');

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

// Check if image has already been processed
function isAlreadyProcessed(filename: string, existingData: any[]): boolean {
	const cleanName = getCleanName(filename);
	const largePath = join(OUTPUT_DIR, 'large', `${cleanName}.webp`);
	const mediumPath = join(OUTPUT_DIR, 'medium', `${cleanName}.webp`);
	
	// Check if output files exist
	const outputsExist = existsSync(largePath) && existsSync(mediumPath);
	
	// Check if data exists in JSON
	const dataExists = existingData.some((poster) => poster.filename === filename || poster.id === cleanName);
	
	return outputsExist && dataExists;
}

// Ensure output directories exist
async function ensureDirectories() {
	const dirs = [
		OUTPUT_DIR,
		join(OUTPUT_DIR, 'large'),
		join(OUTPUT_DIR, 'medium'),
		join(process.cwd(), 'src/data'),
	];

	for (const dir of dirs) {
		if (!existsSync(dir)) {
			await mkdir(dir, { recursive: true });
		}
	}
}

// Extract metadata from OCR text
function extractMetadata(text: string, filename: string): {
	bandName: string | null;
	date: string | null;
	venue: string | null;
	location: string | null;
	rawText: string;
} {
	const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
	
	// Try to extract date (common patterns: DD/MM/YYYY, DD-MM-YYYY, Month DD, YYYY, etc.)
	const datePatterns = [
		/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
		/\b(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i,
		/\b((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b/i,
		/\b(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})\b/i,
	];
	
	let date: string | null = null;
	for (const pattern of datePatterns) {
		const match = text.match(pattern);
		if (match) {
			date = match[1];
			break;
		}
	}

	// Try to extract location (common patterns: city names, "at [venue]", etc.)
	// UK cities and common venue words
	const locationPatterns = [
		/\b(London|Brighton|Manchester|Birmingham|Leeds|Liverpool|Bristol|Glasgow|Edinburgh|Cardiff|Newcastle|Nottingham|Sheffield|Leicester|Coventry|Belfast|Southampton|Portsmouth|York|Cambridge|Oxford|Bath|Canterbury|Norwich|Ipswich|Exeter|Plymouth|Bournemouth|Reading|Slough|Swindon|Milton Keynes|Peterborough|Luton|Watford|Croydon|Southend|Northampton|Derby|Wolverhampton|Stoke|Southampton|Salford|Aberdeen|Dundee|Westminster|Kingston|Guildford|Blackpool|Middlesbrough|Bolton|Stockport|Oldham|Rotherham|Wigan|Sunderland|Walsall|Rochdale|Solihull|Ipswich|Maidstone|Blackburn|Colchester|Burnley|Bedford|Grimsby|Carlisle|Doncaster|West Bromwich|Worcester|Gateshead|Huddersfield|Basildon|Hastings|Warrington|Hemel Hempstead|Stevenage|Hartlepool|Scunthorpe|Lowestoft|Gloucester|Chester|Woking|Eastbourne|Bury|Darlington|Halifax|Aylesbury|Macclesfield|Southport|Kettering|Corby|Redditch|Tamworth|Scarborough|Dartford|Brentwood|Bracknell|Chippenham|Bury St Edmunds|Folkestone|Harlow|Gosport|Epsom|Winchester|Torquay|Harrogate|Tunbridge Wells|Runcorn|St Helens|South Shields|Loughborough|Gravesend|Nuneaton|Stafford|Weymouth|Keighley|Barrow|Hereford|Ellesmere Port|Hitchin|Letchworth|Welwyn Garden City|Stevenage|Hertford|Ware|Bishop's Stortford|Hoddesdon|Broxbourne|Cheshunt|Waltham Cross|Enfield|Barnet|Potters Bar|Hatfield|St Albans|Harpenden|Hemel Hempstead|Berkhamsted|Tring|Aylesbury|Leighton Buzzard|Dunstable|Luton|Hitchin|Letchworth|Welwyn Garden City|Stevenage|Hertford|Ware|Bishop's Stortford|Hoddesdon|Broxbourne|Cheshunt|Waltham Cross|Enfield|Barnet|Potters Bar|Hatfield|St Albans|Harpenden)\b/i,
		/\b(at|@|venue|location|where|place)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
	];
	
	let location: string | null = null;
	for (const pattern of locationPatterns) {
		const match = text.match(pattern);
		if (match) {
			location = match[1] || match[2];
			break;
		}
	}

	// Try to extract venue (look for common venue words)
	const venuePatterns = [
		/\b(at|@|venue)\s+([A-Z][a-zA-Z0-9\s&'-]+(?:Theatre|Hall|Club|Bar|Pub|Venue|Academy|Arena|Centre|Center|Studio|Room|Stage|Lounge|Cafe|Café|Tavern|Inn|House|Palace|Castle|Gardens|Park|Square|Market|Exchange|Assembly|Union|Institute|Gallery|Museum|Library|Church|Cathedral|Chapel|Temple|Mosque|Synagogue|Shrine|Monument|Memorial|Statue|Fountain|Bridge|Tower|Gate|Wall|Street|Road|Lane|Avenue|Drive|Way|Close|Crescent|Grove|Gardens|Park|Square|Market|Exchange|Assembly|Union|Institute|Gallery|Museum|Library|Church|Cathedral|Chapel|Temple|Mosque|Synagogue|Shrine|Monument|Memorial|Statue|Fountain|Bridge|Tower|Gate|Wall|Street|Road|Lane|Avenue|Drive|Way|Close|Crescent|Grove))\b/i,
		/\b([A-Z][a-zA-Z0-9\s&'-]+(?:Theatre|Hall|Club|Bar|Pub|Venue|Academy|Arena|Centre|Center|Studio|Room|Stage|Lounge|Cafe|Café|Tavern|Inn|House|Palace|Castle|Gardens|Park|Square|Market|Exchange|Assembly|Union|Institute|Gallery|Museum|Library|Church|Cathedral|Chapel|Temple|Mosque|Synagogue|Shrine|Monument|Memorial|Statue|Fountain|Bridge|Tower|Gate|Wall|Street|Road|Lane|Avenue|Drive|Way|Close|Crescent|Grove))\b/,
	];
	
	let venue: string | null = null;
	for (const pattern of venuePatterns) {
		const match = text.match(pattern);
		if (match) {
			venue = match[2] || match[1];
			break;
		}
	}

	// Try to extract band name (usually the largest text or first prominent line)
	// For now, take the first substantial line that's not a date/venue/location
	let bandName: string | null = null;
	for (const line of lines) {
		if (line.length > 3 && 
			!line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/) && 
			!line.toLowerCase().includes('venue') &&
			!line.toLowerCase().includes('location') &&
			!line.toLowerCase().includes('date') &&
			!line.toLowerCase().includes('ticket') &&
			!line.toLowerCase().includes('doors') &&
			!line.toLowerCase().includes('show')) {
			bandName = line;
			break;
		}
	}

	return {
		bandName,
		date,
		venue,
		location,
		rawText: text,
	};
}

// Process a single image
async function processImage(filename: string, worker: any) {
	const inputPath = join(INPUT_DIR, filename);
	const cleanName = getCleanName(filename);
	
	const largePath = join(OUTPUT_DIR, 'large', `${cleanName}.webp`);
	const mediumPath = join(OUTPUT_DIR, 'medium', `${cleanName}.webp`);

	try {
		const image = sharp(inputPath);
		const metadata = await image.metadata();

		// Process large version (max 1200px width)
		await image
			.clone()
			.resize(1200, null, {
				withoutEnlargement: true,
				fit: 'inside',
			})
			.webp({
				quality: 85,
				effort: 6,
			})
			.toFile(largePath);

		// Process medium version (max 600px width)
		await image
			.clone()
			.resize(600, null, {
				withoutEnlargement: true,
				fit: 'inside',
			})
			.webp({
				quality: 80,
				effort: 6,
			})
			.toFile(mediumPath);

		// Perform OCR on the original image
		console.log(`  📖 Extracting text from ${filename}...`);
		const { data: { text } } = await worker.recognize(inputPath);
		const extractedMetadata = extractMetadata(text, filename);

		console.log(`✓ Processed ${filename} -> ${cleanName}.webp`);

		return {
			id: cleanName,
			filename: filename,
			large: `/images/posters/large/${cleanName}.webp`,
			medium: `/images/posters/medium/${cleanName}.webp`,
			...extractedMetadata,
		};
	} catch (error) {
		console.error(`✗ Error processing ${filename}:`, error);
		throw error;
	}
}

// Main processing function
async function processPosters() {
	console.log('🖼️  Processing poster images...\n');

	try {
		// Ensure output directories exist
		await ensureDirectories();

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

		// Filter out already processed files
		const newFiles = imageFiles.filter((file) => !isAlreadyProcessed(file, existingData));
		const skippedCount = imageFiles.length - newFiles.length;

		if (skippedCount > 0) {
			console.log(`⏭️  Skipping ${skippedCount} already processed image(s)\n`);
		}

		if (newFiles.length === 0) {
			console.log('✅ All images have already been processed!');
			return;
		}

		console.log(`🆕 Found ${newFiles.length} new image(s) to process\n`);

		// Initialize Tesseract worker only if we have new files
		let worker: any = null;
		if (newFiles.length > 0) {
			console.log('🔍 Initializing OCR engine...\n');
			worker = await createWorker('eng');
			await worker.setParameters({
				tessedit_pageseg_mode: '6', // Assume uniform block of text
			});
		}

		// Process only new images (with OCR)
		const newPosterData = await Promise.all(
			newFiles.map((file) => processImage(file, worker))
		);

		// Terminate worker
		if (worker) {
			await worker.terminate();
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

		console.log(`\n✅ Successfully processed ${newFiles.length} new image(s)`);
		console.log(`   Total posters: ${allPosterData.length}`);
		console.log(`   Large versions: public/images/posters/large/`);
		console.log(`   Medium versions: public/images/posters/medium/`);
		console.log(`   Metadata: src/data/posters.json`);
	} catch (error) {
		console.error('Error processing posters:', error);
		process.exit(1);
	}
}

// Run the script
processPosters();

export default processPosters;

