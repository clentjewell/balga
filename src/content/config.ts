import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    /** Optional shorter <title> when the headline is too long for a SERP. */
    seoTitle: z.string().optional(),
    description: z.string(),
    excerpt: z.string(),
    date: z.string(),
    dateISO: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    order: z.number(),
  }),
});

export const collections = { blog };
