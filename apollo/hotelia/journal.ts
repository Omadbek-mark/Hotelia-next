import { gql } from '@apollo/client';
const fields = gql`
	fragment JournalFields on BoardArticle {
		_id
		memberId
		articleCategory
		articleTitle
		articleContent
		articleImage
		articleViews
		articleLikes
		articleComments
		createdAt
		meLiked {
			myFavorite
		}
		memberData {
			_id
			memberNick
			memberImage
			memberDesc
		}
	}
`;
export const JOURNAL = gql`
	query Journal($input: BoardArticlesInquiry!) {
		getBoardArticles(input: $input) {
			list {
				...JournalFields
			}
			metaCounter {
				total
			}
		}
	}
	${fields}
`;
export const ARTICLE = gql`
	query JournalArticle($articleId: String!) {
		getBoardArticle(articleId: $articleId) {
			...JournalFields
		}
	}
	${fields}
`;
export const CREATE_ARTICLE = gql`
	mutation PublishJournal($input: BoardArticleInput!) {
		createBoardArticle(input: $input) {
			_id
		}
	}
`;
export const UPDATE_ARTICLE = gql`
	mutation UpdateJournal($input: BoardArticleUpdate!) {
		updateBoardArticle(input: $input) {
			_id
		}
	}
`;
export const LIKE_ARTICLE = gql`
	mutation LikeJournal($articleId: String!) {
		likeTargetBoardArticle(articleId: $articleId) {
			_id
			articleLikes
		}
	}
`;
export const COMMENTS = gql`
	query JournalComments($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				memberId
				commentContent
				createdAt
				memberData {
					_id
					memberNick
					memberImage
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
export const CREATE_COMMENT = gql`
	mutation JournalComment($input: CommentInput!) {
		createComment(input: $input) {
			_id
		}
	}
`;
export const UPDATE_COMMENT = gql`
	mutation UpdateJournalComment($input: CommentUpdate!) {
		updateComment(input: $input) {
			_id
		}
	}
`;
