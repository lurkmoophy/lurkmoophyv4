import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';

const INPUT_DIR = join(process.cwd(), 'src/assets/posters');
const OUTPUT_DIR = join(process.cwd(), 'public/images/posters');

// Generate clean name from filename
function getCleanName(filename: string): string {
	const baseName = basename(filename, extname(filename));
	return baseName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
}

// Check if image has already been compressed
function isAlreadyCompressed(filename: string): boolean {
	const cleanName = getCleanName(filename);
	const largePath = join(OUTPUT_DIR, 'large', `${cleanName}.webp`);
	const mediumPath = join(OUTPUT_DIR, 'medium', `${cleanName}.webp`);
	
	return existsSync(largePath) && existsSync(mediumPath);
}

// Ensure output directories exist
async function ensureDirectories() {
	const dirs = [
		OUTPUT_DIR,
		join(OUTPUT_DIR, 'large'),
		join(OUTPUT_DIR, 'medium'),
	];

	for (const dir of dirs) {
		if (!existsSync(dir)) {
			await mkdir(dir, { recursive: true });
		}
	}
}

// Compress a single image
async function compressImage(filename: string) {
	const inputPath = join(INPUT_DIR, filename);
	const cleanName = getCleanName(filename);
	
	const largePath = join(OUTPUT_DIR, 'large', `${cleanName}.webp`);
	const mediumPath = join(OUTPUT_DIR, 'medium', `${cleanName}.webp`);

	try {
		const image = sharp(inputPath);

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

		console.log(`✓ Compressed ${filename} -> ${cleanName}.webp`);
	} catch (error) {
		console.error(`✗ Error compressing ${filename}:`, error);
		throw error;
	}
}

// Main compression function
async function compressPosters() {
	console.log('🖼️  Compressing poster images...\n');

	try {
		// Ensure output directories exist
		await ensureDirectories();

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

		// Filter out already compressed files
		const newFiles = imageFiles.filter((file) => !isAlreadyCompressed(file));
		const skippedCount = imageFiles.length - newFiles.length;

		if (skippedCount > 0) {
			console.log(`⏭️  Skipping ${skippedCount} already compressed image(s)\n`);
		}

		if (newFiles.length === 0) {
			console.log('✅ All images have already been compressed!');
			return;
		}

		console.log(`🆕 Found ${newFiles.length} new image(s) to compress\n`);

		// Compress only new images
		await Promise.all(newFiles.map(compressImage));

		console.log(`\n✅ Successfully compressed ${newFiles.length} image(s)`);
		console.log(`   Large versions: public/images/posters/large/`);
		console.log(`   Medium versions: public/images/posters/medium/`);
	} catch (error) {
		console.error('Error compressing posters:', error);
		process.exit(1);
	}
}

// Run the script
compressPosters();

export default compressPosters;

