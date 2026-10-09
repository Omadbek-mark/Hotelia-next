const { test } = require('node:test'),
	assert = require('node:assert/strict'),
	fs = require('node:fs'),
	ts = require('typescript');
require.extensions['.ts'] = (m, f) =>
	m._compile(
		ts.transpileModule(fs.readFileSync(f, 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
		}).outputText,
		f,
	);
const { parseHostQuery, socialPage, isMemberId, isFollowing, socialHref } = require('../../libs/social/query.ts');
test('host URLs allow only supported sorting, scalar nickname and bounded integer pages', () => {
	for (const query of [
		{ page: '0' },
		{ page: ['1', '2'] },
		{ page: '1.5' },
		{ sort: 'memberHotels' },
		{ sort: '__proto__' },
		{ text: 'a'.repeat(101) },
		{ text: ['matt'] },
	])
		assert.ok(parseHostQuery(query).error);
	const input = parseHostQuery({ page: '2', sort: 'memberFollowers', text: '  matt  ' }).input;
	assert.deepEqual(input, { page: 2, limit: 6, sort: 'memberFollowers', direction: 'DESC', search: { text: 'matt' } });
	assert.equal(socialPage('1000001'), undefined);
	assert.equal(socialPage(undefined), 1);
});
test('follow state belongs to the viewer and target, with validated member links', () => {
	const records = [{ followerId: 'viewer', followingId: 'host', myFollowing: true }];
	assert.equal(isFollowing(records, 'viewer', 'host'), true);
	assert.equal(isFollowing(records, 'other', 'host'), false);
	assert.equal(isFollowing(records, 'viewer', 'other'), false);
	assert.equal(isMemberId('a'.repeat(24)), true);
	assert.equal(isMemberId(['a'.repeat(24)]), false);
	assert.equal(
		socialHref('/member', { memberId: 'a'.repeat(24), category: 'followers', networkPage: '2' }),
		'/member?memberId=' + 'a'.repeat(24) + '&category=followers&networkPage=2',
	);
});
