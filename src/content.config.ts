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

export const collections = { blog };
