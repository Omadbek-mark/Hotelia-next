import { gql } from '@apollo/client';
import { initializeApollo } from '../../apollo/client';

export type ImageTarget = 'member' | 'hotel' | 'room' | 'article';
const IMAGE_UPLOADER = gql`
	mutation ImageUploader($file: Upload!, $target: String!) {
		imageUploader(file: $file, target: $target)
	}
`;
const IMAGES_UPLOADER = gql`
	mutation ImagesUploader($files: [Upload!]!, $target: String!) {
		imagesUploader(files: $files, target: $target)
	}
`;

function validateImage(file: File) {
	if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) throw new Error('Choose a JPG or PNG image.');
	if (!file.size || file.size > 15_000_000) throw new Error('Each image must be under 15 MB.');
}

export async function uploadImage(file: File, target: ImageTarget): Promise<string> {
	validateImage(file);
	const { data } = await initializeApollo().mutate<{ imageUploader: string }>({
		mutation: IMAGE_UPLOADER, variables: { file, target },
	});
	if (!data?.imageUploader) throw new Error('Image upload failed.');
	return data.imageUploader;
}

export async function uploadImages(files: File[], target: ImageTarget): Promise<string[]> {
	if (!files.length || files.length > 10) throw new Error('Choose between 1 and 10 images.');
	files.forEach(validateImage);
	const { data } = await initializeApollo().mutate<{ imagesUploader: string[] }>({
		mutation: IMAGES_UPLOADER, variables: { files, target },
	});
	if (!data?.imagesUploader) throw new Error('Image upload failed.');
	return data.imagesUploader;
}
