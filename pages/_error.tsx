import NextError from 'next/error';
import SystemState from '../libs/components/common/SystemState';
function ErrorPage({ statusCode }: { statusCode: number }) {
	return (
		<SystemState
			code={String(statusCode || 500)}
			title="A moment to reset."
			description="We could not open this page. Try again or explore another stay."
		/>
	);
}
ErrorPage.getInitialProps = NextError.getInitialProps;
export default ErrorPage;
