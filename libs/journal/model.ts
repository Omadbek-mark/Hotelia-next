import { BoardArticleCategory } from '../types/hotelia/enums';
export const categories: Record<BoardArticleCategory, string> = {
	FREE: 'Field notes',
	TRAVEL_TIPS: 'Travel tips',
	DESTINATION_GUIDE: 'City guides',
	TRAVEL_STORY: 'Travel stories',
	HOTEL_NEWS: 'Hotel news',
};
export function articleInput(title: string, content: string, image: string, category: BoardArticleCategory) {
	const articleTitle = title.trim(),
		articleContent = content.trim();
	if (articleTitle.length < 3 || articleTitle.length > 50) throw new Error('Use 3–50 characters for your title.');
	if (articleContent.length < 3 || articleContent.length > 250) throw new Error('Use 3–250 characters for your story.');
	if (!Object.keys(categories).includes(category)) throw new Error('Choose a category.');
	return { articleTitle, articleContent, articleImage: image, articleCategory: category };
}
// Render historical rich text as inert text; never execute stored HTML.
export function storyText(content: string) {
	return content
		.replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, '')
		.replace(/<\/(p|div|h[1-6])>|<br\s*\/?\s*>/gi, '\n')
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.trim();
}
