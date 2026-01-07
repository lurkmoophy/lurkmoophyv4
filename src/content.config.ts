import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
		schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.string().optional(),
			customLayout: z.string().optional(),
			tags: z.preprocess(
				(val) => {
					if (typeof val === 'string') {
						return val.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
					}
					return val;
				},
				z.array(z.string()).optional()
			),
		}),
});

const productDesign = defineCollection({
	// Load Markdown and MDX files in the `src/content/product-design/` directory.
	loader: glob({ base: './src/content/product-design', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
		schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			timeline: z.string().optional(),
			heroImage: z.string().optional(),
			customLayout: z.string().optional(),
			client: z.string().optional(),
			role: z.string().optional(),
			tags: z.preprocess(
				(val) => {
					if (typeof val === 'string') {
						return val.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
					}
					return val;
				},
				z.array(z.string()).optional()
			),
		}),
});

export const collections = { blog, productDesign };
